"""Normalized branch export contract shared with src/doc/acquisition.ts."""


def binary_export(data, branch, arch):
    rows = data.get("packages")
    if (data.get("request_args", {}).get("branch") != branch or
            data.get("request_args", {}).get("arch") != arch or
            not isinstance(rows, list) or not rows or data.get("length") != len(rows)):
        raise RuntimeError(f"Incomplete repository export: {branch}/{arch}")
    result = {}
    for row in rows:
        epoch = row.get("epoch", 0)
        if (row.get("arch") != arch or
                not all(isinstance(row.get(key), str) and row[key] for key in ("name", "source", "version", "release")) or
                type(epoch) is not int or not 0 <= epoch <= 9007199254740991):
            raise RuntimeError(f"Invalid RPM: {branch}/{arch}")
        if row["name"] in result:
            raise RuntimeError(f"Duplicate RPM: {row['name']}")
        result[row["name"]] = {
            "evr": (f"{epoch}:" if epoch else "") + row["version"] + "-" + row["release"],
            "source": row["source"], "arch": arch,
        }
    return result
