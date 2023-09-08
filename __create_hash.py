import hashlib
import json

from pathlib import Path


def sha1(context):
    return hashlib.md5(context).hexdigest()


def get_dir_hash(path, excludeDir=None):
    md5_list = {}
    for file in Path(path).iterdir():
        if file.is_dir():
            if excludeDir is not None and file.name in excludeDir:
                continue
            md5_list[file.name] = get_dir_hash(file, excludeDir)
        else:
            md5_list[file.name] = sha1(file.read_bytes())

    return md5_list


if __name__ == "__main__":
    md5_data = get_dir_hash(".", [".git", ".github", ".vscode", ".vs"])
    Path("hash.json").write_text(json.dumps(md5_data))
