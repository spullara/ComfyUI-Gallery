# folder_scanner.py
import os
from datetime import datetime
from .metadata_extractor import buildMetadata  # Import metadata extractor

def _scan_for_images(full_base_path, base_path, include_subfolders):
    """Scans directories for images, videos, and GIFs and their metadata."""
    folders_data = {}
    current_files = set()
    changed = False

    def scan_directory(dir_path, relative_path=""):
        """Recursively scans a directory for image, video, and GIF files."""
        nonlocal changed
        folder_content = {}  # Dictionary to hold files for the current folder
        try:
            entries = os.listdir(dir_path)
            file_entries = []

            for entry in entries:
                full_path = os.path.join(dir_path, entry)
                if os.path.isdir(full_path):
                    if include_subfolders and not entry.startswith("."):
                        next_relative_path = os.path.join(relative_path, entry)
                        scan_directory(full_path, next_relative_path)
                elif os.path.isfile(full_path):
                    file_entries.append((full_path, entry))
                    current_files.add(full_path)

            for full_path, entry in file_entries:
                if entry.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.mp4', '.gif', '.webm')): # ADDED: .mp4 and .gif extensions
                    try:
                        timestamp = os.path.getmtime(full_path)
                        date_str = datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")
                        rel_path = os.path.relpath(dir_path, full_base_path)
                        filename = entry
                        subfolder = rel_path if rel_path != "." else ""
                        if len(subfolder) > 0:
                          url_path = f"/static_gallery/{subfolder}/{filename}"
                        else:
                          url_path = f"/static_gallery/{filename}"
                        url_path = url_path.replace("\\", "/")

                        metadata = {} # Videos and GIFs will have empty metadata for now
                        if entry.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')): # Only build metadata for images
                            # Extract metadata here
                            try:
                                _, _, metadata = buildMetadata(full_path)
                            except Exception as e:
                                print(f"Gallery Node: Error building metadata for {full_path}: {e}")
                                metadata = {}

                        folder_content[filename] = { # Store file info in folder_content dict
                            "name": entry,
                            "url": url_path,
                            "timestamp": timestamp,
                            "date": date_str,
                            "metadata": metadata,
                            "type": "image" if entry.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')) else "media" # Added type to distinguish images and media
                        }
                    except Exception as e:
                        print(f"Gallery Node: Error processing file {full_path}: {e}")

            folder_key = os.path.join(base_path, relative_path) if relative_path else base_path
            if folder_content: # Only add folder if it has content
                folders_data[folder_key] = folder_content

        except Exception as e:
            print(f"Gallery Node: Error scanning directory {dir_path}: {e}")

    scan_directory(full_base_path, "")
    return folders_data, changed