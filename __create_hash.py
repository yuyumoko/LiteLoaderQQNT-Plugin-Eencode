import os
import hashlib
import json
import gzip


def calculate_file_hash(file_path):
    """Calculate the SHA-256 hash of a file."""
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def generate_hashes(root_dir, exclude_dirs, exclude_files):
    """Generate SHA-256 hashes for all files in the directory, excluding specified directories and files."""
    file_hashes = {}
    for root, dirs, files in os.walk(root_dir):
        # Filter out the directories to be excluded
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for file in files:
            if file in exclude_files:
                continue
            file_path = os.path.join(root, file)
            relative_path = os.path.relpath(file_path, root_dir)
            file_hashes[relative_path] = calculate_file_hash(file_path)
    return file_hashes


def save_hashes_to_json(hashes, output_file):
    """Save the file hashes to a JSON file and compress it using gzip."""
    with gzip.open(output_file, "wt", encoding="utf-8") as f:
        json.dump(hashes, f, separators=(",", ":"))


def save_json(data, output_file):
    with open(output_file, "w") as f:
        json.dump(data, f)


if __name__ == "__main__":
    root_directory = os.getcwd()  # Use the current working directory
    excluded_directories = {".git", ".github", ".vscode", ".vs"}
    excluded_files = {
        os.path.basename(__file__),
        "hash.json",
        "LICENSE",
        "README.md",
    }  # Exclude script, output file, LICENSE, and README.md

    file_hashes = generate_hashes(root_directory, excluded_directories, excluded_files)
    save_json(file_hashes, "hash.json")
    print(f"saved to hash.json")
