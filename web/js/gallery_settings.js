/**
 * Manages gallery settings UI and persistence using localStorage.
 */
export class GallerySettings {
    constructor(gallery) {
        /** @type {Gallery} */
        this.gallery = gallery;
        /** @type {HTMLDivElement | null} */
        this.settingsPopup = null;
        /** @type {object} */
        this.currentSettings = this.loadSettings(); // Load settings on initialization
        this.pendingSettings = { ...this.currentSettings }; // Use pending settings to track changes before save
        this.initSettingsUI();
    }

    /**
     * Default settings for the gallery.
     * @returns {object} Default settings object.
     */
    static get defaultSettings() {
        return {
            relativePath: "./",
            openButtonBoxQuery: "div.flex.gap-2.mx-2",
            openButtonLabel: "Open Gallery",
            openButtonFloating: false,
            autoPlayVideos: true,
            hideOpenButton: false, // ADDED: New setting
        };
    }

    /**
     * Loads settings from localStorage, or returns default settings if not found.
     * @returns {object} Loaded settings object.
     */
    loadSettings() {
        try {
            const storedSettings = localStorage.getItem('comfyui_gallery_settings');
            return storedSettings ? JSON.parse(storedSettings) : GallerySettings.defaultSettings;
        } catch (e) {
            console.warn("Error loading gallery settings from localStorage, using defaults.", e);
            return GallerySettings.defaultSettings;
        }
    }

    /**
     * Saves the current settings to localStorage.
     */
    saveSettings() {
        localStorage.setItem('comfyui_gallery_settings', JSON.stringify(this.pendingSettings));
        this.currentSettings = { ...this.pendingSettings }; // Update current settings to saved ones
        this.applySettings(); // Apply settings after saving
        this.closeSettingsPopup();
        console.log("Gallery settings saved and applied.");
    }

    /**
     * Initializes the settings UI popup, but does not display it.
     */
    initSettingsUI() {
        this.settingsPopup = document.createElement('div');
        this.settingsPopup.classList.add('gallery-settings-popup');
        this.settingsPopup.style.display = 'none'; // Hidden by default

        const popupContent = document.createElement('div');
        popupContent.classList.add('settings-popup-content');

        const header = document.createElement('div');
        header.classList.add('settings-popup-header');
        header.textContent = 'Gallery Settings';

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.classList.add('settings-close-button');
        closeButton.addEventListener('click', () => this.closeSettingsPopup());
        header.appendChild(closeButton);
        popupContent.appendChild(header);

        const settingsBody = document.createElement('div');
        settingsBody.classList.add('settings-popup-body');
        popupContent.appendChild(settingsBody);

        // Create input elements for settings (example for relativePath)
        this.createSettingInput(settingsBody, "relativePath", "Relative Path", "string");
        this.createSettingInput(settingsBody, "openButtonBoxQuery", "Button Box Query", "string");
        this.createSettingInput(settingsBody, "openButtonLabel", "Button Label", "string");
        this.createSettingInput(settingsBody, "openButtonFloating", "Floating Button", "checkbox");
        this.createSettingInput(settingsBody, "autoPlayVideos", "Auto Play Videos", "checkbox");
        this.createSettingInput(settingsBody, "hideOpenButton", "Hide Open Button", "checkbox"); // ADDED: hideOpenButton input

        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save Settings';
        saveButton.classList.add('save-settings-button');
        saveButton.addEventListener('click', () => this.saveSettings());
        popupContent.appendChild(saveButton);


        this.settingsPopup.appendChild(popupContent);
        document.body.appendChild(this.settingsPopup);

        this.settingsPopup.addEventListener('click', (event) => {
            if (event.target === this.settingsPopup) {
                this.closeSettingsPopup();
            }
        });
    }

    

    /**
     * Creates a setting input field and label, and appends it to the settings body.
     * @param {HTMLElement} settingsBody - The body of the settings popup.
     * @param {string} settingName - The name of the setting (key in settings object).
     * @param {string} settingLabel - The label to display for the setting.
     * @param {string} settingType - The type of input field ('string' or 'checkbox').
     */
    createSettingInput(settingsBody, settingName, settingLabel, settingType) {
        const settingDiv = document.createElement('div');
        settingDiv.classList.add('setting-item');

        const label = document.createElement('label');
        label.textContent = settingLabel + ":";
        label.setAttribute('for', `setting-${settingName}`); // for accessibility
        settingDiv.appendChild(label);

        let input;
        if (settingType === 'string') {
            input = document.createElement('input');
            input.type = 'text';
            input.id = `setting-${settingName}`;
            input.value = this.currentSettings[settingName] || GallerySettings.defaultSettings[settingName] || "";
             input.addEventListener('input', (event) => {
                this.pendingSettings[settingName] = event.target.value; // Update pending settings on input
            });


        } else if (settingType === 'checkbox') {
            input = document.createElement('input');
            input.type = 'checkbox';
            input.id = `setting-${settingName}`;
            input.checked = this.currentSettings[settingName] === true; // Ensure boolean comparison
             input.addEventListener('change', (event) => {
                this.pendingSettings[settingName] = event.target.checked; // Update pending settings on checkbox change
            });
        }

        if (input) {
            settingDiv.appendChild(input);
        }

        settingsBody.appendChild(settingDiv);
    }


    /**
     * Opens the settings popup.
     */
    openSettingsPopup() {
        // Update input values to current pending settings when opening
        for (const settingName of Object.keys(GallerySettings.defaultSettings)) {
            const inputElement = this.settingsPopup.querySelector(`#setting-${settingName}`);
            if (inputElement) {
                if (inputElement.type === 'checkbox') {
                    inputElement.checked = this.pendingSettings[settingName] === true;
                } else {
                    inputElement.value = this.pendingSettings[settingName] || GallerySettings.defaultSettings[settingName] || "";
                }
            }
        }


        this.settingsPopup.style.display = 'flex';
        this.gallery.galleryPopup.style.zIndex = '999'; // Ensure settings is on top of gallery
    }

    /**
     * Closes the settings popup.
     */
    closeSettingsPopup() {
        this.settingsPopup.style.display = 'none';
        this.gallery.galleryPopup.style.zIndex = '1000'; // Reset gallery z-index
    }

    /**
     * Applies the current settings to the gallery UI and functionality.
     */
    applySettings() {
        const settingsToApply = {};
        for (const key of Object.keys(GallerySettings.defaultSettings)) {
             if (this.currentSettings[key] !== this.gallery.currentSettings?.[key]) { // Only apply changed settings
                settingsToApply[key] = this.currentSettings[key];
             }
        }


        if (settingsToApply.relativePath !== undefined) {
            this.gallery.updateRelativePath(settingsToApply.relativePath);
        }
        if (settingsToApply.openButtonBoxQuery !== undefined) {
            this.gallery.updateButtonBoxQuery(settingsToApply.openButtonBoxQuery);
        }
        if (settingsToApply.openButtonLabel !== undefined) {
            this.gallery.updateButtonLabel(settingsToApply.openButtonLabel);
        }
        if (settingsToApply.openButtonFloating !== undefined) {
            this.gallery.updateButtonFloating(settingsToApply.openButtonFloating);
        }
        if (settingsToApply.autoPlayVideos !== undefined) {
            this.gallery.updateAutoplayVideos(settingsToApply.autoPlayVideos);
        }
        if (settingsToApply.hideOpenButton !== undefined) { // ADDED: Check for hideOpenButton change
            this.gallery.updateHideOpenButton(settingsToApply.hideOpenButton);
        }
        // Store current settings in gallery for comparison in next applySettings call
        this.gallery.currentSettings = {...this.currentSettings};
    }
}