import hashlib
import json

from pathlib import Path


def md5(context):
    return hashlib.md5(context).hexdigest()


def get_dir_md5(path, excludeDir=None):
    md5_list = {}
    for file in Path(path).iterdir():
        if file.is_dir():
            if excludeDir is not None and file.name in excludeDir:
                continue
            md5_list[file.name] = get_dir_md5(file, excludeDir)
        else:
            md5_list[file.name] = md5(file.read_bytes())

    return md5_list


if __name__ == "__main__":
    md5_data = get_dir_md5(".", [".git", ".github", ".vscode", ".vs"])
    Path("md5.json").write_text(json.dumps(md5_data))
