# import os
# import time
# import threading
# from watchdog.observers import Observer
# from watchdog.events import FileSystemEventHandler, PatternMatchingEventHandler
# from .folder_scanner import _scan_for_images  # Import folder scanner
# 
# class GalleryEventHandler(PatternMatchingEventHandler):
#     """Handles file system events for the gallery, including videos, GIFs, and symlinks."""
# 
#     def __init__(self, base_path, patterns=None, ignore_patterns=None, ignore_directories=False, case_sensitive=True, debounce_interval=0.5):
#         super().__init__(patterns=patterns, ignore_patterns=ignore_patterns, ignore_directories=ignore_directories, case_sensitive=case_sensitive)
#         self.base_path = base_path
#         self.debounce_timer = None
#         self.debounce_interval = debounce_interval
#         self.processed_paths = set()  # Track processed paths to avoid duplicates
# 
#     def on_any_event(self, event):
#         """Catch-all event handler with debouncing and symlink handling."""
#         if event.is_directory:
#             return None
# 
#         # Ignore events for temporary files
#         if event.src_path.endswith(('.swp', '.tmp', '~')):
#             return None
# 
#         # Resolve real path in case of symlinks
#         real_path = os.path.realpath(event.src_path)
# 
#         # Avoid duplicate processing
#         if real_path in self.processed_paths:
#             #print(f"Ignoring duplicate event for: {real_path}")
#             return
#         self.processed_paths.add(real_path)
# 
# 
#         if event.event_type in ('created', 'deleted', 'modified', 'moved'):
#             print(f"Watchdog detected {event.event_type}: {event.src_path} (Real path: {real_path}) - debouncing")
#             self.debounce_event()
# 
#     def debounce_event(self):
#         """Debounces the file system event using a timer."""
#         if self.debounce_timer and self.debounce_timer.is_alive():
#             self.debounce_timer.cancel()
# 
#         self.debounce_timer = threading.Timer(self.debounce_interval, self.rescan_and_send_changes)
#         self.debounce_timer.start()
# 
#     def rescan_and_send_changes(self):
#         """Rescans, detects changes, and sends updates (debounced)."""
#         from server import PromptServer
# 
#         new_folders_data, _ = _scan_for_images(
#             self.base_path, "output", True
#         )
#         old_folders_data = self.last_known_folders
# 
#         changes = detect_folder_changes(old_folders_data, new_folders_data)
# 
#         if changes:
#             print("FileSystemMonitor: Changes detected after debounce, sending updates")
#             from .server import sanitize_json_data
#             PromptServer.instance.send_sync("Gallery.file_change", sanitize_json_data(changes))
#         else:
#             print("FileSystemMonitor: Changes detected by watchdog, but no relevant gallery changes after debounce.")
# 
#         self.last_known_folders = new_folders_data
#         self.debounce_timer = None
#         self.processed_paths = set() # Clear processed paths after each scan
# 
# 
# class FileSystemMonitor:
#     """Monitors the output directory using Watchdog, now including videos, GIFs and symlinks."""
# 
#     def __init__(self, base_path, interval=1.0):
#         self.base_path = base_path
#         self.interval = interval
#         self.observer = Observer()
#         self.event_handler = GalleryEventHandler(base_path=base_path, patterns=["*.png", "*.jpg", "*.jpeg", "*.webp", "*.mp4", "*.gif"], debounce_interval=0.5)
#         self.event_handler.last_known_folders, _ = _scan_for_images(base_path, "output", True)
#         self.thread = None
# 
# 
#     def start_monitoring(self):
#         """Starts the Watchdog observer."""
#         if self.thread is None or not self.thread.is_alive():
#             self.thread = threading.Thread(target=self._start_observer_thread, daemon=True)
#             self.thread.start()
#             print("FileSystemMonitor: Watchdog monitoring thread started.")
#         else:
#             print("FileSystemMonitor: Watchdog monitoring thread already running.")
# 
# 
#     def _start_observer_thread(self):
#         # Enable follow_directory_symlinks. This is crucial.
#         self.observer.schedule(self.event_handler, self.base_path, recursive=True)
#         self.observer.follow_directory_symlinks = True # enable symlink following
#         self.observer.start()
#         try:
#             while True:
#                 time.sleep(0.1)
#         except KeyboardInterrupt:
#             self.stop_monitoring()
# 
# 
#     def stop_monitoring(self):
#         """Stops the Watchdog observer."""
#         if self.thread and self.thread.is_alive():
#             self.observer.stop()
#             self.observer.join()
#             self.thread = None
#             print("FileSystemMonitor: Watchdog monitoring thread stopped.")
# 
# 
# # --- Helper function to detect folder changes ---
# def detect_folder_changes(old_folders, new_folders):
#     """Detects changes between two folder data dictionaries."""
#     changes = {"folders": {}}
# 
#     all_folders = set(old_folders.keys()) | set(new_folders.keys())
#     for folder_name in all_folders:
#         old_folder = old_folders.get(folder_name, {})
#         new_folder = new_folders.get(folder_name, {})
#         folder_changes = {}
# 
#         old_files = set(old_folder.keys())
#         new_files = set(new_folder.keys())
#         all_files = old_files | new_files
# 
#         for filename in all_files:
#             old_file_data = old_folder.get(filename)
#             new_file_data = new_folder.get(filename)
# 
#             if filename not in old_folder: # New file
#                 folder_changes[filename] = {"action": "create", **new_file_data}
#             elif filename not in new_folder: # Removed file
#                 folder_changes[filename] = {"action": "remove"}
#             elif old_file_data != new_file_data: # Updated file (simplistic comparison)
#                 folder_changes[filename] = {"action": "update", **new_file_data}
# 
#         if folder_changes:
#             changes["folders"][folder_name] = folder_changes
# 
#     return changes
# 
# 
# # --- Helper function (not used with watchdog event driven, but kept for initial scan in server.py) ---
# def scan_directory_initial(path): # This function is not used by watchdog, but might be used for initial scan
#     """Scans and returns a set of (filepath, modified_time) tuples."""
#     files = set()
#     for root, _, filenames in os.walk(path):
#         for filename in filenames:
#             if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
#                 full_path = os.path.join(root, filename)
#                 try:
#                     # Use os.stat() with follow_symlinks=False to get the symlink's own mtime
#                     modified_time = os.stat(full_path, follow_symlinks=False).st_mtime
#                     files.add((full_path, modified_time))
#                 except Exception as e:
#                     print(f"FileSystemMonitor: Error accessing {full_path}: {e}")
#     return files

import os
import time
import threading
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, PatternMatchingEventHandler
from .folder_scanner import _scan_for_images  # Import folder scanner

class GalleryEventHandler(PatternMatchingEventHandler):
    """Handles file system events, including symlinks, recursively."""

    def __init__(self, base_path, patterns=None, ignore_patterns=None, ignore_directories=False, case_sensitive=True, debounce_interval=0.5):
        super().__init__(patterns=patterns, ignore_patterns=ignore_patterns, ignore_directories=ignore_directories, case_sensitive=case_sensitive)
        self.base_path = os.path.realpath(base_path)  # Use realpath for base_path
        self.debounce_timer = None
        self.debounce_interval = debounce_interval
        # Use a dictionary to track events, keyed by (event_type, real_path)
        self.processed_events = {}

    def on_any_event(self, event):
        """Handles events, including symlinks, with debouncing and duplicate prevention."""
        if event.is_directory:
            return

        # Ignore temporary files
        if event.src_path.endswith(('.swp', '.tmp', '~')):
            return

        real_path = os.path.realpath(event.src_path)

        # Check if this event (type + path) has been processed recently
        event_key = (event.event_type, real_path)
        current_time = time.time()

        if event_key in self.processed_events:
            last_processed_time = self.processed_events[event_key]
            if current_time - last_processed_time < self.debounce_interval:
                #print(f"Ignoring duplicate event within debounce period: {event_key}")
                return

        # Mark this event as processed
        self.processed_events[event_key] = current_time


        if event.event_type in ('created', 'deleted', 'modified', 'moved'):
            print(f"Watchdog detected {event.event_type}: {event.src_path} (Real path: {real_path}) - debouncing")
            self.debounce_event()


    def debounce_event(self):
        """Debounces the file system event."""
        if self.debounce_timer and self.debounce_timer.is_alive():
            self.debounce_timer.cancel()

        self.debounce_timer = threading.Timer(self.debounce_interval, self.rescan_and_send_changes)
        self.debounce_timer.start()

    def rescan_and_send_changes(self):
        """Rescans, detects changes, and sends updates (debounced)."""
        from server import PromptServer

        new_folders_data, _ = _scan_for_images(
            self.base_path, "output", True
        )
        old_folders_data = self.last_known_folders
        changes = detect_folder_changes(old_folders_data, new_folders_data)

        if changes:
            print("FileSystemMonitor: Changes detected after debounce, sending updates")
            from .server import sanitize_json_data
            PromptServer.instance.send_sync("Gallery.file_change", sanitize_json_data(changes))
        else:
            print("FileSystemMonitor: Changes detected by watchdog, but no relevant gallery changes after debounce.")
        self.last_known_folders = new_folders_data
        self.debounce_timer = None
        # Don't clear processed_events here. We keep a history to prevent duplicates across scans.
        # We could add a mechanism to prune old entries if memory usage becomes a concern.


class FileSystemMonitor:
    """Monitors the output directory, including symlinks, recursively."""

    def __init__(self, base_path, interval=1.0):
        self.base_path = base_path
        self.interval = interval
        self.observer = Observer()
        self.event_handler = GalleryEventHandler(base_path=base_path, patterns=["*.png", "*.jpg", "*.jpeg", "*.webp", "*.mp4", "*.gif"], debounce_interval=0.5)
        self.event_handler.last_known_folders, _ = _scan_for_images(base_path, "output", True)
        self.thread = None

    def start_monitoring(self):
        """Starts the Watchdog observer."""
        if self.thread is None or not self.thread.is_alive():
            self.thread = threading.Thread(target=self._start_observer_thread, daemon=True)
            self.thread.start()
            print("FileSystemMonitor: Watchdog monitoring thread started.")
        else:
            print("FileSystemMonitor: Watchdog monitoring thread already running.")

    def _start_observer_thread(self):
        self.observer.schedule(self.event_handler, self.base_path, recursive=True)
        self.observer.follow_directory_symlinks = True  # Ensure symlinks are followed
        self.observer.start()
        try:
            while True:
                time.sleep(0.1)
        except KeyboardInterrupt:
            self.stop_monitoring()

    def stop_monitoring(self):
        """Stops the Watchdog observer."""
        if self.thread and self.thread.is_alive():
            self.observer.stop()
            self.observer.join()
            self.thread = None
            print("FileSystemMonitor: Watchdog monitoring thread stopped.")



# --- Helper function to detect folder changes ---
def detect_folder_changes(old_folders, new_folders):
    """Detects changes between two folder data dictionaries."""
    changes = {"folders": {}}

    all_folders = set(old_folders.keys()) | set(new_folders.keys())
    for folder_name in all_folders:
        old_folder = old_folders.get(folder_name, {})
        new_folder = new_folders.get(folder_name, {})
        folder_changes = {}

        old_files = set(old_folder.keys())
        new_files = set(new_folder.keys())
        all_files = old_files | new_files

        for filename in all_files:
            old_file_data = old_folder.get(filename)
            new_file_data = new_folder.get(filename)

            if filename not in old_folder: # New file
                folder_changes[filename] = {"action": "create", **new_file_data}
            elif filename not in new_folder: # Removed file
                folder_changes[filename] = {"action": "remove"}
            elif old_file_data != new_file_data: # Updated file (simplistic comparison)
                folder_changes[filename] = {"action": "update", **new_file_data}

        if folder_changes:
            changes["folders"][folder_name] = folder_changes

    return changes

# --- Helper function (not used with watchdog event driven, but kept for initial scan in server.py) ---
def scan_directory_initial(path): # This function is not used by watchdog, but might be used for initial scan
    """Scans and returns a set of (filepath, modified_time) tuples."""
    files = set()
    for root, _, filenames in os.walk(path, followlinks=True): # enable followlinks in os.walk
        for filename in filenames:
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                full_path = os.path.join(root, filename)
                try:
                    # Use os.stat() with follow_symlinks=False to get the symlink's own mtime if it's a symlink,
                    # otherwise get the file's mtime.
                    modified_time = os.stat(full_path, follow_symlinks=False).st_mtime
                    files.add((full_path, modified_time))
                except Exception as e:
                    print(f"FileSystemMonitor: Error accessing {full_path}: {e}")
    return files