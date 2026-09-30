import json
import pathlib
import sys
import unittest
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from contracts import binary_export
from provides import ProvidesReader, branch_providers

DATA = json.loads((ROOT / "tests/fixtures/acquisition-contracts.json").read_text())


class ContractTests(unittest.TestCase):
    def test_binary_export_contract(self):
        for case in DATA["binary"]:
            with self.subTest(case=case["name"]):
                if case.get("error"):
                    with self.assertRaises(RuntimeError):
                        binary_export(case["data"], DATA["branch"], DATA["arch"])
                else:
                    self.assertEqual(binary_export(case["data"], DATA["branch"], DATA["arch"]), case["expected"])

    @patch("provides.time.sleep")
    def test_provides_contract(self, _sleep):
        for case in DATA["providers"]:
            with self.subTest(case=case["name"]):
                reader = ProvidesReader(lambda url: case["data"], case["metadata"])
                def resolve():
                    records, packages = branch_providers(reader, DATA["branch"], {DATA["alias"]}, DATA["index"], DATA["arch"])
                    return {"record": records[DATA["alias"]], "packages": packages}
                if case.get("error"):
                    with self.assertRaises(RuntimeError):
                        resolve()
                else:
                    self.assertEqual(resolve(), case["expected"])


if __name__ == "__main__":
    unittest.main()
