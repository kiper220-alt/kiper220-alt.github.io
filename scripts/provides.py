"""Resolve explicit component names without traversing Requires dependencies."""
import time
import urllib.error
import urllib.parse

API = "https://rdb.altlinux.org/api"


class ProvidesReader:
    def __init__(self, fetch, cache=None):
        self.fetch = fetch
        self.cache = cache if cache is not None else {}
        self.lookups = {}

    def request(self, url, missing_ok=False):
        for attempt in range(5):
            time.sleep(0.25)
            try:
                return self.fetch(url)
            except urllib.error.HTTPError as error:
                if error.code == 404 and missing_ok:
                    return None
                if error.code != 429 or attempt == 4:
                    raise
                time.sleep(2 ** (attempt + 1))

    def lookup(self, branch, name):
        key = (branch, name)
        url = API + "/dependencies/packages_by_dependency?" + urllib.parse.urlencode(
            {"branch": branch, "dp_name": name, "dp_type": "provide", "last_state": "false"})
        if key not in self.lookups:
            result = self.request(url, missing_ok=True)
            if result is None:
                rows = []
            else:
                args = result.get("request_args", {})
                rows = result.get("packages", [])
                if (args.get("branch") != branch or args.get("dp_name") != name or
                        args.get("dp_type") != "provide" or result.get("length") != len(rows)):
                    raise RuntimeError(f"Incomplete Provides lookup: {url}")
            self.lookups[key] = (url, rows)
        return self.lookups[key]

    def metadata(self, pkghash):
        pkghash = str(pkghash)
        if pkghash not in self.cache:
            url = API + "/dependencies/binary_package_dependencies/" + pkghash
            result = self.request(url)
            dependencies = result.get("dependencies", [])
            if (str(result.get("request_args", {}).get("pkghash")) != pkghash or
                    result.get("length") != len(dependencies)):
                raise RuntimeError(f"Incomplete RPM metadata: {url}")
            self.cache[pkghash] = {
                "source": url,
                "provides": sorted({row["name"] for row in dependencies if row.get("type") == "provide"}),
                "obsoletes": sorted({row["name"] for row in dependencies if row.get("type") == "obsolete"}),
            }
        return self.cache[pkghash]


def branch_providers(reader, branch, names, index, arch):
    """Keep only candidates present in the same validated branch export."""
    providers, packages = {}, {}
    for name in sorted(names - index.keys()):
        url, rows = reader.lookup(branch, name)
        candidates, evidence = set(), {}
        for row in rows:
            actual = row.get("name")
            if row.get("arch") not in (arch, "noarch") or actual not in index:
                continue
            package = index[actual]
            if package["arch"] != row["arch"]:
                continue
            vr = row.get("version", "") + "-" + row.get("release", "")
            if package["evr"].split(":")[-1] != vr or not row.get("hash"):
                raise RuntimeError(f"Provides candidate disagrees with {branch} export: {actual}")
            metadata = reader.metadata(row["hash"])
            if name not in metadata["provides"]:
                raise RuntimeError(f"Provides not confirmed in exact RPM: {name} -> {actual}")
            candidates.add(actual)
            evidence[actual] = metadata["source"]
            packages[actual] = {**package, "hash": str(row["hash"])}
        providers[name] = {"candidates": sorted(candidates), "source": url,
                           "evidence": evidence, "complete": True}
    return providers, packages


def image_providers(reader, names, image_packages, branch_records, previous=None):
    """Verify discovered candidates ONLY against exact historical ISO RPMs.

    This is not a complete scan of every Provides in the ISO. A negative result
    remains unknown, never proof of removal or ISO absence.
    """
    providers = {}
    aliases = set().union(*(records.keys() for records in branch_records))
    for name in sorted((names - image_packages.keys()) & aliases):
        possible = set((previous or {}).get(name, {}).get("candidates", []))
        for records in branch_records:
            possible.update(records.get(name, {}).get("candidates", []))
        candidates, evidence = [], {}
        for actual in sorted(possible):
            package = image_packages.get(actual)
            if not package:
                continue
            metadata = reader.metadata(package["hash"])
            if name in metadata["provides"]:
                candidates.append(actual)
                evidence[actual] = metadata["source"]
        providers[name] = {"candidates": candidates, "evidence": evidence, "complete": False,
                           "source": API + "/dependencies/binary_package_dependencies/{hash}",
                           "scope": "Branch candidate names verified against exact image RPM hashes"}
    return providers
