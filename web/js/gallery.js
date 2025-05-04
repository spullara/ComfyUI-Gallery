// gallery.js (Modified)

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
        /** @type {number | null} */
        this.currentIndex = null;
        /** @type {Array<object> | null} */
        this.currentFilteredImages = null;

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
        this.updateHideOpenButton(this.currentSettings.hideOpenButton); // ADDED: Initial button visibility
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
     * Updates the hide/show state of the open button.
     * @param {boolean} hide - True to hide the button, false to show it.
     */
    updateHideOpenButton(hide) {
        this.currentSettings.hideOpenButton = hide;
        if (this.galleryButton) {
            this.galleryButton.style.display = hide ? 'none' : 'block'; // Or 'inline-block', etc.
        }
        if (this.floatingButtonContainer) { // Also hide/show floating container
            this.floatingButtonContainer.style.display = hide ? 'none' : 'flex';
        }
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

        const elementDrag = (e) => {
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
            this.folderNavigation = folderNavigation; // Store reference for drag-and-drop

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

        // Close On Hover button
        let seconds = 3;
        const closeOnHoverButton = document.createElement('button');
        closeOnHoverButton.id = "close-on-hover-button";
        closeOnHoverButton.style.display = "none";
        closeOnHoverButton.textContent = `Hover to close (${seconds}s)`;
        closeOnHoverButton.classList.add('settings-button-header'); // Add specific class for header button
        closeOnHoverButton.style.backgroundColor = "#3498db";
        let timeout = null;
        let timeTimeouts = [];
        closeOnHoverButton.addEventListener('dragenter', () => { console.log("hover start")
            closeOnHoverButton.style.backgroundColor = "#c0392b";
            for (let i = 1; i < seconds + 1; i++) {
                timeTimeouts[i] = setTimeout(() => {
                    closeOnHoverButton.textContent = `Hover to close (${seconds - i}s)`;
                }, i * 1000);
            }
            timeout = setTimeout(() => {
                this.closeGallery();
            }, 3000);
        });
        closeOnHoverButton.addEventListener('dragleave', () => { console.log("hover stop")
            try {
                clearTimeout(timeout);
            } catch {

            }
            for (let i = 0; i < timeTimeouts.length; i++) {
                try {
                    clearTimeout(timeTimeouts[i]);
                } catch {
                    closeOnHoverButton.textContent = `Hover to close (${seconds}s)`;
                }
            }
            closeOnHoverButton.style.backgroundColor = "#3498db";
            closeOnHoverButton.textContent = `Hover to close (${seconds}s)`;
        });
        header.appendChild(closeOnHoverButton);
    
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
            folderButton.setAttribute('data-folder-name', folderName); // Add data attribute for drag-and-drop
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

        this.setupFolderDragAndDrop(); // Set up drag-and-drop listeners after populating
    }

    /**
     * Loads and displays images for a given folder. (Modified to work with nested data structure and provide index)
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
        filteredImages.forEach((imageInfo, index) => { // Pass index here
            const imageDate = (this.currentSort === "newest" || this.currentSort === "oldest") ? imageInfo.date.split(" ")[0] : null;
            if (imageDate && imageDate !== lastDate) {
                const dateSeparator = document.createElement('div');
                dateSeparator.classList.add('date-separator');
                dateSeparator.textContent = imageDate;
                imageDisplay.appendChild(dateSeparator);
                lastDate = imageDate;
            }
            // CORRECTED: index and filteredImages were already in scope.
            this.createImageCard(imageDisplay, imageInfo, index, filteredImages);
        });

        this.setupLazyLoading(imageDisplay);
    }

    /**
     * Creates and appends an image card to the image display area.
     * @param {HTMLElement} imageDisplay - The container for image cards.
     * @param {object} imageInfo - Information about the image (name, url, metadata).
     * @param {number} index - The index of the image in the *filtered* list.
     * @param {Array<object>} filteredImages - Array of filtered image info.
     */
    createImageCard(imageDisplay, imageInfo, index, filteredImages) {
        const card = document.createElement('div');
        card.classList.add('image-card');
        card.setAttribute('draggable', 'true'); // Make cards draggable
        card.setAttribute('data-image-url', imageInfo.url); // Store URL for drag-and-drop and delete
        card.setAttribute('data-image-name', imageInfo.name); // Store image name for drag and drop
        card.setAttribute('data-image-folder', this.currentFolder);

        const imageContainer = document.createElement('div');
        imageContainer.classList.add('image-container-inner');

        if (
            !imageInfo.name.endsWith(".mp4") &&
            !imageInfo.name.endsWith(".webm")
        ) {
            const imageElement = document.createElement('img');
            imageElement.alt = imageInfo.name;
            imageElement.dataset.src = imageInfo.url;
            imageElement.classList.add('gallery-image');
            imageElement.onerror = () => {
                imageElement.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M0 0h24v24H0z' fill='none'/%3E%3Cpath d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z' fill='%23c0392b'/%3E%3C/svg%3E";
            };
            // Ensure index and filteredImages are passed correctly
            imageElement.onclick = () => {
                if (typeof index === 'undefined' || !filteredImages) {
                    console.error("createImageCard: onclick: index or filteredImages is undefined!", { index, filteredImages });
                }
                this.showFullscreenImage(imageInfo.url, index, filteredImages);
            };
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
            // Ensure index and filteredImages are passed correctly
            imageElement.onclick = () => {
                if (typeof index === 'undefined' || !filteredImages) {
                    console.error("createImageCard: onclick: index or filteredImages is undefined!", { index, filteredImages });
                }
                this.showFullscreenImage(imageInfo.url, index, filteredImages);
            };
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
            !imageInfo.name.endsWith(".mp4") &&
            !imageInfo.name.endsWith(".webm")
        ) {
            const infoButton = document.createElement('button');
            infoButton.classList.add('info-button');
            infoButton.textContent = 'Info';
            infoButton.onclick = (event) => {
                event.stopPropagation();
                // Ensure index and filteredImages are passed correctly
                if (typeof index === 'undefined' || !filteredImages) {
                    console.error("createImageCard: infoButton onclick: index or filteredImages is undefined!", { index, filteredImages });
                }
                this.showInfoWindow(imageInfo.metadata, imageInfo.url, index, filteredImages);
            };
            overlay.appendChild(infoButton);
        }

        imageContainer.appendChild(overlay);
        card.appendChild(imageContainer);
        imageDisplay.appendChild(card);

        this.setupCardDragEvents(card); // Add drag event listeners to the card
    }


    /**
 * Displays a single image in fullscreen mode, with next/previous buttons.
 * @param {string} imageUrl - The URL of the image to display.
 * @param {number} index - The index of the image within the *filtered* image list.
 * @param {Array<object>} filteredImages - The array of currently filtered images.
 */
    showFullscreenImage(imageUrl, index, filteredImages) {
        console.log("showFullscreenImage called:", { imageUrl, index, filteredImages }); // DEBUGGING

        this.fullscreenContainer.innerHTML = '';
        this.fullscreenContainer.style.display = 'flex';

        const closeButton = document.createElement('span');
        closeButton.classList.add('fullscreen-close');
        closeButton.innerHTML = '×';
        closeButton.onclick = () => this.closeFullscreenView();
        this.fullscreenContainer.appendChild(closeButton);

        // Previous Button
        const prevButton = document.createElement('button');
        prevButton.textContent = '<';
        prevButton.style.position = 'absolute';
        prevButton.style.left = '20px';
        prevButton.style.top = '50%';
        prevButton.style.transform = 'translateY(-50%)';
        prevButton.style.zIndex = '2002';
        prevButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        prevButton.style.color = 'white';
        prevButton.style.border = 'none';
        prevButton.style.padding = '10px 15px';
        prevButton.style.fontSize = '20px';
        prevButton.style.cursor = 'pointer';
        prevButton.onclick = (event) => {
            event.stopPropagation();
            if (filteredImages && filteredImages.length > 0) { // More robust check
                const prevIndex = (index - 1 + filteredImages.length) % filteredImages.length;
                this.showFullscreenImage(filteredImages[prevIndex].url, prevIndex, filteredImages);
            } else {
                console.warn("showFullscreenImage: prevButton: filteredImages is invalid", filteredImages);
            }
        };

        // More robust condition for displaying the previous button
        if (filteredImages && filteredImages.length > 1 && index > 0) {
            this.fullscreenContainer.appendChild(prevButton);
            console.log("Previous button added"); // DEBUG
        } else {
            console.log("Previous button NOT added. Conditions:", {
                filteredImagesExist: !!filteredImages,
                lengthGreaterThan1: filteredImages ? filteredImages.length > 1 : false,
                indexGreaterThan0: index > 0,
            }); // DEBUG
        }


        // Next Button
        const nextButton = document.createElement('button');
        nextButton.textContent = '>';
        nextButton.style.position = 'absolute';
        nextButton.style.right = '20px';
        nextButton.style.top = '50%';
        nextButton.style.transform = 'translateY(-50%)';
        nextButton.style.zIndex = '2002';
        nextButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        nextButton.style.color = 'white';
        nextButton.style.border = 'none';
        nextButton.style.padding = '10px 15px';
        nextButton.style.fontSize = '20px';
        nextButton.style.cursor = 'pointer';
        nextButton.onclick = (event) => {
            event.stopPropagation();
            if (filteredImages && filteredImages.length > 0) { // More robust check
                const nextIndex = (index + 1) % filteredImages.length;
                this.showFullscreenImage(filteredImages[nextIndex].url, nextIndex, filteredImages);
            } else {
                console.warn("showFullscreenImage: nextButton: filteredImages is invalid", filteredImages);
            }
        };

        // More robust condition for displaying the next button
        if (filteredImages && filteredImages.length > 1 && index < filteredImages.length - 1) {
            this.fullscreenContainer.appendChild(nextButton);
            console.log("Next button added"); // DEBUG
        } else {
            console.log("Next button NOT added. Conditions:", {
                filteredImagesExist: !!filteredImages,
                lengthGreaterThan1: filteredImages ? filteredImages.length > 1 : false,
                indexLessThanLengthMinus1: filteredImages ? index < filteredImages.length - 1 : false,
            }); // DEBUG
        }


        if (
            !imageUrl.includes(".mp4") &&
            !imageUrl.includes(".webm")
        ) {
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

        this.currentIndex = index;
        this.currentFilteredImages = filteredImages;
    }

    /**
     * Shows the info window, with next/previous buttons for other images.
     * @param {object} metadata - The metadata of the image.
     * @param {string} imageUrl - The URL of the image.
     * @param {number} index - The index of the image in the filtered list.
     * @param {Array<object>} filteredImages -  The array of currently filtered images.
     */
    showInfoWindow(metadata, imageUrl, index, filteredImages) {
        console.log("showInfoWindow called:", { metadata, imageUrl, index, filteredImages }); // DEBUGGING

        this.fullscreenContainer.innerHTML = '';
        this.fullscreenContainer.style.display = 'flex';

        const closeButton = document.createElement('span');
        closeButton.classList.add('info-close');
        closeButton.innerHTML = '×';
        closeButton.onclick = () => this.closeFullscreenView();
        this.fullscreenContainer.appendChild(closeButton);

        // Previous Button
        const prevButton = document.createElement('button');
        prevButton.textContent = '<';
        prevButton.style.position = 'absolute';
        prevButton.style.left = '20px';
        prevButton.style.top = '50%';
        prevButton.style.transform = 'translateY(-50%)';
        prevButton.style.zIndex = '2002'; // Ensure it's above the content
        prevButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        prevButton.style.color = 'white';
        prevButton.style.border = 'none';
        prevButton.style.padding = '10px 15px';
        prevButton.style.fontSize = '20px';
        prevButton.style.cursor = 'pointer';
        prevButton.onclick = (event) => {
            event.stopPropagation();
            if (filteredImages && filteredImages.length > 0) { // More robust check
                const prevIndex = (index - 1 + filteredImages.length) % filteredImages.length;
                this.showInfoWindow(filteredImages[prevIndex].metadata, filteredImages[prevIndex].url, prevIndex, filteredImages);
            } else {
                console.warn("showInfoWindow: prevButton: filteredImages is invalid", filteredImages);
            }
        };

        // More robust condition for displaying the previous button
        if (filteredImages && filteredImages.length > 1 && index > 0) {
            this.fullscreenContainer.appendChild(prevButton);
            console.log("Previous button added"); // DEBUG
        } else {
            console.log("Previous button NOT added. Conditions:", {
                filteredImagesExist: !!filteredImages,
                lengthGreaterThan1: filteredImages ? filteredImages.length > 1 : false,
                indexGreaterThan0: index > 0,
            }); // DEBUG
        }

        // Next Button
        const nextButton = document.createElement('button');
        nextButton.textContent = '>';
        nextButton.style.position = 'absolute';
        nextButton.style.right = '20px';
        nextButton.style.top = '50%';
        nextButton.style.transform = 'translateY(-50%)';
        nextButton.style.zIndex = '2002';
        nextButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        nextButton.style.color = 'white';
        nextButton.style.border = 'none';
        nextButton.style.padding = '10px 15px';
        nextButton.style.fontSize = '20px';
        nextButton.style.cursor = 'pointer';
        nextButton.onclick = (event) => {
            event.stopPropagation();
            if (filteredImages && filteredImages.length > 0) { // More robust check
                const nextIndex = (index + 1) % filteredImages.length;
                this.showInfoWindow(filteredImages[nextIndex].metadata, filteredImages[nextIndex].url, nextIndex, filteredImages);
            } else {
                console.warn("showInfoWindow: nextButton: filteredImages is invalid", filteredImages);
            }
        };

        // More robust condition for displaying the next button
        if (filteredImages && filteredImages.length > 1 && index < filteredImages.length - 1) {
            this.fullscreenContainer.appendChild(nextButton);
            console.log("Next button added"); // DEBUG
        } else {
            console.log("Next button NOT added. Conditions:", {
                filteredImagesExist: !!filteredImages,
                lengthGreaterThan1: filteredImages ? filteredImages.length > 1 : false,
                indexLessThanLengthMinus1: filteredImages ? index < filteredImages.length - 1 : false,
            }); // DEBUG
        }

        const infoContent = document.createElement('div');
        infoContent.classList.add('info-content');
        this.fullscreenContainer.appendChild(infoContent);

        this.populateInfoWindowContent(infoContent, metadata, imageUrl);

        this.infoWindow.style.display = 'block';
        this.rawMetadataWindow.style.display = 'none';
        this.fullscreenImage = null;
        this.galleryPopup.style.zIndex = '1001';

        this.currentIndex = index;
        this.currentFilteredImages = filteredImages;
    }


    /**
 * Populates the content of the info window with image metadata.
 * @param {HTMLElement} infoContent - The container for the info window content.
 * @param {object} metadata - The image metadata object.
 * @param {string} imageUrl - The URL of the image preview.
 * @param {number} index - The index of the image in the filtered list.
 * @param {Array<object>} filteredImages -  The array of currently filtered images.
 */
    populateInfoWindowContent(infoContent, metadata, imageUrl, index, filteredImages) {
        infoContent.innerHTML = '';

        // --- Main Container (Flex Container with Wrap) ---
        const infoContainer = document.createElement('div');
        infoContainer.classList.add('info-container');

        // --- Left Side: Image and Overlay ---
        const imageSide = document.createElement('div');
        imageSide.classList.add('info-image-side');

        const previewContainer = document.createElement('div');
        previewContainer.classList.add('info-preview-container');

        const previewImage = document.createElement('img');
        previewImage.src = imageUrl;
        previewImage.classList.add('info-preview-image');
        previewContainer.appendChild(previewImage);

        const buttonOverlay = document.createElement('div');
        buttonOverlay.classList.add('info-button-overlay');

        // Share and Download buttons (same as before)
        const shareButton = document.createElement('button');
        shareButton.classList.add('info-overlay-button', 'share-button');
        shareButton.textContent = '🔗'; // Placeholder
        shareButton.onclick = async (event) => {
            event.stopPropagation();
            if (navigator.share) {
                try {
                    const response = await fetch(imageUrl);
                    const blob = await response.blob();
                    const filename = metadata.fileinfo?.filename || 'image.png';
                    const filesArray = [new File([blob], filename, { type: blob.type })];
                    await navigator.share({ files: filesArray, title: filename });
                    console.log('Shared successfully');
                } catch (error) {
                    console.error('Sharing failed:', error);
                    alert('Sharing failed. Check browser support/secure connection.');
                }
            } else { alert('Web Share API not supported.'); }
        };
        buttonOverlay.appendChild(shareButton);

        const downloadButton = document.createElement('button');
        downloadButton.classList.add('info-overlay-button', 'download-button');
        downloadButton.textContent = '⬇'; // Placeholder
        downloadButton.onclick = (event) => {
            event.stopPropagation();
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
        buttonOverlay.appendChild(downloadButton);

        previewContainer.appendChild(buttonOverlay);
        imageSide.appendChild(previewContainer);

        // --- Right Side: Metadata and Buttons ---
        const infoSide = document.createElement('div');
        infoSide.classList.add('info-info-side');

        // Button Container (Raw Metadata and Delete) - *BEFORE* Metadata
        const bottomButtonContainer = document.createElement('div');
        bottomButtonContainer.classList.add('info-bottom-buttons');

        const rawMetadataButton = document.createElement('button');
        rawMetadataButton.textContent = 'Show Raw Metadata';
        rawMetadataButton.classList.add('raw-metadata-button');
        rawMetadataButton.onclick = (event) => {
            event.stopPropagation();
            this.showRawMetadataWindow(metadata);
        };
        bottomButtonContainer.appendChild(rawMetadataButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.classList.add('delete-button');
        deleteButton.onclick = (event) => {
            event.stopPropagation();
            this.confirmAndDelete(imageUrl);
        };
        bottomButtonContainer.appendChild(deleteButton);

        infoSide.appendChild(bottomButtonContainer); // Add buttons *before* metadata

        // Metadata Table (same as before)
        const metadataContainer = document.createElement('div');
        metadataContainer.classList.add('metadata-container');
        const metadataTable = document.createElement('div');
        metadataTable.classList.add('metadata-table');
        metadataContainer.appendChild(metadataTable);

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
            valueSpan.style.cursor = 'pointer'; // Add cursor pointer
            valueSpan.title = 'Click to copy';   // Add title for tooltip
            valueSpan.onclick = (event) => {
                event.stopPropagation();
                navigator.clipboard.writeText(value).then(() => {
                    console.log(`${label} copied to clipboard`);

                    let tooltip = valueSpan.querySelector('.tooltip');
                    if (!tooltip) {
                        tooltip = document.createElement('span');
                        tooltip.classList.add('tooltip');
                        tooltip.textContent = 'Copied!';
                        valueSpan.appendChild(tooltip);
                        valueSpan.style.position = 'relative'; // Ensure relative positioning
                    }

                    // Get mouse position
                    const x = event.clientX;
                    const y = event.clientY;

                    // Position the tooltip (initial positioning)
                    tooltip.style.left = `${x}px`;
                    tooltip.style.top = `${y}px`;


                    // Show the tooltip
                    tooltip.classList.add('tooltip-show');

                    // Hide tooltip after delay
                    setTimeout(() => {
                        tooltip.classList.remove('tooltip-show');
                        tooltip.classList.add('tooltip-hide');
                        setTimeout(() => {
                            if (tooltip.parentNode) {
                                tooltip.parentNode.removeChild(tooltip);
                            }
                        }, 200);
                    }, 1000);

                }).catch(err => {
                    console.error('Could not copy text: ', err);
                });
            };
            row.appendChild(valueSpan);
            metadataTable.appendChild(row);
        };

        addMetadataRow("Filename", metadata.fileinfo?.filename);
        addMetadataRow("Resolution", metadata.fileinfo?.resolution);
        addMetadataRow("File Size", metadata.fileinfo?.size);
        addMetadataRow("Date Created", metadata.fileinfo?.date);


        let workflowToParse = null;

        // Prioritize workflow.nodes, then workflow, then prompt, handling JSON parsing
        if (metadata.workflow && typeof metadata.workflow === 'string') {
            try {
                metadata.workflow = JSON.parse(metadata.workflow);
            } catch (e) {
                console.warn("Error parsing workflow JSON:", e);
            }
        }

        if (metadata.prompt && typeof metadata.prompt === 'string') {
            try {
                metadata.prompt = JSON.parse(metadata.prompt);
            } catch (e) {
                console.warn("Error parsing prompt JSON:", e);
            }
        }

        if (metadata?.workflow?.nodes && Array.isArray(metadata.workflow.nodes)) {
            workflowToParse = metadata.workflow.nodes;
        } else if (metadata?.workflow && typeof metadata.workflow === 'object') {
            workflowToParse = metadata.workflow;
        } else if (metadata?.prompt && typeof metadata.prompt === 'object') {
            workflowToParse = metadata.prompt
        } else {
            console.warn("No workflow or prompt data found in metadata.", metadata);
        }

        const parsedMetadata = workflowToParse ? this.parseWorkflow(workflowToParse) : {};


        addMetadataRow("Model", parsedMetadata.Model || metadata.prompt?.['1']?.inputs?.ckpt_name || metadata.prompt?.['1']?.inputs?.ckpt_name?.content);
        addMetadataRow("Positive Prompt", parsedMetadata["Positive Prompt"] || metadata.prompt?.['2']?.inputs?.prompt || metadata.prompt?.['7']?.inputs?.text);
        addMetadataRow("Negative Prompt", parsedMetadata["Negative Prompt"] || metadata.prompt?.['3']?.inputs?.prompt || metadata.prompt?.['8']?.inputs?.text);
        addMetadataRow("Sampler", parsedMetadata.Sampler || metadata.prompt?.['10']?.inputs?.sampler_name);
        addMetadataRow("Scheduler", parsedMetadata.Scheduler || metadata.prompt?.['10']?.inputs?.scheduler);
        addMetadataRow("Steps", parsedMetadata.Steps || metadata.prompt?.['10']?.inputs?.steps);
        addMetadataRow("CFG Scale", parsedMetadata["CFG Scale"] || metadata.prompt?.['10']?.inputs?.cfg);
        addMetadataRow("Seed", parsedMetadata.Seed || metadata.prompt?.['10']?.inputs?.seed);


        let loras = [];
        if (parsedMetadata.LoRAs) {
            if (Array.isArray(parsedMetadata.LoRAs)) {
                parsedMetadata.LoRAs.forEach(lora => {
                    if (typeof lora === 'object' && lora.name) {
                        loras.push(`${lora.name} (Model: ${lora.model_strength}, Clip: ${lora.clip_strength})`);
                    } else if (typeof lora === 'string') {
                        loras.push(lora)
                    }
                });
            } else if (typeof parsedMetadata.LoRAs === 'object' && parsedMetadata.LoRAs.name) {
                loras.push(`${parsedMetadata.LoRAs.name} (Model: ${parsedMetadata.LoRAs.model_strength}, Clip: ${parsedMetadata.LoRAs.clip_strength})`);
            }
        } else {
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
        }
        addMetadataRow("LoRAs", loras.length > 0 ? loras.join(', ') : 'N/A');
        infoSide.appendChild(metadataContainer); // Add metadata *after* buttons


        // --- Assemble Everything ---
        infoContainer.appendChild(imageSide);
        infoContainer.appendChild(infoSide);
        infoContent.appendChild(infoContainer);
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
        this.currentIndex = null;
        this.currentFilteredImages = null;
    }

    /**
     * Handles keydown events for hotkey navigation.
     * @param {KeyboardEvent} event - The keydown event.
     */
    handleKeyDown = (event) => {
        const { key: pressedKey } = event;
        const isFullscreenVisible = this.fullscreenContainer.style.display === 'flex';
        const isInfoVisible = this.infoWindow.style.display === 'block';
        const hasImages = Array.isArray(this.currentFilteredImages);

        if (pressedKey === 'Escape') {
            isFullscreenVisible ? this.closeFullscreenView() : this.closeGallery();
            return;
        }

        if (!hasImages || !['ArrowLeft', 'ArrowRight'].includes(pressedKey)) return;

        const canMoveLeft = pressedKey === 'ArrowLeft' && this.currentIndex > 0;
        const canMoveRight = pressedKey === 'ArrowRight' && this.currentIndex < this.currentFilteredImages.length - 1;

        if (!canMoveLeft && !canMoveRight) return;

        event.preventDefault();
        const newIndex = this.currentIndex + (pressedKey === 'ArrowLeft' ? -1 : 1);
        const imageData = this.currentFilteredImages[newIndex];
    
        if (isFullscreenVisible && this.infoWindow.style.display === 'none') {
            this.showFullscreenImage(imageData.url, newIndex, this.currentFilteredImages);
        } else if (isInfoVisible) {
            this.showInfoWindow(imageData.metadata, imageData.url, newIndex, this.currentFilteredImages);
        }
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
            sortedImages.sort((a, b) => b.name.localeCompare(a.name));
        }
        return sortedImages;
    }

    /**
     * Opens the gallery popup.
     */
    openGallery() {
        this.galleryPopup.style.display = 'flex';
        this.populateFolderNavigation(this.galleryPopup.querySelector('.folder-navigation'));
        document.addEventListener('keydown', this.handleKeyDown);
    }

    /**
     * Closes the gallery popup.
     */
    closeGallery() {
        if (this.galleryPopup) {
            document.removeEventListener('keydown', this.handleKeyDown);
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
     * Applies CSS styles to the document head.
     */
    applyStyles() {
        const style = document.createElement('style');
        style.textContent = galleryStyles; // Use imported styles
        document.head.appendChild(style);
    }

    /**
* Parses a workflow object to extract relevant metadata.
* @param {object} workflow - The workflow object or array of nodes.
* @returns {object} Extracted metadata.
*/
    parseWorkflow(workflow) {
        // Handle cases where workflow might be an object, not just an array of nodes
        if (!Array.isArray(workflow) && typeof workflow === 'object') {
            const extractedData = {};
            for (const key in workflow) {
                if (workflow[key]?.inputs?.ckpt_name) {
                    extractedData.Model = workflow[key].inputs.ckpt_name;
                } else if (workflow[key]?.inputs?.text && (key === '2' || key === '7')) {
                    extractedData["Positive Prompt"] = workflow[key].inputs.text
                } else if (workflow[key]?.inputs?.text && (key === '3' || key === '8')) {
                    extractedData["Negative Prompt"] = workflow[key].inputs.text
                } else if (workflow[key]?.inputs?.sampler_name) {
                    extractedData["Sampler"] = workflow[key].inputs.sampler_name
                } else if (workflow[key]?.inputs?.scheduler) {
                    extractedData["Scheduler"] = workflow[key].inputs.scheduler
                } else if (workflow[key]?.inputs?.steps) {
                    extractedData["Steps"] = workflow[key].inputs.steps
                } else if (workflow[key]?.inputs?.cfg) {
                    extractedData["CFG Scale"] = workflow[key].inputs.cfg
                } else if (workflow[key]?.inputs?.seed) {
                    extractedData["Seed"] = workflow[key].inputs.seed
                }
            }

            return extractedData;
        }

        const parsingConfig = {
            Model: {
                type: ["CheckpointLoaderSimple", "CheckpointLoader|pysssss"],
                extract: (node) => node.widgets_values?.[0]?.content || node.widgets_values?.[0] || null,
            },
            "Positive Prompt": {
                type: ["CR Prompt Text", "CLIPTextEncode", "ImpactWildcardProcessor", "Textbox", "easy showAnything"],
                extract: (node) => {
                    if (node.title === "Positive Prompt") {
                        return node.widgets_values?.[0] || null;
                    } else if (node.type === "CLIPTextEncode" && node.inputs?.find(input => input.name === "text")) {
                        return node.widgets_values?.[0] || null;
                    } else if (node.type === "ImpactWildcardProcessor") {
                        return node.widgets_values?.[1] || null;
                    } else if (node.type === "Textbox") {
                        return node.widgets_values?.[0] || null;
                    } else if (node.type === "easy showAnything") {
                        return node.widgets_values?.[0]?.[0] || null;
                    }
                    return null;
                },
                getColor: (node) => node.color,
                getBgColor: (node) => node.bgcolor,
                getText: (node) => node.widgets_values?.[0]?.[0],
            },
            "Negative Prompt": {
                type: ["CR Prompt Text", "CLIPTextEncode", "Textbox", "easy showAnything"],
                extract: (node) => {
                    if (node.title === "Negative Prompt") {
                        return node.widgets_values?.[0] || null;
                    } else if (node.type === "CLIPTextEncode" && node.inputs?.find(input => input.name === "text")) {
                        return node.widgets_values?.[0] || null;
                    } else if (node.type === "Textbox") {
                        return node.widgets_values?.[0] || null;
                    } else if (node.type === "easy showAnything") {
                        return node.widgets_values?.[0]?.[0] || null;
                    }
                    return null;
                },
                getColor: (node) => node.color,
                getBgColor: (node) => node.bgcolor,
                getText: (node) => node.widgets_values?.[0]?.[0],
            },
            Sampler: {
                type: ["KSampler", "SamplerCustom", "FaceDetailerPipe", "Ultimate SD Upscale"],
                extract: (node) => {
                    if (node.type === "KSampler") {
                        return node.widgets_values?.[4] || null;
                    } else if (node.type === "SamplerCustom") {
                        return node.inputs?.find(input => input.name === "sampler")?.widget?.name || null;
                    } else if (node.type === "FaceDetailerPipe") {
                        return node.widgets_values?.[7] || null;
                    } else if (node.type === "Ultimate SD Upscale") {
                        return node.widgets_values?.[5] || null;
                    }
                    return null;
                },
            },
            Scheduler: {
                type: ["KSampler", "KarrasScheduler", "FaceDetailerPipe", "Ultimate SD Upscale"],
                extract: (node) => {
                    if (node.type === "KSampler") {
                        return node.widgets_values?.[5] || null;
                    } else if (node.type === "KarrasScheduler") {
                        return "karras";
                    } else if (node.type === "FaceDetailerPipe") {
                        return node.widgets_values?.[8] || null;
                    } else if (node.type === "Ultimate SD Upscale") {
                        return node.widgets_values?.[6] || null;
                    }
                    return null;
                },
            },
            Steps: {
                type: ["KSampler", "KarrasScheduler", "FaceDetailerPipe", "Ultimate SD Upscale"],
                extract: (node) => {
                    if (node.type === "KSampler") {
                        return node.widgets_values?.[2] || null;
                    } else if (node.type === "KarrasScheduler") {
                        return node.widgets_values?.[0] || null;
                    } else if (node.type === "FaceDetailerPipe") {
                        return node.widgets_values?.[5] || null;
                    } else if (node.type === "Ultimate SD Upscale") {
                        return node.widgets_values?.[2] || null;
                    }
                    return null;
                },
            },
            "CFG Scale": {
                type: ["KSampler", "SamplerCustom", "FaceDetailerPipe", "Ultimate SD Upscale"],
                extract: (node) => {
                    if (node.type === "KSampler") {
                        return node.widgets_values?.[3] || null;
                    } else if (node.type === "SamplerCustom") {
                        return node.inputs?.find(input => input.name === "cfg")?.value || null;
                    } else if (node.type === "FaceDetailerPipe") {
                        return node.widgets_values?.[6] || null;
                    } else if (node.type === "Ultimate SD Upscale") {
                        return node.widgets_values?.[4] || null;
                    }
                    return null;
                },
            },
            Seed: {
                type: ["KSampler", "Seed Generator", "SamplerCustom", "FaceDetailerPipe", "Ultimate SD Upscale", "ImpactWildcardProcessor"],
                extract: (node) => {
                    if (node.type === "KSampler") {
                        return node.widgets_values?.[0] || null;
                    } else if (node.type === "Seed Generator") {
                        return node.widgets_values?.[0] || null;
                    } else if (node.type === "SamplerCustom") {
                        return node.inputs?.find(input => input.name === "noise_seed")?.widget?.value || null;
                    } else if (node.type === "FaceDetailerPipe") {
                        return node.widgets_values?.[3] || null;
                    } else if (node.type === "Ultimate SD Upscale") {
                        return node.widgets_values?.[1] || null;
                    } else if (node.type === "ImpactWildcardProcessor") {
                        return node.widgets_values?.[3] || null;
                    }
                    return null;
                },
            },
            LoRAs: {
                type: ["LoraLoader", "Power Lora Loader (rgthree)"],
                extract: (node) => {
                    const loras = [];
                    if (node.type === "LoraLoader") {
                        if (node.widgets_values && node.widgets_values.length >= 3) {
                            loras.push({
                                name: node.widgets_values[0],
                                model_strength: node.widgets_values[1],
                                clip_strength: node.widgets_values[2],
                            });
                        } else {
                            console.warn("LoraLoader node has unexpected widgets_values structure:", node);
                        }
                    } else if (node.type === "Power Lora Loader (rgthree)") {
                        if (node.widgets_values) {
                            for (let i = 1; i <= 9; i++) {
                                if (node.widgets_values[i] && node.widgets_values[i].on) {
                                    loras.push({
                                        name: node.widgets_values[i].lora,
                                        strength: node.widgets_values[i].strength,
                                    });
                                }
                            }
                        } else {
                            console.warn("Power Lora Loader (rgthree) has unexpected widgets_values:", node);
                        }
                    }
                    return loras.length > 0 ? loras : null;
                },
            },
        };

        const extractedData = {};

        // First Pass: Explicit Titles (including LoRAs)
        if (Array.isArray(workflow)) {
            for (const key in parsingConfig) {
                extractedData[key] = []; // Initialize the array for each key
                const config = parsingConfig[key];
                const seenValues = new Set(); // Keep track of seen values *per key*

                for (const node of workflow) {
                    if (config.type.includes(node.type)) {
                        // IMPORTANT: Only check for explicit titles *if* the key is NOT a prompt key
                        if (key !== "Positive Prompt" && key !== "Negative Prompt") {
                            const extractedValue = config.extract(node);
                            if (extractedValue !== null && extractedValue !== undefined) {
                                if (key === "LoRAs" && Array.isArray(extractedValue)) {
                                    extractedValue.forEach(lora => {
                                        if (!seenValues.has(lora.name)) {
                                            extractedData[key].push(lora);
                                            seenValues.add(lora.name);
                                        }
                                    });
                                } else if (!seenValues.has(extractedValue)) {
                                    extractedData[key].push(extractedValue);
                                    seenValues.add(extractedValue);
                                }
                            }
                        } else if (node.title === key) { // Handle explicit prompt titles
                            const extractedValue = config.extract(node);
                            if (extractedValue !== null && extractedValue !== undefined) {
                                if (!seenValues.has(extractedValue)) {
                                    extractedData[key].push(extractedValue);
                                    seenValues.add(extractedValue);
                                }
                            }
                        }
                    }
                }

                // Handle empty/single element arrays
                if (extractedData[key].length === 0) {
                    extractedData[key] = null;
                } else if (extractedData[key].length === 1 && key !== "LoRAs") {
                    extractedData[key] = extractedData[key][0];
                }
            }
        }
        // Second Pass: Inference for easy showAnything and CLIPTextEncode (if prompts not found)
        const promptInference = {
            "Positive Prompt": {
                colorPrefixes: ["#232", "#2"],
                bgColorPrefixes: ["#353", "#3"],
                keywords: ["positive", "prompt", "masterpiece", "best quality", "detailed"],
            },
            "Negative Prompt": {
                colorPrefixes: ["#322", "#533", "#3", "#5"],
                bgColorPrefixes: ["#533", "#653", "#5", "#6"],
                keywords: ["negative", "prompt", "unrealistic", "bad", "worst quality", "low quality", "unwanted"],
            },
        };

        if (Array.isArray(workflow)) {
            for (const promptType in promptInference) {
                if (extractedData[promptType] === null) {
                    extractedData[promptType] = []; // Initialize for inference
                    const seenValues = new Set();    // Track seen values during inference

                    for (const node of workflow) {
                        const config = parsingConfig[promptType];
                        // Only consider nodes suitable for inference
                        if (config.type.includes(node.type) && !["CR Prompt Text"].includes(node.type)) {
                            let extractedValue = null;
                            const color = config.getColor(node);
                            const bgColor = config.getBgColor(node);
                            const text = config.getText(node)?.toLowerCase() || "";

                            const colorMatch = promptInference[promptType].colorPrefixes.some(prefix => color?.startsWith(prefix));
                            const bgColorMatch = promptInference[promptType].bgColorPrefixes.some(prefix => bgColor?.startsWith(prefix));
                            const keywordMatch = promptInference[promptType].keywords.some(keyword => text.includes(keyword));

                            if (colorMatch || bgColorMatch || keywordMatch) {
                                extractedValue = config.extract(node);
                            }

                            if (extractedValue !== null && extractedValue !== undefined) {
                                if (!seenValues.has(extractedValue)) {
                                    extractedData[promptType].push(extractedValue);
                                    seenValues.add(extractedValue);
                                }
                            }
                        }
                    }

                    if (extractedData[promptType].length === 0) {
                        extractedData[promptType] = null;
                    } else if (extractedData[promptType].length === 1) {
                        extractedData[promptType] = extractedData[promptType][0];
                    }
                }
            }
        }

        return extractedData;
    }

    //---------- Drag and Drop Functionality ----------
    /**
     * Sets up drag-and-drop event listeners for image cards.
     * @param {HTMLElement} card - The image card element.
     */
    setupCardDragEvents(card) {
        card.addEventListener('dragstart', this.handleDragStart.bind(this));
        card.addEventListener('dragover', this.handleDragOver.bind(this));  // Add dragover to card
        card.addEventListener('dragend', this.handleDragEnd.bind(this)); 
        card.addEventListener('drop', this.handleDrop.bind(this)); // Add drop to card
    }

    /**
     * Sets up drag-and-drop event listeners for folder buttons.
     */
    setupFolderDragAndDrop() {
        const folders = this.galleryPopup.querySelectorAll('.folder-button');
        folders.forEach(folder => {
            folder.addEventListener('dragover', this.handleDragOver.bind(this));
            folder.addEventListener('drop', this.handleDrop.bind(this));
        });
    }

    /**
     * Handles the dragstart event.
     * @param {DragEvent} event - The drag event.
     */
    handleDragStart(event) { console.log("handleDragStart")
        let closeOnHoverButton = document.getElementById("close-on-hover-button");
        if (closeOnHoverButton) {
            closeOnHoverButton.style.display = "block";
        }

        const imageUrl = event.target.parentElement.parentNode.getAttribute('data-image-url');
        const imageName = event.target.parentElement.parentNode.getAttribute('data-image-name');
        const imageFolder = event.target.parentElement.parentNode.getAttribute('data-image-folder');
        event.dataTransfer.setData('text/plain', JSON.stringify({ imageUrl, imageName, imageFolder }));
        event.target.classList.add('dragging');
    }

    /**
     * Handles the dragover event.
     * @param {DragEvent} event - The drag event.
     */
    handleDragOver(event) { console.log("handleDragOver")
        event.preventDefault(); // Necessary to allow drop
        event.stopPropagation(); // ADD THIS LINE - Prevent ComfyUI workflow import
        if (event.target.classList.contains('folder-button')) {
            event.target.classList.add('drag-over'); // Add class for visual feedback
        }
    }

    /**
     * Handles the dragend event.
     * @param {DragEvent} event - The drag event.
     */
    handleDragEnd(event) { console.log("handleDragEnd")
        let closeOnHoverButton = document.getElementById("close-on-hover-button");
        if (closeOnHoverButton) {
            closeOnHoverButton.style.display = "none";
        }
        if (event.target.classList.contains("dragging")) {
            event.target.classList.remove('dragging');
        }
        let folderButtons = document.querySelectorAll(".folder-button");
        for (let i = 0; i < folderButtons.length; i++) {
            folderButtons[i].classList.remove('drag-over')
        }
    }

    async handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();

        // 1. ONLY proceed if dropped on a folder button:
        if (!event.target.classList.contains('folder-button')) {
            return; // Exit early if not a folder button
        }

        const targetFolder = event.target.getAttribute('data-folder-name');
        event.target.classList.remove('drag-over');

        const data = JSON.parse(event.dataTransfer.getData('text/plain'));
        const sourceImageUrl = data.imageUrl;
        const sourceImageName = data.imageName;
        const sourceImageFolder = data.imageFolder;


        // 2. Prevent moving to the same folder
        if (sourceImageFolder === targetFolder) {
            const draggedElement = this.galleryPopup.querySelector('.dragging');
            if (draggedElement) {
                draggedElement.classList.remove('dragging');
            }
            return;
        }
        // 3. construct *relative* paths for the API call.  Much simpler!
        const sourcePath = sourceImageFolder ? `${sourceImageFolder}/${sourceImageName}` : sourceImageName;
        const targetPath = targetFolder ? `${targetFolder}/${sourceImageName}` : sourceImageName;


        try {
            const response = await fetch("/Gallery/move", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ source_path: sourcePath, target_path: targetPath }) // Corrected body
            });

            if (response.ok) {
                console.log(`Image moved from ${sourcePath} to ${targetPath}`);
                // Update local data and UI after successful move
                this.moveFile(sourceImageFolder, sourceImageName, targetFolder);
            } else {
                console.error("Failed to move image:", await response.text());
            }
        } catch (error) {
            console.error("Error moving image:", error);
        }
        const draggedElement = this.galleryPopup.querySelector('.dragging');
        if (draggedElement) {
            draggedElement.classList.remove('dragging');
        }
    }

    /**
     * Moves a file in the local data structure and updates the UI.
     * @param {string} sourceFolder - The original folder of the file.
     * @param {string} filename - The name of the file.
     * @param {string} targetFolder - The destination folder.
     */
    moveFile(sourceFolder, filename, targetFolder) {
        if (!this.folders[sourceFolder] || !this.folders[sourceFolder][filename]) {
            console.warn(`Move failed: ${sourceFolder}/${filename} not found.`);
            return;
        }

        const fileData = this.folders[sourceFolder][filename];
        // Update url
        if (targetFolder != "output") {
            fileData.url = `/static_gallery/${targetFolder}/${filename}`;
        }
        else {
            fileData.url = `/static_gallery/${filename}`;
        }


        // Remove from source folder
        delete this.folders[sourceFolder][filename];

        // Add to target folder, creating it if necessary
        if (!this.folders[targetFolder]) {
            this.folders[targetFolder] = {};
        }
        this.folders[targetFolder][filename] = fileData;

        // Remove source folder if now empty
        if (Object.keys(this.folders[sourceFolder]).length === 0) {
            delete this.folders[sourceFolder];
        }
        // Update UI
        this.populateFolderNavigation(this.folderNavigation); // Refresh folder list
        if (this.currentFolder === sourceFolder || this.currentFolder === targetFolder) {
            this.loadFolderImages(this.currentFolder); // Reload current folder
        }
    }


    //---------- Delete Functionality ----------

    /**
     * Shows a confirmation modal before deleting an image.
     * @param {string} imageUrl - The URL of the image to delete.
     */
    confirmAndDelete(imageUrl) {
        // Create modal elements
        const modal = document.createElement('div');
        modal.classList.add('delete-modal');

        const modalContent = document.createElement('div');
        modalContent.classList.add('delete-modal-content');

        const message = document.createElement('p');
        message.textContent = 'Are you sure you want to delete this image?';
        modalContent.appendChild(message);

        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('delete-button-container');

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.classList.add('cancel-delete-button');
        cancelButton.onclick = () => {
            modal.remove(); // Remove modal on cancel
        };
        buttonContainer.appendChild(cancelButton);

        const confirmButton = document.createElement('button');
        confirmButton.textContent = 'Delete';
        confirmButton.classList.add('confirm-delete-button');
        confirmButton.onclick = () => {
            this.deleteImage(imageUrl); // Call delete function on confirm
            modal.remove();
        };
        buttonContainer.appendChild(confirmButton);
        modalContent.appendChild(buttonContainer);
        modal.appendChild(modalContent);
        document.body.appendChild(modal); // Add modal to the DOM
    }

    /**
     * Deletes an image via API call and updates the UI.
     * @param {string} imageUrl - The URL of the image to delete.
     */
    async deleteImage(imageUrl) {
        // Extract folder and filename BEFORE making the API call
        const urlParts = imageUrl.split('/');
        const filename = urlParts.pop();
        const folderName = urlParts.slice(2).join('/'); // Everything after /static_gallery/

        // Store the original folder data for potential rollback
        const originalFolders = JSON.parse(JSON.stringify(this.folders));

        // Optimistically update the UI *before* the API call
        this.removeFile(folderName, filename);
        this.closeInfoWindow();

        try {
            const response = await fetch("/Gallery/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image_path: imageUrl })
            });

            if (response.ok) {
                console.log(`Image deleted: ${imageUrl}`);
                // Server confirmed deletion, so no need to do anything else.
            } else {
                console.error("Failed to delete image:", await response.text());
                // Rollback: Restore the original folder data
                this.folders = originalFolders;
                this.populateFolderNavigation(this.folderNavigation);
                if (this.currentFolder) {
                    this.loadFolderImages(this.currentFolder);
                }

                alert("Failed to delete image.  Please try again."); // User-friendly error
            }
        } catch (error) {
            console.error("Error deleting image:", error);
            // Rollback: Restore the original folder data
            this.folders = originalFolders;
            this.populateFolderNavigation(this.folderNavigation);
            if (this.currentFolder) {
                this.loadFolderImages(this.currentFolder);
            }

            alert("Error deleting image.  Please try again."); // User-friendly error
        }
    }
}
