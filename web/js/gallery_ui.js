import { app } from "../../scripts/app.js";
import { Gallery } from './gallery.js';
import { GallerySettings } from './gallery_settings.js'; // Import GallerySettings
let gallery;
let gallerySettingsInstance;

/**
 * Starts monitoring the gallery output directory via API call.
 * @param {string} relativePath - The relative path to monitor.
 */
function startMonitoring(relativePath) {
    app.api.fetchApi("/Gallery/monitor/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relative_path: relativePath })
    }).then(response => {
        if (response.ok) {
            console.log(`Gallery monitoring started for path: ${relativePath}`);
        } else {
            console.error("Failed to start gallery monitoring:", response.statusText);
        }
    });
}

/**
 * Stops monitoring the gallery output directory via API call.
 */
function stopMonitoring() {
    app.api.fetchApi("/Gallery/monitor/stop", {
        method: "POST",
    }).then(response => {
        if (response.ok) {
            console.log("Gallery monitoring stopped.");
        } else {
            console.error("Failed to stop gallery monitoring:", response.statusText);
        }
    });
}

export function resetGallery(relativePath) {
    gallery.clearGallery();
    startMonitoring(relativePath);

    app.api.fetchApi(`/Gallery/images?relative_path=${encodeURIComponent(relativePath)}`)
        .then(response => response.text())
        .then(text => {
            try {
                return JSON.parse(text);
            } catch (e) {
                console.error("Error parsing JSON response:", e);
                return { folders: {} };
            }
        })
        .then(data => {
            gallery.initializeFolders(data.folders || {});
        });
}

app.registerExtension({
    name: "Gallery",
    init() {
        const menu = document.querySelector("div.flex.gap-2.mx-2");
        if (menu) {
            // Load settings and initialize GallerySettings instance first
            gallerySettingsInstance = new GallerySettings(null);
            const initialSettings = gallerySettingsInstance.loadSettings();


            gallery = new Gallery({
                openButtonBox: menu,
                settings: initialSettings,
                gallerySettings: gallerySettingsInstance // Pass gallerySettingsInstance here
            });
            gallerySettingsInstance.gallery = gallery;

            if (initialSettings.openButtonFloating) { // RESTORE FLOATING BUTTON STATE ON LOAD
                gallery.enableFloatingButton(); // Enable floating button if setting is true
            }

            startMonitoring(initialSettings.relativePath);

            app.api.fetchApi(`/Gallery/images?relative_path=${encodeURIComponent(initialSettings.relativePath)}`)
                .then(response => response.text())
                .then(text => {
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        console.error("Error parsing JSON response:", e);
                        return { folders: {} };
                    }
                })
                .then(data => {
                    console.log("data:", data);
                    gallery.initializeFolders(data.folders || {});
                });
            if (initialSettings.hideOpenButton) { // ADDED: Initial button visibility
                gallery.updateHideOpenButton(initialSettings.hideOpenButton); // Enable floating button if setting is true
            }
        }
    },
    async nodeCreated(node) {
        if (node.comfyClass === "GalleryNode") {
            const onRemoved = node.onRemoved;
            node.onRemoved = () => {
                if (onRemoved) { onRemoved.apply(node); }
                if (gallery) { gallery.closeGallery(); }
            };
            node.addWidget("button", "Open Gallery", null, () => {
                if (gallery) { gallery.openGallery(); }
            });
            node.addWidget("button", "Settings", null, () => {
                if (gallerySettingsInstance) { gallerySettingsInstance.openSettingsPopup(); }
            });
        }
    },
});

app.api.addEventListener("Gallery.file_change", (event) => {
    console.log("file_change:", event.detail);
    if (gallery && event.detail) {
        gallery.updateImages(event.detail);
    } else {
        console.warn("Gallery update event received without change data.");
    }
});


app.api.addEventListener("Gallery.update", (event) => {
    if (gallery) {
        gallery.updateImages(event.detail.folders);
    }
});

app.api.addEventListener("Gallery.clear", (event) => {
    if (gallery) {
        gallery.clearGallery();
    }
});
