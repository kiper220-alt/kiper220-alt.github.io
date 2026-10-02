"""Offline acquisition tests. No production endpoints or snapshot files are used."""
import pathlib
import sys
import unittest
from unittest.mock import patch
import urllib.error

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from provides import ProvidesReader, branch_providers, image_providers


class ProvidesTests(unittest.TestCase):
    def setUp(self):
        self.sleep = patch("provides.time.sleep").start()
        self.addCleanup(patch.stopall)

    def test_validated_branch_and_exact_rpm(self):
        def fetch(url):
            if "packages_by_dependency" in url:
                return {"request_args":{"branch":"p11","dp_name":"alias","dp_type":"provide"}, "length":2,
                        "packages":[{"name":"provider","version":"2.0","release":"alt1","arch":"x86_64","hash":"new"},
                                    {"name":"other-arch","version":"2.0","release":"alt1","arch":"aarch64","hash":"wrong"}]}
            return {"request_args":{"pkghash":"new"},"length":1,"dependencies":[{"name":"alias","type":"provide"}]}
        records, packages = branch_providers(ProvidesReader(fetch), "p11", {"alias"},
                                             {"provider":{"evr":"1:2.0-alt1","source":"fixture","arch":"x86_64"}}, "x86_64")
        self.assertEqual(records["alias"]["candidates"],["provider"])
        self.assertEqual(packages["provider"]["evr"],"1:2.0-alt1")

    def test_historical_metadata_not_inferred_from_current_provides(self):
        reader=ProvidesReader(lambda url:{"request_args":{"pkghash":"old"},"length":0,"dependencies":[]})
        records=image_providers(reader,{"alias"},{"provider":{"hash":"old"}},
                                [{"alias":{"candidates":["provider"]}}])
        self.assertEqual(records["alias"]["candidates"],[])
        self.assertFalse(records["alias"]["complete"])

    def test_cache_by_exact_hash_and_ambiguity_retained(self):
        cache={"old":{"source":"fixture:old","provides":["alias"],"obsoletes":[]},
               "other":{"source":"fixture:other","provides":["alias"],"obsoletes":[]}}
        reader=ProvidesReader(lambda url:self.fail("Should use immutable hash cache"),cache)
        records=image_providers(reader,{"alias"},{"one":{"hash":"old"},"two":{"hash":"other"}},
                                [{"alias":{"candidates":["one","two"]}}])
        self.assertEqual(records["alias"]["candidates"],["one","two"])

    def test_network_error_is_not_an_empty_provider_list(self):
        def fail(url):raise urllib.error.HTTPError(url,503,"Unavailable",{},None)
        with self.assertRaises(urllib.error.HTTPError):
            ProvidesReader(fail).lookup("p11","alias")

    def test_incomplete_response_rejected(self):
        reader=ProvidesReader(lambda url:{"request_args":{"branch":"p11","dp_name":"alias","dp_type":"provide"},"length":2,"packages":[]})
        with self.assertRaises(RuntimeError):reader.lookup("p11","alias")


if __name__ == "__main__":
    unittest.main()
