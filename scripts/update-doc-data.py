#!/usr/bin/env python3
"""Build component definitions and package snapshots for p11, Sisyphus and the 11.1 ISO."""
import argparse
import datetime as dt
import hashlib
import json
import pathlib
import re
import subprocess
import tempfile
import time
import tomllib
import urllib.error
import urllib.request
from provides import ProvidesReader, branch_providers, image_providers

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "doc-data"
UPSTREAM = "https://altlinux.space/alterator/alt-components-base.git"
EXPORT = "https://rdb.altlinux.org/api/export/branch_binary_packages/p11"
CATALOGUE_SOURCE = "https://rdb.altlinux.org/api/site/source_package_versions?name=alt-components-base"


def url_json(url):
    with urllib.request.urlopen(url, timeout=90) as response:
        return json.load(response)


def read_definitions(repo, tag):
    # Resolve only a published tag: an identically named branch or master
    # must never silently supply definitions for a repository package.
    revision = subprocess.check_output(
        ["git", "-C", str(repo), "rev-parse", "--verify", f"refs/tags/{tag}^{{commit}}"], text=True).strip()
    subprocess.run(["git", "-C", str(repo), "checkout", "-q", "--detach", revision], check=True)
    categories = {}
    for path in (repo / "categories").rglob("*.category"):
        raw = tomllib.loads(path.read_text())
        categories[raw["name"]] = {
            "name": raw["name"], "parent": raw.get("category"),
            "title": raw.get("display_name", {}).get("ru", raw["name"]),
        }
    components = {}
    for path in (repo / "components").rglob("*.component"):
        raw = tomllib.loads(path.read_text())
        components[raw["name"]] = {
            "name": raw["name"], "title": raw.get("display_name", {}).get("ru", raw["name"]),
            "category": raw.get("category"),
            "path": path.relative_to(repo).as_posix(),
            "packages": {name: options for name, options in raw.get("packages", {}).items()},
        }
    editions = {}
    for name in ("edition_server", "edition_domain"):
        path = repo / "editions" / name / f"{name}.edition"
        raw = tomllib.loads(path.read_text())
        editions[name] = {
            "name": name, "title": raw["display_name"]["ru"],
            "arches": raw.get("arches", []),
            "sections": {key: {"title": value.get("display_name", {}).get("ru", key),
                               "components": value.get("components", [])}
                         for key, value in raw.get("sections", {}).items()},
        }
    return {"revision": revision, "tag": tag, "source": UPSTREAM,
            "categories": categories, "components": components, "editions": editions}


def binary_index(exports, arch, branch="p11"):
    result = {}
    for export, expected in ((exports["noarch"], "noarch"), (exports[arch], arch)):
        assert export.get("request_args", {}).get("branch") == branch
        assert export.get("request_args", {}).get("arch") == expected
        assert export.get("length", 0) > (20000 if expected != "noarch" else 1000), "Incomplete repository export"
        for row in export["packages"]:
            if row.get("arch") != expected or not all(row.get(k) is not None for k in ("name", "version", "release", "source")):
                continue
            evr = (f'{row["epoch"]}:' if row.get("epoch") else "") + row["version"] + "-" + row["release"]
            result[row["name"]] = {"evr": evr, "source": row["source"], "arch": expected}
    return result


def current_definition_package(indexes, source_versions):
    """Use the active p11 binary export, not the highest upstream/history tag.

    source_package_versions may include several historic builds per branch.
    Match it to the actual repository package before accepting its source hash.
    Any inconsistency aborts the update before working snapshots are written.
    """
    if source_versions.get("request_args", {}).get("name") != "alt-components-base":
        raise RuntimeError("Wrong source package response for alt-components-base")
    version = None
    for arch, index in indexes.items():
        package = index.get("alt-components-base", {})
        evr = package.get("evr", "")
        if (package.get("source") != "alt-components-base" or package.get("arch") != "noarch" or
                not re.fullmatch(r"(?:[0-9]+:)?[^\s:-]+-[^\s:]+", evr)):
            raise RuntimeError(f"Active p11 alt-components-base could not be verified on {arch}")
        if version is not None and evr != version:
            raise RuntimeError("p11 alt-components-base versions differ between architectures")
        version = evr
        # edition_domain is a definition in this source tree, not a separately
        # published alt-editions-domain RPM. Verify the actual Server RPM.
        for name in ("alt-editions-server",):
            edition = index.get(name, {})
            if edition.get("source") != "alt-components-base" or edition.get("evr") != evr:
                raise RuntimeError(f"p11 {name} does not match alt-components-base on {arch}")
    if version is None:
        raise RuntimeError("No p11 package indexes supplied")
    tag = re.sub(r"^[0-9]+:", "", version)
    matching = [row for row in source_versions.get("versions", [])
                if row.get("branch") == "p11" and
                f'{row.get("version", "")}-{row.get("release", "")}' == tag]
    hashes = {str(row["pkghash"]) for row in matching if row.get("pkghash")}
    if len(hashes) != 1 or any(not row.get("pkghash") for row in matching):
        raise RuntimeError("Active p11 source build does not match alt-components-base binary export")
    return tag, {"name": "alt-components-base", "evr": version, "branch": "p11",
                 "sourceHash": hashes.pop(), "metadataSource": CATALOGUE_SOURCE}


def concrete_package(options, arch):
    return (not options.get("kernel_module") and
            (not options.get("arch") or arch in options["arch"]) and
            arch not in options.get("exclude_arch", []))


def image_epoch(pair):
    name, package = pair
    url = f"https://rdb.altlinux.org/api/site/package_changelog/{package['hash']}?changelog_last=1"
    for attempt in range(5):
        time.sleep(0.3)
        try:
            result = url_json(url)
            break
        except urllib.error.HTTPError as error:
            if error.code != 429 or attempt == 4:
                raise
            time.sleep(2 ** (attempt + 1))
    entries = result.get("changelog", [])
    evr = entries[0].get("evr", "") if entries else ""
    if re.fullmatch(r"(?:[0-9]+:)?[^\s:-]+-[^\s:]+", evr) and evr.split(":")[-1] == package["evr"]:
        return name, evr, url
    return name, None, url


def write_atomic(path, value):
    encoded = (json.dumps(value, ensure_ascii=False, separators=(",", ":")) + "\n").encode()
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(".tmp")
    temp.write_bytes(encoded)
    temp.replace(path)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", type=pathlib.Path, help="existing clone for offline use")
    parser.add_argument("--release", default="11.1", help="product release, e.g. 11.1")
    args = parser.parse_args()
    if not re.fullmatch(r"\d+\.\d+(?:\.\d+)?", args.release):
        raise ValueError("Invalid release identifier")
    iso_lists = {arch: f"https://download.basealt.ru/pub/distributions/ALTLinux/p11/images/server/{arch}/alt-server-{args.release}-{arch}.iso.txt"
                 for arch in ("x86_64", "aarch64")}
    now = dt.datetime.now(dt.timezone.utc).isoformat()
    with tempfile.TemporaryDirectory(prefix="doc-components-") as directory:
        repo = pathlib.Path(directory) / "repo"
        if args.repo:
            subprocess.run(["git", "clone", "-q", "--shared", str(args.repo), str(repo)], check=True)
        else:
            subprocess.run(["git", "clone", "-q", "--filter=blob:none", UPSTREAM, str(repo)], check=True)
        release_tags = set()
        for arch, url in iso_lists.items():
            with urllib.request.urlopen(url, timeout=30) as response:
                listing = response.read().decode("utf-8")
            match = re.search(r"/alt-editions-server-([0-9][^/\s]+)\.noarch\.rpm", listing)
            if not match:
                raise RuntimeError(f"11.1 edition package tag not confirmed by {arch} ISO listing")
            release_tags.add(match.group(1))
        if len(release_tags) != 1:
            raise RuntimeError(f"Edition package tags differ between ISO architectures: {release_tags}")
        release_tag = release_tags.pop()
        release_defs = read_definitions(repo, release_tag)
        exports = {branch: {arch: url_json(f"https://rdb.altlinux.org/api/export/branch_binary_packages/{branch}?arch={arch}")
                            for arch in ("noarch", "x86_64", "aarch64")}
                   for branch in ("p11", "sisyphus")}
        indexes = {branch: {arch: binary_index(exports[branch], arch, branch) for arch in ("x86_64", "aarch64")}
                   for branch in exports}
        definition_tag, definition_package = current_definition_package(indexes["p11"], url_json(CATALOGUE_SOURCE))
        current_defs = read_definitions(repo, definition_tag)
        current_defs["package"] = definition_package
        print(f"p11 alt-components-base: {definition_package['evr']} (tag {definition_tag}, source RPM {definition_package['sourceHash']})", flush=True)
        release_record = {
            "schema": 1, "id": "alt-components-base-" + release_tag, "release": args.release,
            "obtainedAt": now, "definitions": release_defs, "verifiedBy": iso_lists}
        pending = {}
        release_path = OUT / f"definitions-{args.release}.json"
        if release_path.exists():
            previous = json.loads(release_path.read_text())
            if previous["id"] != release_record["id"] or previous["definitions"]["revision"] != release_defs["revision"]:
                raise RuntimeError(f"Immutable release definitions differ: {release_path}")
        else:
            pending[release_path] = release_record
        verified_epoch_cache = {}
        metadata_cache_path = OUT / "rpm-provides-cache.json"
        metadata_cache = json.loads(metadata_cache_path.read_text()).get("packages", {}) if metadata_cache_path.exists() else {}
        provides_reader = ProvidesReader(url_json, metadata_cache)
        for arch in ("x86_64", "aarch64"):
            index = indexes["p11"][arch]
            names = set()
            for component in current_defs["components"].values():
                for name, options in component["packages"].items():
                    if concrete_package(options, arch):
                        names.add(name)
            for component in release_defs["components"].values():
                for name, options in component["packages"].items():
                    if concrete_package(options, arch):
                        names.add(name)
            packages = {name: index[name] for name in sorted(names) if name in index}
            # Keep the catalogue package even if future definitions stop
            # listing it explicitly: its version validates the selected tag.
            packages["alt-components-base"] = index["alt-components-base"]
            providers, provider_packages = branch_providers(provides_reader, "p11", names, index, arch)
            packages.update(provider_packages)
            digest = hashlib.sha256(json.dumps({"revision": current_defs["revision"], "catalogue": definition_package, "arch": arch,
                                               "packages": packages, "providers": providers}, sort_keys=True).encode()).hexdigest()[:16]
            snapshot = {"schema": 1, "id": f"p11-{arch}-{digest}", "branch": "p11", "arch": arch,
                        "obtainedAt": now, "source": EXPORT + "?arch=" + arch,
                        "definitions": current_defs, "packages": packages,
                        "providers": providers,
                        "missingExplicit": sorted(name for name, record in providers.items() if not record["candidates"]),
                        "note": "Explicit component packages; dependencies are not included."}
            pending[OUT / f"p11-{arch}.json"] = snapshot
            print(f"{snapshot['id']}: {len(packages)} binaries, {len(snapshot['missingExplicit'])} absent explicit names")
            sisyphus = indexes["sisyphus"][arch]
            sisyphus_packages = {name: sisyphus[name] for name in sorted(names) if name in sisyphus}
            sisyphus_providers, sisyphus_provider_packages = branch_providers(provides_reader, "sisyphus", names, sisyphus, arch)
            sisyphus_packages.update(sisyphus_provider_packages)
            sisyphus_digest = hashlib.sha256(json.dumps({"packages": sisyphus_packages, "providers": sisyphus_providers}, sort_keys=True).encode()).hexdigest()[:16]
            pending[OUT / f"sisyphus-{arch}.json"] = {
                "schema": 1, "id": f"sisyphus-{arch}-{sisyphus_digest}",
                "branch": "sisyphus", "arch": arch, "obtainedAt": now,
                "source": f"https://rdb.altlinux.org/api/export/branch_binary_packages/sisyphus?arch={arch}",
                "packages": sisyphus_packages, "providers": sisyphus_providers,
                "missingExplicit": sorted(name for name, record in sisyphus_providers.items() if not record["candidates"])}
            image_tag = f"p11:alt-server:::release.{args.release}.0:{arch}:install:iso"
            tag_info = url_json("https://rdb.altlinux.org/api/image/image_uuid_by_tag?tag=" + image_tag)
            if tag_info.get("request_args", {}).get("tag") != image_tag or not tag_info.get("uuid"):
                raise RuntimeError(f"Image tag could not be verified: {image_tag}")
            image_data = url_json("https://rdb.altlinux.org/api/image/image_packages?uuid=" + tag_info["uuid"])
            if image_data.get("request_args", {}).get("uuid") != tag_info["uuid"] or image_data.get("length", 0) < 1000 or len(image_data.get("packages", [])) != image_data["length"]:
                raise RuntimeError(f"Incomplete image package inventory: {image_tag}")
            image_packages = {}
            for pkg in image_data["packages"]:
                if not all(pkg.get(key) for key in ("name", "version", "release", "arch", "hash")):
                    raise RuntimeError(f"Incomplete package in image {image_tag}")
                name = pkg["name"]
                value = {"evr": pkg["version"] + "-" + pkg["release"],
                         "arch": pkg["arch"], "source": index.get(name, {}).get("source", name),
                         "epochKnown": False, "hash": pkg["hash"]}
                if name in image_packages and image_packages[name]["evr"] != value["evr"]:
                    raise RuntimeError(f"Ambiguous versions for {name} in image {image_tag}")
                image_packages[name] = value
            previous_image_path = OUT / f"image-{args.release}-{arch}.json"
            previous_image = json.loads(previous_image_path.read_text()) if previous_image_path.exists() else {}
            previous_packages = previous_image.get("packages", {})
            if previous_image and (previous_image.get("id") != tag_info["uuid"] or
                    set(previous_packages) != set(image_packages) or any(
                        previous_packages[name].get("hash") != pkg["hash"] or
                        previous_packages[name]["evr"].split(":")[-1] != pkg["evr"]
                        for name, pkg in image_packages.items())):
                raise RuntimeError(f"Immutable image inventory differs: {image_tag}")
            # A verified epoch belongs to the immutable ISO RPM, regardless
            # of whether its current p11 version still has a nonzero epoch.
            for name, package in image_packages.items():
                cached = previous_packages.get(name, {})
                if cached.get("epochKnown") and cached.get("epochSource"):
                    package.update({key: cached[key] for key in ("evr", "epochKnown", "epochSource")})
            image_provider_records = image_providers(provides_reader, names, image_packages,
                                                      [providers, sisyphus_providers], previous_image.get("providers"))
            epoch_names = names | {actual for record in image_provider_records.values() for actual in record["candidates"]}
            candidates = []
            for name in sorted(epoch_names):
                if name not in image_packages or name not in index or ":" not in index[name]["evr"]:
                    continue
                cached = previous_packages.get(name, {})
                cached = verified_epoch_cache.get(image_packages[name]["hash"], cached)
                if cached.get("hash") == image_packages[name]["hash"] and cached.get("epochKnown") and cached.get("epochSource"):
                    image_packages[name].update({key: cached[key] for key in ("evr", "epochKnown", "epochSource")})
                    verified_epoch_cache[image_packages[name]["hash"]] = image_packages[name]
                else:
                    candidates.append((name, image_packages[name]))
            resolved_epochs = [image_epoch(pair) for pair in candidates]
            for name, evr, source_url in resolved_epochs:
                if evr:
                    image_packages[name]["evr"] = evr
                    image_packages[name]["epochKnown"] = True
                    image_packages[name]["epochSource"] = source_url
                    verified_epoch_cache[image_packages[name]["hash"]] = image_packages[name]
            if image_packages.get("alt-editions-server", {}).get("evr") != release_tag:
                raise RuntimeError(f"Image edition version differs from release definitions: {image_tag}")
            image_page = f"https://packages.altlinux.org/ru/p11/images/alt-server/{image_tag}/packages/"
            pending[OUT / f"image-{args.release}-{arch}.json"] = {
                "schema": 1, "id": tag_info["uuid"], "release": args.release,
                "arch": arch, "inventoryKind": "image", "obtainedAt": now,
                "source": image_page, "definitions": release_defs,
                "packages": image_packages, "providers": image_provider_records,
                "note": "ALT Server ISO for both edition views; absent names are absent from image only. Image API omits epoch; tracked nonzero p11 epochs are checked by changelog at the exact binary hash (epochSource). Historical source names are inferred from current p11."}
            print(f"{tag_info['uuid']}: {len(image_packages)} image binaries ({arch}), {sum(bool(pkg.get('epochKnown')) for pkg in image_packages.values())} verified epochs; {len(candidates)} API checks this run")
            print(f"Provides ({arch}): {sum(bool(r['candidates']) for r in providers.values())} p11 aliases, {sum(bool(r['candidates']) for r in image_provider_records.values())} image aliases verified by RPM hash")
        pending[metadata_cache_path] = {"schema": 1, "packages": metadata_cache}
        for path, value in pending.items():
            write_atomic(path, value)


if __name__ == "__main__":
    main()
