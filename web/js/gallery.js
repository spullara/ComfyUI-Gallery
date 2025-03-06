import { galleryStyles } from './gallery_styles.js'; // Import styles
import { resetGallery } from "./gallery_ui.js";
/**
 * Represents the image gallery component, handling differential updates.
 */
export class Gallery {
    /**
     * Constructor for the Gallery class.
     * @param {object} options - Options for the gallery.
     * @param {HTMLElement} options.openButtonBox - The HTML element for the open button box.
     * @param {object} [options.folders={}] - Initial folder data.
     * @param {object} [options.settings={}] - Initial settings.
     * @param {GallerySettings} options.gallerySettings - GallerySettings instance. // ADDED: gallerySettings
     */
    constructor(options) {
        /** @type {HTMLElement} */
        this.openButtonBox = options.openButtonBox;
         /**
         * Folders data stored in a nested dictionary format:
         * folders: { folderName: { fileName: { ...data }  } }
         * @type {Object<string, Object<string, object>>}
         */
        this.folders = options.folders || {};
        /** @type {HTMLButtonElement | null} */
        this.galleryButton = null;
        /** @type {HTMLDivElement | null} */
        this.galleryPopup = null;
        /** @type {string | null} */
        this.currentFolder = null;
        /** @type {string} */
        this.currentSort = 'newest';
        /** @type {HTMLButtonElement[]} */
        this.sortButtons = [];
        /** @type {string} */
        this.searchText = "";
        /** @type {HTMLDivElement | null} */
        this.fullscreenContainer = null;
        /** @type {HTMLImageElement | null} */
        this.fullscreenImage = null;
        /** @type {HTMLDivElement | null} */
        this.infoWindow = null;
        /** @type {HTMLDivElement | null} */
        this.rawMetadataWindow = null;
        /** @type {object} */
        this.currentSettings = options.settings || {};
        /** @type {GallerySettings} */
        this.gallerySettings = options.gallerySettings; // Store GallerySettings instance // ADDED: Store setting instance
        /** @type {HTMLDivElement | null} */
        this.floatingButtonContainer = null;


        this.init();
    }

    /**
     * Initializes the gallery, applies initial settings, creates UI elements.
     */
    init() {
        this.applyInitialSettings(); // Apply settings on init
        this.createButton();
        this.createPopup();
        this.applyStyles();
    }


    /**
     * Applies initial settings loaded from localStorage or defaults.
     */
    applyInitialSettings() {
        this.updateButtonBoxQuery(this.currentSettings.openButtonBoxQuery);
        this.updateButtonLabel(this.currentSettings.openButtonLabel);
        this.updateButtonFloating(this.currentSettings.openButtonFloating);
    }

    /**
     * Updates the relative path setting and reloads gallery data.
     * @param {string} relativePath - The new relative path to monitor.
     */
    updateRelativePath(relativePath) {
        if (this.currentSettings.relativePath === relativePath) return; // No change

        this.currentSettings.relativePath = relativePath;
        this.clearGallery(); // Clear existing gallery data

        resetGallery(relativePath);
    }

    /**
     * Updates the button box query selector and re-appends the button.
     * @param {string} query - The new query selector string.
     */
    updateButtonBoxQuery(query) {
        this.currentSettings.openButtonBoxQuery = query;
        const newButtonBox = document.querySelector(query);
        if (newButtonBox) {
             this.changeButtonBox(newButtonBox);
        } else {
            console.warn(`Button box query selector "${query}" not found.`);
        }
    }

    /**
     * Updates the open button label.
     * @param {string} label - The new button label text.
     */
    updateButtonLabel(label) {
        this.currentSettings.openButtonLabel = label;
        if (this.galleryButton) {
            this.galleryButton.textContent = label;
        }
    }


    /**
     * Updates the floating button setting and toggles floating button behavior.
     * @param {boolean} floating - True to enable floating button, false to disable.
     */
    updateButtonFloating(floating) {
        this.currentSettings.openButtonFloating = floating;
        if (floating) {
            this.enableFloatingButton();
        } else {
            this.disableFloatingButton();
        }
    }

    /**
     * Updates the floating button setting and toggles floating button behavior.
     * @param {boolean} floating - True to enable floating button, false to disable.
     */
    updateAutoplayVideos(autoPlayVideos) {
        this.currentSettings.autoPlayVideos = autoPlayVideos;
    }

    /**
     * Enables floating button mode: detaches, creates container, positions, makes draggable, handles resize.
     */
    enableFloatingButton() {
        if (!this.galleryButton || this.floatingButtonContainer) return;

        if (this.galleryButton.parentNode === this.openButtonBox) {
            this.openButtonBox.removeChild(this.galleryButton);
        }

        this.floatingButtonContainer = document.createElement('div');
        this.floatingButtonContainer.classList.add('floating-button-container');
        this.floatingButtonContainer.appendChild(this.galleryButton);
        document.body.appendChild(this.floatingButtonContainer);

        this.positionFloatingButtonCenter();
        this.restoreFloatingButtonPosition();
        this.ensureButtonInView(); // Ensure button is initially in view

        this.makeButtonDraggable();
        this.setupResizeListener(); // Setup resize listener for responsiveness
    }

    /**
     * Disables floating button mode: attaches button back to button box, removes floating container and resize listener.
     */
    disableFloatingButton() {
        if (!this.galleryButton || !this.floatingButtonContainer) return;

        if (this.floatingButtonContainer.parentNode === document.body) {
            document.body.removeChild(this.floatingButtonContainer);
            this.openButtonBox.appendChild(this.galleryButton);
            this.floatingButtonContainer = null;
        }
        this.removeResizeListener(); // Remove resize listener when disabling floating button
    }


    /**
     * Positions the floating button in the center of the screen initially.
     */
    positionFloatingButtonCenter() {
        if (!this.floatingButtonContainer) return;
        this.floatingButtonContainer.style.top = `${window.innerHeight / 2 - this.floatingButtonContainer.offsetHeight / 2}px`;
        this.floatingButtonContainer.style.left = `${window.innerWidth / 2 - this.floatingButtonContainer.offsetWidth / 2}px`;
         this.ensureButtonInView(); // Ensure button is in view after centering
    }


    /**
     * Ensures the floating button is fully within the viewport bounds, adjusting position if needed.
     */
    ensureButtonInView() {
        if (!this.floatingButtonContainer) return;

        const container = this.floatingButtonContainer;
        let top = container.offsetTop;
        let left = container.offsetLeft;

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const buttonWidth = container.offsetWidth;
        const buttonHeight = container.offsetHeight;

        let adjusted = false; // Flag to track if position was adjusted

        if (top < 0) { top = 0; adjusted = true; } // Too far above
        if (left < 0) { left = 0; adjusted = true; } // Too far left
        if (top + buttonHeight > windowHeight) { top = windowHeight - buttonHeight; adjusted = true; } // Too far below
        if (left + buttonWidth > windowWidth) { left = windowWidth - buttonWidth; adjusted = true; } // Too far right

        if (adjusted) {
            container.style.top = top + "px";
            container.style.left = left + "px";
             this.saveFloatingButtonPosition(); // Save adjusted position
        }
    }


    /**
     * Restores the floating button position from localStorage if available.
     */
    restoreFloatingButtonPosition() {
        if (!this.floatingButtonContainer) return;
        const savedPosition = localStorage.getItem('gallery_floating_button_position');
        if (savedPosition) {
            try {
                const pos = JSON.parse(savedPosition);
                this.floatingButtonContainer.style.top = `${pos.top}px`;
                this.floatingButtonContainer.style.left = `${pos.left}px`;
            } catch (e) {
                console.warn("Error parsing saved button position from localStorage.", e);
            }
        }
    }

    /**
     * Saves the floating button position to localStorage.
     */
    saveFloatingButtonPosition() {
        if (!this.floatingButtonContainer) return;
        localStorage.setItem('gallery_floating_button_position', JSON.stringify({
            top: this.floatingButtonContainer.offsetTop,
            left: this.floatingButtonContainer.offsetLeft
        }));
    }


    /**
     * Sets up the window resize event listener to keep floating button in view.
     */
    setupResizeListener() {
        window.addEventListener('resize', this.resizeHandler); // Use instance's resizeHandler
    }

     /**
     * Removes the window resize event listener.
     */
    removeResizeListener() {
        window.removeEventListener('resize', this.resizeHandler);
    }


    /**
     * Handles window resize events to ensure floating button stays in view (using arrow function for correct 'this').
     */
    resizeHandler = () => { // Arrow function for correct 'this' binding
        this.ensureButtonInView();
    }


    /**
     * Makes the floating gallery button draggable and saves position on drag end.
     */
    makeButtonDraggable() {
        if (!this.galleryButton || !this.floatingButtonContainer) return;

        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const dragHandle = document.createElement('div');
        dragHandle.classList.add('floating-button-handle');
        this.floatingButtonContainer.insertBefore(dragHandle, this.galleryButton);

        dragHandle.addEventListener('mousedown', dragMouseDown);
        const self = this;

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.addEventListener('mouseup', closeDragElement);
            document.addEventListener('mousemove', elementDrag);
        }

        const elementDrag = (e) =>  {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;

            const container = this.floatingButtonContainer;
            let top = container.offsetTop - pos2;
            let left = container.offsetLeft - pos1;

            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const buttonWidth = container.offsetWidth;
            const buttonHeight = container.offsetHeight;

            top = Math.max(0, Math.min(top, windowHeight - buttonHeight));
            left = Math.max(0, Math.min(left, windowWidth - buttonWidth));

            container.style.top = top + "px";
            container.style.left = left + "px";
        };


        function closeDragElement() {
            document.removeEventListener('mouseup', closeDragElement);
            document.removeEventListener('mousemove', elementDrag);
            self.saveFloatingButtonPosition();
        }
    }

    /**
     * Creates the button to open the gallery.
     */
    createButton() {
        if (!this.galleryButton) {
            this.galleryButton = document.createElement('button');
            this.galleryButton.textContent = 'Open Gallery';
            this.galleryButton.classList.add('gallery-button');
            this.galleryButton.addEventListener('click', () => this.openGallery());
            this.openButtonBox.appendChild(this.galleryButton);
        }
    }

    /**
     * Creates the main gallery popup container and its contents.
     */
    createPopup() {
        if (!this.galleryPopup) {
            this.galleryPopup = document.createElement('div');
            this.galleryPopup.classList.add('gallery-popup');
            this.galleryPopup.style.display = 'none';

            const popupContent = document.createElement('div');
            popupContent.classList.add('popup-content');

            // Header Section (Close button, Search, Sort)
            const header = this.createPopupHeader();
            popupContent.appendChild(header);

            // Main Content Section (Folder Navigation, Image Display)
            const mainContent = document.createElement('div');
            mainContent.classList.add('popup-main-content');

            const folderNavigation = document.createElement('div');
            folderNavigation.classList.add('folder-navigation');
            mainContent.appendChild(folderNavigation);

            const imageDisplay = document.createElement('div');
            imageDisplay.classList.add('image-display');
            mainContent.appendChild(imageDisplay);

            popupContent.appendChild(mainContent);
            this.galleryPopup.appendChild(popupContent);
            document.body.appendChild(this.galleryPopup);

            this.populateFolderNavigation(folderNavigation);
            this.createFullscreenContainer();
            this.createInfoWindow();
            this.createRawMetadataWindow();

            this.galleryPopup.addEventListener('click', (event) => {
                if (event.target === this.galleryPopup) {
                    this.closeGallery();
                }
            });
        }
    }

    /**
     * Creates the header section of the popup, including close button, search, sort, and settings buttons.
     * @returns {HTMLDivElement} The header element.
     */
    createPopupHeader() {
        const header = document.createElement('div');
        header.classList.add('popup-header');

        // Close Button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.classList.add('close-button');
        closeButton.addEventListener('click', () => this.closeGallery());
        header.appendChild(closeButton);


        // Settings Button - ADDED HERE
        const settingsButton = document.createElement('button');
        settingsButton.textContent = 'Settings';
        settingsButton.classList.add('settings-button-header'); // Add specific class for header button
        settingsButton.addEventListener('click', () => {
            if (this.gallerySettings) { // Check if gallerySettings instance exists
                this.gallerySettings.openSettingsPopup();
            } else {
                console.warn("GallerySettings instance not available.");
            }
        });
        header.appendChild(settingsButton);


        // Search Container
        const searchContainer = document.createElement('div');
        searchContainer.classList.add('search-container');
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search...';
        searchInput.classList.add('search-input');
        searchInput.addEventListener('input', (event) => {
            this.searchText = event.target.value;
            this.loadFolderImages(this.currentFolder);
        });
        searchContainer.appendChild(searchInput);
        const clearSearchButton = document.createElement('button');
        clearSearchButton.textContent = '✕';
        clearSearchButton.classList.add('clear-search-button');
        clearSearchButton.addEventListener('click', () => {
            this.searchText = "";
            searchInput.value = "";
            this.loadFolderImages(this.currentFolder);
        });
        searchContainer.appendChild(clearSearchButton);
        header.appendChild(searchContainer);

        // Sort Buttons
        const sortDiv = document.createElement('div');
        sortDiv.classList.add('sort-buttons');
        const sortOptions = [
            { label: 'Newest', value: 'newest' },
            { label: 'Oldest', value: 'oldest' },
            { label: 'Name ↑', value: 'name_asc' },
            { label: 'Name ↓', value: 'name_desc' }
        ];
        sortOptions.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option.label;
            button.classList.add('sort-button');
            if (option.value === this.currentSort) {
                button.classList.add('active-sort');
            }
            button.addEventListener('click', () => this.sortImages(option.value));
            sortDiv.appendChild(button);
            this.sortButtons.push(button);
        });
        header.appendChild(sortDiv);

        return header;
    }


    /**
     * Creates the fullscreen container, used for both image and info windows.
     */
    createFullscreenContainer() {
        this.fullscreenContainer = document.createElement('div');
        this.fullscreenContainer.classList.add('fullscreen-container');
        this.fullscreenContainer.style.display = 'none';
        this.galleryPopup.appendChild(this.fullscreenContainer);

        this.fullscreenContainer.addEventListener('click', (event) => {
            if (event.target === this.fullscreenContainer) {
                this.closeFullscreenView();
            }
        });
    }

    /**
     * Creates the info window container.
     */
    createInfoWindow() {
        this.infoWindow = document.createElement('div');
        this.infoWindow.classList.add('info-window');
        this.infoWindow.style.display = 'none';

        const closeButton = document.createElement('span');
        closeButton.classList.add('info-close');
        closeButton.innerHTML = '×';
        closeButton.onclick = () => this.closeInfoWindow();
        this.infoWindow.appendChild(closeButton);

        const infoContent = document.createElement('div');
        infoContent.classList.add('info-content');
        this.infoWindow.appendChild(infoContent);

        this.fullscreenContainer.appendChild(this.infoWindow);
    }

    /**
     * Creates the raw metadata window container.
     */
    createRawMetadataWindow() {
        this.rawMetadataWindow = document.createElement('div');
        this.rawMetadataWindow.classList.add('raw-metadata-window');
        this.rawMetadataWindow.style.display = 'none';

        const closeButton = document.createElement('span');
        closeButton.classList.add('raw-metadata-close');
        closeButton.innerHTML = '×';
        closeButton.onclick = () => this.closeRawMetadataWindow();
        this.rawMetadataWindow.appendChild(closeButton);

        const metadataContent = document.createElement('div');
        metadataContent.classList.add('raw-metadata-content');
        this.rawMetadataWindow.appendChild(metadataContent);
        this.fullscreenContainer.appendChild(this.rawMetadataWindow);
    }

    /**
     * Populates the folder navigation pane.
     * @param {HTMLElement} navElement - The HTML element for folder navigation.
     */
    populateFolderNavigation(navElement) {
        if (!navElement) return;
        navElement.innerHTML = '';

        let folderNames = Object.keys(this.folders);
        if (folderNames.length === 0) {
            navElement.textContent = 'No folders available.';
            return;
        }

        folderNames.sort((a, b) => {
            const aParts = a.split('/');
            const bParts = b.split('/');
            for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
                if (aParts[i] < bParts[i]) return -1;
                if (aParts[i] > bParts[i]) return 1;
            }
            return aParts.length - bParts.length;
        });

        folderNames.forEach(folderName => {
            const folderButton = document.createElement('button');
            folderButton.textContent = folderName;
            folderButton.classList.add('folder-button');
            folderButton.addEventListener('click', () => this.loadFolderImages(folderName));
            if (folderName === this.currentFolder) {
                folderButton.classList.add('active-folder');
            } else {
                folderButton.classList.remove('active-folder');
            }
            navElement.appendChild(folderButton);
        });

        if (folderNames.length > 0) {
            this.loadFolderImages(this.currentFolder || folderNames[0]);
        }
    }

    /**
     * Loads and displays images for a given folder. (Modified to work with nested data structure)
     * @param {string} folderName - The name of the folder to load images from.
     */
    loadFolderImages(folderName) {
        if (!folderName) return;
        this.currentFolder = folderName;

        // Update active folder button
        const folderButtons = this.galleryPopup.querySelectorAll('.folder-button');
        folderButtons.forEach(button => {
            button.classList.toggle('active-folder', button.textContent === folderName);
        });

        const imageDisplay = this.galleryPopup?.querySelector('.image-display');
        if (!imageDisplay) return;

        imageDisplay.innerHTML = '';
        let folderContent = this.folders[folderName]; // Get folder content from nested structure

        if (!folderContent || Object.keys(folderContent).length === 0) { // Check if folderContent is empty
            imageDisplay.textContent = 'No images in this folder.';
            imageDisplay.classList.add('empty-gallery-message');
            return;
        }
        imageDisplay.classList.remove('empty-gallery-message');

        let images = Object.values(folderContent); // Get array of image info objects for sorting/filtering

        let filteredImages = images;
        if (this.searchText) {
            const searchTerm = this.searchText.toLowerCase();
            filteredImages = images.filter(imageInfo => imageInfo.name.toLowerCase().includes(searchTerm));
        }


        if (filteredImages.length === 0 && this.searchText) {
            imageDisplay.textContent = 'No images found for your search.';
            imageDisplay.classList.add('empty-gallery-message');
            return;
        }
        imageDisplay.classList.remove('empty-gallery-message');

        filteredImages = this.sortImagesArray(filteredImages, this.currentSort);

        let lastDate = null;
        filteredImages.forEach(imageInfo => {
            const imageDate = (this.currentSort === "newest" || this.currentSort === "oldest") ? imageInfo.date.split(" ")[0] : null;
            if (imageDate && imageDate !== lastDate) {
                const dateSeparator = document.createElement('div');
                dateSeparator.classList.add('date-separator');
                dateSeparator.textContent = imageDate;
                imageDisplay.appendChild(dateSeparator);
                lastDate = imageDate;
            }
            this.createImageCard(imageDisplay, imageInfo);
        });

        this.setupLazyLoading(imageDisplay);
    }

    /**
     * Creates and appends an image card to the image display area.
     * @param {HTMLElement} imageDisplay - The container for image cards.
     * @param {object} imageInfo - Information about the image (name, url, metadata).
     */
    createImageCard(imageDisplay, imageInfo) {
        const card = document.createElement('div');
        card.classList.add('image-card');

        const imageContainer = document.createElement('div');
        imageContainer.classList.add('image-container-inner');

        if (
            !imageInfo.name.endsWith(".mp4")
        ) {
            const imageElement = document.createElement('img');
            imageElement.alt = imageInfo.name;
            imageElement.dataset.src = imageInfo.url;
            imageElement.classList.add('gallery-image');
            imageElement.onerror = () => {
                imageElement.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M0 0h24v24H0z' fill='none'/%3E%3Cpath d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z' fill='%23c0392b'/%3E%3C/svg%3E";
            };
            imageElement.onclick = () => this.showFullscreenImage(imageInfo.url);
            imageContainer.appendChild(imageElement);
        } else {  
            const imageElement = document.createElement('video');
            imageElement.alt = imageInfo.name;
            imageElement.controls = false;
            if (this.currentSettings.autoPlayVideos) imageElement.autoplay = "autoplay";
            imageElement.loop = true;
            imageElement.muted = true;
            imageElement.src = imageInfo.url;
            imageElement.classList.add('gallery-media');
            imageElement.onerror = () => {
                imageElement.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M0 0h24v24H0z' fill='none'/%3E%3Cpath d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z' fill='%23c0392b'/%3E%3C/svg%3E";
            };
            imageElement.onload = () => {
                if (this.currentSettings.autoPlayVideos) imageElement.play();
            }
            imageElement.onclick = () => this.showFullscreenImage(imageInfo.url);
            imageContainer.appendChild(imageElement);
        }
        

        const overlay = document.createElement('div');
        overlay.classList.add('card-overlay');

        const imageName = document.createElement('span');
        imageName.classList.add('image-name');
        imageName.textContent = imageInfo.name;
        overlay.appendChild(imageName);

        if (
            !imageInfo.name.endsWith(".gif") &&
            !imageInfo.name.endsWith(".mp4")
        ) {
            const infoButton = document.createElement('button');
            infoButton.classList.add('info-button');
            infoButton.textContent = 'Info';
            infoButton.onclick = (event) => {
                event.stopPropagation();
                this.showInfoWindow(imageInfo.metadata, imageInfo.url);
            };
            overlay.appendChild(infoButton);
        }

        

        imageContainer.appendChild(overlay);
        card.appendChild(imageContainer);
        imageDisplay.appendChild(card);
    }


    /**
     * Displays a single image in fullscreen mode.
     * @param {string} imageUrl - The URL of the image to display.
     */
    showFullscreenImage(imageUrl) {
        this.fullscreenContainer.innerHTML = '';
        this.fullscreenContainer.style.display = 'flex';

        const closeButton = document.createElement('span');
        closeButton.classList.add('fullscreen-close');
        closeButton.innerHTML = '×';
        closeButton.onclick = () => this.closeFullscreenView();
        this.fullscreenContainer.appendChild(closeButton);

        if (!imageUrl.includes(".mp4&subfolder")) {
            this.fullscreenImage = document.createElement('img');
            this.fullscreenImage.classList.add('fullscreen-image');
            this.fullscreenImage.src = imageUrl;
            this.fullscreenContainer.appendChild(this.fullscreenImage);
        } else {
            this.fullscreenImage = document.createElement('video');
            this.fullscreenImage.classList.add('fullscreen-video');
            this.fullscreenImage.src = imageUrl;
            this.fullscreenImage.controls = true;
            this.fullscreenImage.autoplay = true;
            this.fullscreenImage.loop = true;
            this.fullscreenContainer.appendChild(this.fullscreenImage);
        }

        this.infoWindow.style.display = 'none';
        this.rawMetadataWindow.style.display = 'none';
        this.galleryPopup.style.zIndex = '1001';
    }

    /**
     * Shows the info window for an image, displaying its metadata.
     * @param {object} metadata - The metadata of the image.
     * @param {string} imageUrl - The URL of the image preview.
     */
    showInfoWindow(metadata, imageUrl) {
        this.fullscreenContainer.innerHTML = '';
        this.fullscreenContainer.style.display = 'flex';

        const closeButton = document.createElement('span');
        closeButton.classList.add('info-close');
        closeButton.innerHTML = '×';
        closeButton.onclick = () => this.closeFullscreenView();
        this.fullscreenContainer.appendChild(closeButton);

        const infoContent = document.createElement('div');
        infoContent.classList.add('info-content');
        this.fullscreenContainer.appendChild(infoContent);

        this.populateInfoWindowContent(infoContent, metadata, imageUrl);

        this.infoWindow.style.display = 'block';
        this.rawMetadataWindow.style.display = 'none';
        this.fullscreenImage = null;
        this.galleryPopup.style.zIndex = '1001';
    }


    /**
     * Populates the content of the info window with image metadata.
     * @param {HTMLElement} infoContent - The container for the info window content.
     * @param {object} metadata - The image metadata object.
     * @param {string} imageUrl - The URL of the image preview.
     */
    populateInfoWindowContent(infoContent, metadata, imageUrl) {
        infoContent.innerHTML = '';

        // Image Preview
        const previewImage = document.createElement('img');
        previewImage.src = imageUrl;
        previewImage.classList.add('info-preview-image');
        infoContent.appendChild(previewImage);

        const metadataTable = document.createElement('div');
        metadataTable.classList.add('metadata-table');
        infoContent.appendChild(metadataTable);

        const addMetadataRow = (label, value) => {
            const row = document.createElement('div');
            row.classList.add('metadata-row');
            const labelSpan = document.createElement('span');
            labelSpan.classList.add('metadata-label');
            labelSpan.textContent = label + ":";
            row.appendChild(labelSpan);
            const valueSpan = document.createElement('span');
            valueSpan.classList.add('metadata-value');
            valueSpan.textContent = value || 'N/A';
            row.appendChild(valueSpan);
            metadataTable.appendChild(row);
        };

        addMetadataRow("Filename", metadata.fileinfo?.filename);
        addMetadataRow("Resolution", metadata.fileinfo?.resolution);
        addMetadataRow("File Size", metadata.fileinfo?.size);
        addMetadataRow("Date Created", metadata.fileinfo?.date);
        addMetadataRow("Model", metadata.prompt?.['1']?.inputs?.ckpt_name || metadata.prompt?.['1']?.inputs?.ckpt_name?.content);
        addMetadataRow("Positive Prompt", metadata.prompt?.['2']?.inputs?.prompt || metadata.prompt?.['7']?.inputs?.text);
        addMetadataRow("Negative Prompt", metadata.prompt?.['3']?.inputs?.prompt || metadata.prompt?.['8']?.inputs?.text);
        addMetadataRow("Sampler", metadata.prompt?.['10']?.inputs?.sampler_name);
        addMetadataRow("Scheduler", metadata.prompt?.['10']?.inputs?.scheduler);
        addMetadataRow("Steps", metadata.prompt?.['10']?.inputs?.steps);
        addMetadataRow("CFG Scale", metadata.prompt?.['10']?.inputs?.cfg);
        addMetadataRow("Seed", metadata.prompt?.['10']?.inputs?.seed);

        let loras = [];
        for (const key in metadata.prompt) {
            if (metadata.prompt[key].class_type === 'LoraLoader') {
                loras.push(metadata.prompt[key].inputs.lora_name);
            } else if (metadata.prompt[key].class_type === 'Power Lora Loader (rgthree)') {
                for (let loraKey in metadata.prompt[key].inputs) {
                    if (loraKey.startsWith('lora_') && metadata.prompt[key].inputs[loraKey].on) {
                        loras.push(metadata.prompt[key].inputs[loraKey].lora);
                    }
                }
            }
        }
        addMetadataRow("LoRAs", loras.length > 0 ? loras.join(', ') : 'N/A');

        const rawMetadataButton = document.createElement('button');
        rawMetadataButton.textContent = 'Show Raw Metadata';
        rawMetadataButton.classList.add('raw-metadata-button');
        rawMetadataButton.onclick = (event) => {
            event.stopPropagation();
            this.showRawMetadataWindow(metadata);
        };
        infoContent.appendChild(rawMetadataButton);
    }


    /**
     * Shows the raw metadata window with JSON content.
     * @param {object} metadata - The raw metadata object to display.
     */
    showRawMetadataWindow(metadata) {
        this.fullscreenContainer.innerHTML = '';
        this.fullscreenContainer.style.display = 'flex';

        const closeButton = document.createElement('span');
        closeButton.classList.add('raw-metadata-close');
        closeButton.innerHTML = '×';
        closeButton.onclick = () => this.closeFullscreenView();
        this.fullscreenContainer.appendChild(closeButton);

        const metadataContent = document.createElement('div');
        metadataContent.classList.add('raw-metadata-content');
        this.fullscreenContainer.appendChild(metadataContent);

        const metadataTextarea = document.createElement('textarea');
        metadataTextarea.value = JSON.stringify(metadata, null, 2);
        metadataContent.appendChild(metadataTextarea);

        this.rawMetadataWindow.style.display = 'block';
        this.infoWindow.style.display = 'none';
        this.fullscreenImage = null;
        this.galleryPopup.style.zIndex = '1001';
    }

    /**
     * Closes the info window.
     */
    closeInfoWindow() {
        this.infoWindow.style.display = 'none';
        this.closeFullscreenView();
    }

    /**
     * Closes the raw metadata window.
     */
    closeRawMetadataWindow() {
        this.rawMetadataWindow.style.display = 'none';
        this.closeFullscreenView();
    }

    /**
     * Closes any fullscreen view (image, info, raw metadata).
     */
    closeFullscreenView() {
        this.fullscreenContainer.style.display = 'none';
        this.infoWindow.style.display = 'none';
        this.rawMetadataWindow.style.display = 'none';
        this.galleryPopup.style.zIndex = '1000';
    }


    /**
     * Sets up lazy loading for images in the given container.
     * @param {HTMLElement} container - The HTML container holding the images.
     */
    setupLazyLoading(container) {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    observer.unobserve(img);
                }
            });
        }, { rootMargin: '100px' });

        container.querySelectorAll('img').forEach(img => observer.observe(img));
    }

    /**
     * Sorts images based on the selected sort type.
     * @param {string} sortType - The type of sorting to apply ('newest', 'oldest', 'name_asc', 'name_desc').
     */
    sortImages(sortType) {
        if (this.currentSort === sortType) return;
        this.currentSort = sortType;

        this.sortButtons.forEach(button => {
            button.classList.remove('active-sort');
            if (button.textContent.toLowerCase().includes(sortType.replace("_asc", " ↑").replace("_desc", " ↓"))) {
                button.classList.add('active-sort');
            }
        });

        if (this.currentFolder) {
            this.loadFolderImages(this.currentFolder);
        }
    }


    /**
     * Sorts an array of image info objects based on the specified sort type.
     * @param {Array<object>} images - Array of image info objects.
     * @param {string} sortType - Sort type ('newest', 'oldest', 'name_asc', 'name_desc').
     * @returns {Array<object>} Sorted array of image info objects.
     */
    sortImagesArray(images, sortType) {
        const sortedImages = [...images];

        if (sortType === 'newest') {
            sortedImages.sort((a, b) => b.timestamp - a.timestamp);
        } else if (sortType === 'oldest') {
            sortedImages.sort((a, b) => a.timestamp - b.timestamp);
        } else if (sortType === 'name_asc') {
            sortedImages.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortType === 'name_desc') {
            sortedImages.sort((a, b) => b.name.localeCompare(b.name));
        }
        return sortedImages;
    }

    /**
     * Opens the gallery popup.
     */
    openGallery() {
        this.galleryPopup.style.display = 'flex';
        this.populateFolderNavigation(this.galleryPopup.querySelector('.folder-navigation'));
    }

    /**
     * Closes the gallery popup.
     */
    closeGallery() {
        if (this.galleryPopup) {
            this.galleryPopup.style.display = 'none';
        }
    }

    /**
     * Changes the button box where the gallery button is appended.
     * @param {HTMLElement} newButtonBox - The new button box element.
     */
    changeButtonBox(newButtonBox) {
        if (this.galleryButton && this.galleryButton.parentNode === this.openButtonBox) {
            this.openButtonBox.removeChild(this.galleryButton);
        }
        this.openButtonBox = newButtonBox;
        if (this.galleryButton) {
            this.openButtonBox.appendChild(this.galleryButton);
        }
    }

    /**
     * Clears the gallery by resetting the folders data.
     */
    clearGallery() {
        this.folders = {};
        if (this.galleryPopup) {
            this.populateFolderNavigation(this.galleryPopup.querySelector('.folder-navigation'));
        }
    }

    /**
     * Initializes the gallery with initial folder data.
     * @param {object} initialFolders - Initial folders data in nested dictionary format.
     */
    initializeFolders(initialFolders) {
        this.folders = initialFolders;
        if (this.galleryPopup) {
            this.populateFolderNavigation(this.galleryPopup.querySelector('.folder-navigation'));
        }
    }

    /**
     * Updates the gallery with changes received from the server.
     * @param {object} changes - An object describing the changes, in format:
     * { folders: { folderName: { fileName: { action: "create" | "update" | "remove", ...data } } } }
     */
    updateImages(changes) {
        if (!changes || !changes.folders) {
            console.warn("No valid changes data received.");
            return;
        }

        const imageDisplay = this.galleryPopup?.querySelector('.image-display');
        const scrollTop = imageDisplay ? imageDisplay.scrollTop : 0; // Preserve scroll position

        for (const folderName in changes.folders) {
            const folderChanges = changes.folders[folderName];
            if (!this.folders[folderName] && folderChanges) {
                 this.folders[folderName] = {}; // Initialize folder if it doesn't exist yet
                 this.populateFolderNavigation(this.galleryPopup.querySelector('.folder-navigation')); // Re-populate navigation to show new folder
            }
            if (this.folders[folderName]) { // Proceed only if folder exists (or was just created)
                for (const filename in folderChanges) {
                    const fileChange = folderChanges[filename];
                    switch (fileChange.action) {
                        case 'create':
                            this.createFile(folderName, filename, fileChange);
                            break;
                        case 'update':
                            this.updateFile(folderName, filename, fileChange);
                            break;
                        case 'remove':
                            this.removeFile(folderName, filename);
                            break;
                        default:
                            console.warn(`Unknown action: ${fileChange.action}`);
                    }
                }
             } else {
                console.warn(`Change for non-existent folder: ${folderName}`);
             }
        }


        if (imageDisplay) {
            imageDisplay.scrollTop = scrollTop; // Restore scroll position
        }
        if (this.currentFolder) { // Refresh display for current folder to reflect changes
            this.loadFolderImages(this.currentFolder);
        }
    }


    /**
     * Handles the creation of a new file in the gallery data and UI.
     * @param {string} folderName - The name of the folder.
     * @param {string} filename - The name of the file.
     * @param {object} fileData - The data for the new file.
     */
    createFile(folderName, filename, fileData) {
        if (!this.folders[folderName]) {
            this.folders[folderName] = {};
        }
        this.folders[folderName][filename] = fileData;
        console.log(`File created: ${folderName}/${filename}`);
        // UI update for current folder is handled in updateImages -> loadFolderImages
    }

    /**
     * Handles the update of an existing file in the gallery data.
     * @param {string} folderName - The name of the folder.
     * @param {string} filename - The name of the file.
     * @param {object} updatedFileData - The updated data for the file.
     */
    updateFile(folderName, filename, updatedFileData) {
        if (this.folders[folderName] && this.folders[folderName][filename]) {
            // Merge updated data, keep existing object to maintain references if needed in UI
            Object.assign(this.folders[folderName][filename], updatedFileData);
            console.log(`File updated: ${folderName}/${filename}`);
             // UI update for current folder is handled in updateImages -> loadFolderImages
        } else {
            console.warn(`Update failed: ${folderName}/${filename} not found.`);
        }
    }

    /**
     * Handles the removal of a file from the gallery data and UI.
     * @param {string} folderName - The name of the folder.
     * @param {string} filename - The name of the file to remove.
     */
    removeFile(folderName, filename) {
        if (this.folders[folderName] && this.folders[folderName][filename]) {
            delete this.folders[folderName][filename];
            console.log(`File removed: ${folderName}/${filename}`);
            if (Object.keys(this.folders[folderName]).length === 0) {
                delete this.folders[folderName]; // Remove folder if it becomes empty
                 this.populateFolderNavigation(this.galleryPopup.querySelector('.folder-navigation')); // Update folder nav if folder removed
            }
            // UI update for current folder is handled in updateImages -> loadFolderImages
        } else {
            console.warn(`Remove failed: ${folderName}/${filename} not found.`);
        }
    }

    /**
     * Loads and displays images for a given folder. (Modified to work with nested data structure)
     * @param {string} folderName - The name of the folder to load images from.
     */
    loadFolderImages(folderName) {
        if (!folderName) return;
        this.currentFolder = folderName;

        // Update active folder button
        const folderButtons = this.galleryPopup.querySelectorAll('.folder-button');
        folderButtons.forEach(button => {
            button.classList.toggle('active-folder', button.textContent === folderName);
        });

        const imageDisplay = this.galleryPopup?.querySelector('.image-display');
        if (!imageDisplay) return;

        imageDisplay.innerHTML = '';
        let folderContent = this.folders[folderName]; // Get folder content from nested structure

        if (!folderContent || Object.keys(folderContent).length === 0) { // Check if folderContent is empty
            imageDisplay.textContent = 'No images in this folder.';
            imageDisplay.classList.add('empty-gallery-message');
            return;
        }
        imageDisplay.classList.remove('empty-gallery-message');

        let images = Object.values(folderContent); // Get array of image info objects for sorting/filtering

        let filteredImages = images;
        if (this.searchText) {
            const searchTerm = this.searchText.toLowerCase();
            filteredImages = images.filter(imageInfo => imageInfo.name.toLowerCase().includes(searchTerm));
        }


        if (filteredImages.length === 0 && this.searchText) {
            imageDisplay.textContent = 'No images found for your search.';
            imageDisplay.classList.add('empty-gallery-message');
            return;
        }
        imageDisplay.classList.remove('empty-gallery-message');

        filteredImages = this.sortImagesArray(filteredImages, this.currentSort);

        let lastDate = null;
        filteredImages.forEach(imageInfo => {
            const imageDate = (this.currentSort === "newest" || this.currentSort === "oldest") ? imageInfo.date.split(" ")[0] : null;
            if (imageDate && imageDate !== lastDate) {
                const dateSeparator = document.createElement('div');
                dateSeparator.classList.add('date-separator');
                dateSeparator.textContent = imageDate;
                imageDisplay.appendChild(dateSeparator);
                lastDate = imageDate;
            }
            this.createImageCard(imageDisplay, imageInfo);
        });

        this.setupLazyLoading(imageDisplay);
    }

    /**
     * Applies CSS styles to the document head.
     */
    applyStyles() {
        const style = document.createElement('style');
        style.textContent = galleryStyles; // Use imported styles
        document.head.appendChild(style);
    }
}