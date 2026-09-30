"""Offline catalogue fixtures; production endpoints and snapshots are not used."""
import copy
import importlib.util
import io
import json
import pathlib
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
spec = importlib.util.spec_from_file_location("update_doc_data", pathlib.Path(__file__).resolve().parents[1] / "scripts/update-doc-data.py")
updater = importlib.util.module_from_spec(spec)
spec.loader.exec_module(updater)


def indexes(evr="0.10.9-alt1"):
    packages = {name: {"evr": evr, "source": "alt-components-base", "arch": "noarch"}
                for name in ("alt-components-base", "alt-editions-server")}
    return {arch: copy.deepcopy(packages) for arch in ("x86_64", "aarch64")}


def versions(*rows):
    return {"request_args": {"name": "alt-components-base"}, "versions": list(rows)}


def source(tag="0.10.9", branch="p11", hash="fixture-source"):
    return {"branch": branch, "version": tag, "release": "alt1", "pkghash": hash}


class CatalogueTests(unittest.TestCase):
    def test_new_active_version_is_selected_without_a_constant(self):
        tag, package = updater.current_definition_package(indexes(), versions(
            source("0.10.12", "sisyphus"), source("0.10.8", hash="old"), source()))
        self.assertEqual(tag, "0.10.9-alt1")
        self.assertEqual(package["branch"], "p11")
        self.assertEqual(package["sourceHash"], "fixture-source")

    def test_active_export_wins_over_newer_history_rows(self):
        tag, _ = updater.current_definition_package(indexes("0.10.8-alt1"), versions(source(), source("0.10.8")))
        self.assertEqual(tag, "0.10.8-alt1")

    def test_epoch_is_preserved_but_not_added_to_git_tag(self):
        tag, package = updater.current_definition_package(indexes("1:0.10.9-alt1"), versions(source()))
        self.assertEqual(tag, "0.10.9-alt1")
        self.assertEqual(package["evr"], "1:0.10.9-alt1")

    def test_inconsistent_and_incomplete_data_fail(self):
        cases = [(indexes(), versions(source(branch="sisyphus"))),
                 (indexes(), versions(source("0.10.8"))),
                 (indexes(), versions(source(hash=""))),
                 (indexes(), versions(source(), source(hash="different-build"))),
                 (indexes(), {"request_args": {"name": "wrong"}, "versions": [source()]})]
        for name, field, value in [("alt-components-base", "source", "wrong"),
                                   ("alt-editions-server", "evr", "0.10.8-alt1"),
                                   ("alt-components-base", "arch", "aarch64")]:
            data = indexes()
            data["aarch64"][name][field] = value
            cases.append((data, versions(source())))
        absent = indexes()
        del absent["x86_64"]["alt-components-base"]
        cases.append((absent, versions(source())))
        different_arch = indexes()
        different_arch["aarch64"] = indexes("0.10.10-alt1")["aarch64"]
        cases.append((different_arch, versions(source())))
        for data, payload in cases:
            with self.subTest(data=data, payload=payload), self.assertRaises(RuntimeError):
                updater.current_definition_package(data, payload)

    def test_a_branch_named_like_the_version_is_not_a_tag(self):
        with tempfile.TemporaryDirectory(prefix="catalogue-tag-fixture-") as folder:
            subprocess.run(["git", "init", "-q", folder], check=True)
            subprocess.run(["git", "-C", folder, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid",
                            "commit", "-q", "--allow-empty", "-m", "fixture"], check=True)
            subprocess.run(["git", "-C", folder, "branch", "0.10.9-alt1"], check=True)
            with self.assertRaises(subprocess.CalledProcessError):
                updater.read_definitions(pathlib.Path(folder), "0.10.9-alt1")

    def test_update_uses_selected_version_and_keeps_last_success_on_failure(self):
        with tempfile.TemporaryDirectory(prefix="catalogue-data-fixture-") as folder:
            output = pathlib.Path(folder)

            def definitions(repo, tag):
                return {"tag": tag, "revision": "fixture-" + tag, "source": "fixture:git",
                        "components": {}, "categories": {}, "editions": {}}

            def fetch(url):
                if url == updater.CATALOGUE_SOURCE:
                    return versions(source("0.10.12", "sisyphus"), source())
                if "/export/" in url:
                    return {}
                if "image_uuid_by_tag" in url:
                    return {"request_args": {"tag": url.split("?tag=")[1]}, "uuid": "fixture-image"}
                if "image_packages" in url:
                    packages = [{"name": "alt-editions-server", "version": "0.10.3", "release": "alt1",
                                 "arch": "noarch", "hash": "fixture-edition"}]
                    packages.extend({"name": f"fixture-{i}", "version": "1", "release": "alt1",
                                     "arch": "noarch", "hash": f"fixture-{i}"} for i in range(999))
                    return {"request_args": {"uuid": "fixture-image"}, "length": 1000, "packages": packages}
                self.fail("Unexpected fixture URL: " + url)

            with patch.object(updater, "OUT", output), patch.object(updater, "read_definitions", side_effect=definitions), \
                    patch.object(updater.subprocess, "run"), patch.object(updater.urllib.request, "urlopen",
                        side_effect=lambda *a, **k: io.BytesIO(b"/alt-editions-server-0.10.3-alt1.noarch.rpm")), \
                    patch.object(updater, "url_json", side_effect=fetch), \
                    patch.object(updater, "binary_index", side_effect=lambda data, arch, branch: indexes()[arch]), \
                    patch.object(updater, "branch_providers", return_value=({}, {})), \
                    patch.object(updater, "image_providers", return_value={}), patch.object(sys, "argv", ["update-doc-data.py"]):
                updater.main()
                for arch in ("x86_64", "aarch64"):
                    snapshot = json.loads((output / f"p11-{arch}.json").read_text())
                    self.assertEqual(snapshot["definitions"]["tag"], "0.10.9-alt1")
                    self.assertEqual(snapshot["definitions"]["package"]["sourceHash"], "fixture-source")
                    self.assertEqual(snapshot["packages"]["alt-components-base"]["evr"], "0.10.9-alt1")
                    image = json.loads((output / f"image-11.1-{arch}.json").read_text())
                    self.assertEqual(image["definitions"]["tag"], "0.10.3-alt1")
                    image["packages"]["fixture-0"].update({"evr": "1:1-alt1", "epochKnown": True, "epochSource": "fixture:confirmed-ISO-hash"})
                    updater.write_atomic(output / f"image-11.1-{arch}.json", image)
                updater.main()
                for arch in ("x86_64", "aarch64"):
                    image = json.loads((output / f"image-11.1-{arch}.json").read_text())
                    self.assertEqual(image["packages"]["fixture-0"]["evr"], "1:1-alt1")
                    self.assertTrue(image["packages"]["fixture-0"]["epochKnown"])
                previous = {path: path.read_bytes() for path in output.iterdir()}
                with patch.object(updater, "current_definition_package", side_effect=RuntimeError("Fixture: inconsistent source")):
                    with self.assertRaises(RuntimeError):
                        updater.main()
                self.assertEqual(previous, {path: path.read_bytes() for path in output.iterdir()})


if __name__ == "__main__":
    unittest.main()
