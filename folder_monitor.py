# folder_monitor.py
import os
import time
import threading
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, PatternMatchingEventHandler
from .folder_scanner import _scan_for_images  # Import folder scanner
import asyncio
from server import PromptServer
import queue


class GalleryEventHandler(PatternMatchingEventHandler):
    """Handles file system events, including symlinks, recursively."""

    def __init__(self, base_path, patterns=None, ignore_patterns=None, ignore_directories=False, case_sensitive=True, debounce_interval=0.5):
        super().__init__(patterns=patterns, ignore_patterns=ignore_patterns, ignore_directories=ignore_directories, case_sensitive=case_sensitive)
        self.base_path = os.path.realpath(base_path)  # Use realpath for base_path
        self.debounce_timer = None
        self.debounce_interval = debounce_interval
        # Use a dictionary to track events, keyed by (event_type, real_path)
        self.processed_events = {}
        self.result_queue = queue.Queue()  # Queue for results.
        self.running_scan = False # Flag to avoid multiple scans at the same time

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
        """Rescans, detects changes, sends updates, now thread-safe."""
        if self.running_scan:
            print("Another scan is running, skipping")
            return

        self.running_scan = True  # Set the flag.

        def thread_target():
            """Target function for the scanning thread."""

            try:
                folder_name = os.path.basename(self.base_path)
                new_folders_data, _ = _scan_for_images(self.base_path, folder_name, True)
                old_folders_data = self.last_known_folders
                changes = detect_folder_changes(old_folders_data, new_folders_data)

                # Put results and last_known_folders into the queue.
                self.result_queue.put((changes, new_folders_data))


            except Exception as e:
                # Put any exception into the queue for the main thread to handle.
                self.result_queue.put(e)


        def on_scan_complete():
            """Callback to run in the main thread after scanning."""
            try:

                result = self.result_queue.get()  # Use get - BLOCKING

                if isinstance(result, Exception):
                    print(f"FileSystemMonitor: Error during scan: {result}")
                    return

                changes, new_folders_data = result

                if changes:
                    print("FileSystemMonitor: Changes detected after debounce, sending updates")
                    from .server import sanitize_json_data
                    # Correctly schedule the send_sync call on the main thread.
                    PromptServer.instance.send_sync("Gallery.file_change", sanitize_json_data(changes)) # NO ASYNCIO NEEDED
                else:
                    print("FileSystemMonitor: Changes detected by watchdog, but no relevant gallery changes after debounce.")

                self.last_known_folders = new_folders_data  # Update last_known_folders.
                self.debounce_timer = None
            except queue.Empty:
                print("FileSystemMonitor: Queue is empty, this shouldn't happen normally.")

            finally:
                self.running_scan = False #Clear flag in all cases

        # Start the scan in a separate thread.
        scan_thread = threading.Thread(target=thread_target)
        scan_thread.start()

        #Schedule the callback to be called when the scan is complete.
        scan_thread.join() # Wait for the scan thread to actually complete!
        on_scan_complete() # THEN call the completion function, now guaranteed to have data.



class FileSystemMonitor:
    """Monitors the output directory, including symlinks, recursively."""

    def __init__(self, base_path, interval=1.0):
        self.base_path = base_path
        self.interval = interval
        self.observer = Observer()
        self.event_handler = GalleryEventHandler(base_path=base_path, patterns=["*.png", "*.jpg", "*.jpeg", "*.webp", "*.mp4", "*.gif", "*.webm"], debounce_interval=0.5)
        folder_name = os.path.basename(base_path)
        self.event_handler.last_known_folders, _ = _scan_for_images(base_path, folder_name, True)
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