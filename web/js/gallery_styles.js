/**
 * Exports the CSS styles for the gallery as a string.
 * @returns {string} CSS styles for the gallery.
 */
export const galleryStyles = `
    /* Basic Reset */
    * { box-sizing: border-box; }

    .gallery-popup {
        display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(0, 0, 0, 0.7); z-index: 1000; justify-content: center;
        align-items: center; font-family: sans-serif;
    }
    .popup-content {
        background-color: #444; color: #ddd;
        border: 1px solid #666;
        width: 80vw;
        height: 80vh;
        max-height: 80vh;
        display: flex; flex-direction: column; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
        border-radius: 8px;
        overflow: auto;
        padding: 20px;
    }
    .popup-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid #666;
    }
    .close-button {
        background-color: #c0392b; color: white; border: none; padding: 8px 12px;
        font-size: 14px; cursor: pointer; border-radius: 4px; transition: background-color 0.3s ease;
    }
    .close-button:hover { background-color: #992d22; }

    .sort-buttons { display: flex; gap: 8px; margin-left: auto;}

    .sort-button {
        background-color: #555; color: #eee; border: 1px solid #777; padding: 6px 10px;
        font-size: 13px; cursor: pointer; border-radius: 4px; transition: background-color 0.3s ease;
    }
    .sort-button:hover { background-color: #777; }
    .active-sort { background-color: #3498db; color: white; }

    .search-container {
        width: 60%;
        display: flex;
        flex-wrap: wrap;
        align-content: center;
        justify-content: center;
        align-items: center;
    }

    .search-input {
        padding: 6px 10px;
        border-radius: 4px;
        border: 1px solid #777;
        background-color: #555;
        color: #eee;
        font-size: 13px;
        width: 75%;
        margin-right: 5px;
    }

    .search-input:focus {
        outline: none;
        border-color: #3498db;
    }

    .clear-search-button {
        background-color: #555;
        color: #eee;
        border: 1px solid #777;
        padding: 6px 10px;
        font-size: 13px;
        cursor: pointer;
        border-radius: 4px;
        transition: background-color 0.3s ease;
        margin-right: 5px;
    }
    .clear-search-button:hover{
        background-color: #777;
    }

    .popup-main-content {
        display: flex; flex-direction: row;
        height: 68vh;
    }
    .folder-navigation {
        width: 200px; padding-right: 20px; border-right: 1px solid #666; overflow-y: auto;
    }
    .folder-button {
        display: block; width: 100%; padding: 8px; margin-bottom: 6px; border: none;
        background-color: #555; color: #eee; text-align: left; cursor: pointer;
        border-radius: 4px; transition: background-color 0.3s ease; white-space: nowrap;
        overflow: hidden; text-overflow: ellipsis;
    }
    .folder-button:hover, .folder-button.active { background-color: #777; }
    .active-folder { background-color: #3498db; color: white; }

    .image-display {
        flex: 1; padding-left: 20px;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 20px;
        overflow-y: auto;
        justify-content: center;
        justify-items: center;
        align-items: center;
    }

    .empty-gallery-message {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        font-style: italic;
        color: #aaa;
    }

    .image-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        border: none;
        padding: 0px;
        border-radius: 10px;
        text-align: center;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transition: transform 0.2s ease;
        background-color: transparent;
        width: 250px;
        height: 300px;
        overflow: hidden;
    }

    .image-card:hover { transform: scale: 1.03; }

    .image-container-inner {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 0px;
   }

    .gallery-image {
        width: 100%;
        height: 100%;
        display: block;
        border-radius: 10px;
        cursor: pointer;
        object-fit: cover;
        z-index: 0;
    }

    .card-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        background-color: rgba(0, 0, 0, 0.6);
        color: #fff;
        padding: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom-left-radius: 10px;
        border-bottom-right-radius: 10px;
    }

    .image-name {
        font-size: 1em;
        color: #eee;
        margin: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 100%;
    }

    /* Fullscreen Container Styles (for both image and info) */
    .fullscreen-container {
        display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(0, 0, 0, 0.9); z-index: 2000;
        justify-content: center; align-items: center;
        flex-direction: column; /* Stack close button, content */
    }

    /* Common close button style for both full image and info */
    .fullscreen-close, .info-close, .raw-metadata-close {
        position: absolute; top: 20px; right: 30px; color: #fff; font-size: 30px;
        font-weight: bold; cursor: pointer; z-index: 2001; /* Ensure above content */
    }

    /* Fullscreen Image Styles */
    .fullscreen-image { max-width: 90%; max-height: 70%; display: block; margin-top: 60px;} /* Adjusted margin */


    /* Info Window Styles */
    .info-window {
        background-color: #333; color: #eee; border-radius: 8px; padding: 20px;
        max-width: 80%; max-height: 80%; overflow-y: auto; position: relative;
        margin-top: 60px; /* Adjusted margin to accommodate close button */
    }

    .info-content {
        display: flex; flex-direction: row; align-items: flex-start; gap: 20px;
    }

    .info-preview-image {
        max-width: 400px; max-height: 400px; border-radius: 8px; display: block;
        object-fit: contain;
    }

    .metadata-table {
        flex: 1; display: flex; flex-direction: column; gap: 8px;
    }

    .metadata-row {
        display: flex; flex-direction: row; align-items: baseline;
    }

    .metadata-label {
        font-weight: bold; margin-right: 10px; flex-basis: 120px; text-align: right;
    }

    .metadata-value {
        flex: 1; word-break: break-word;
    }

    .raw-metadata-button {
        background-color: #555; color: #eee; border: 1px solid #777; padding: 8px 12px;
        font-size: 14px; cursor: pointer; border-radius: 4px; transition: background-color 0.3s ease;
        align-self: flex-start; /* Align to the start of the info-content flex container */
        margin-top: 15px; /* Add some space above the button */
    }
    .raw-metadata-button:hover { background-color: #777; }


    /* Raw Metadata Window Styles */
    .raw-metadata-window {
        display: none; position: fixed; top: 50%; left: 50%;
        background-color: #222; color: #eee; border-radius: 8px; padding: 20px;
        width: 70vw; height: 80vh; overflow: auto; z-index: 2002;
        transform: translate(-50%, -50%); box-shadow: 0 8px 16px rgba(0, 0, 0, 0.6);
        flex-direction: column; /* Ensure close button stacks properly */
    }

    .raw-metadata-content {
        width: 100%; height: 100%;
    }

    .raw-metadata-content textarea {
        width: 100%; height: 100%; background-color: #444; color: #eee;
        border: none; padding: 10px; font-family: monospace; font-size: 14px;
        box-sizing: border-box; /* Important for width/height to include padding */
    }
    .raw-metadata-close {
        top: 10px; /* Adjust position for raw metadata close button */
    }


    .date-separator {
        grid-column: 1 / -1;
        text-align: center;
        padding: 10px;
        font-size: 1.2em;
        color: #eee;
        border-top: 1px solid #666;
        border-bottom: 1px solid #666;
        margin-top: 10px;
        margin-bottom: 10px;
        width: 95%;
    }

     @media (max-width: 768px) {
        .popup-content { width: 95%; margin: 5% auto; }
        .popup-main-content { flex-direction: column; }
        .folder-navigation {
            width: 100%; border-right: none; border-bottom: 1px solid #ddd;
                    margin-bottom: 15px;
            max-height: 120px;
            overflow-x: auto;
            overflow-y: auto;
            white-space: nowrap;
        }
        .folder-button{ display: inline-block; width: auto; }
        .image-display { padding-left: 0; }
        .search-container {
            width: 100%;
            margin-bottom: 10px;
        }
        .search-input {
            width: calc(100% - 40px);
            margin-right: 5px;
        }

        .popup-header {
            flex-wrap: wrap;
        }
         .clear-search-button{
            margin-right: 0px;
        }
        /* Adjustments for info window on smaller screens if needed */
        .info-content { flex-direction: column; align-items: center; }
        .info-preview-image { max-width: 90%; max-height: 300px; } /* Smaller preview image */
        .metadata-table { width: 90%; } /* Adjust table width */
        .metadata-label { text-align: left; flex-basis: auto; margin-right: 5px; } /* Left-align labels */

    }

    .gallery-button {
        background-color: #3498db; color: white; border: none;
        padding: 5px 10px; font-size: 14px; cursor: pointer;
        border-radius: 4px; transition: background-color 0.3s ease;
    }
    .gallery-button:hover { background-color: #2980b9; }

    .info-button {
        background-color: #3498db; color: white; border: none;
        padding: 5px 10px; font-size: 12px; cursor: pointer;
        border-radius: 4px; transition: background-color 0.3s ease;
    }
    .info-button:hover { background-color: #2980b9; }

    /* Settings Popup Styles */
    .gallery-settings-popup {
        display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(0, 0, 0, 0.7); z-index: 1001; /* Higher z-index than gallery popup */
        justify-content: center; align-items: center; font-family: sans-serif;
    }

    .settings-popup-content {
        background-color: #444; color: #ddd; border-radius: 8px; padding: 20px;
        width: 60vw; max-height: 80vh; overflow-y: auto; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
    }

    .settings-popup-header {
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #666;
    }

    .settings-close-button {
        background-color: #c0392b; color: white; border: none; padding: 8px 12px;
        font-size: 14px; cursor: pointer; border-radius: 4px; transition: background-color 0.3s ease;
    }
    .settings-close-button:hover { background-color: #992d22; }


    .settings-popup-body {
        display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px;
    }

    .setting-item {
        display: flex; flex-direction: column; gap: 5px;
    }

    .setting-item label {
        font-weight: bold; font-size: 14px;
    }

    .setting-item input[type="text"] {
        background-color: #555; color: #eee; border: 1px solid #777; border-radius: 4px;
        padding: 8px; font-size: 14px;
    }
    .setting-item input[type="checkbox"] {
        /* Add checkbox specific styles if needed */
    }


    .save-settings-button {
        background-color: #3498db; color: white; border: none; padding: 10px 15px;
        font-size: 16px; cursor: pointer; border-radius: 4px; transition: background-color 0.3s ease;
        align-self: flex-start; /* Align left in the popup content */
    }
    .save-settings-button:hover { background-color: #2980b9; }


    /* Floating Button Styles */
    .floating-button-container {
        position: fixed; /* Fixed position for floating effect */
        top: 20px; /* Initial position from top */
        left: 20px; /* Initial position from left */
        z-index: 1000; /* Ensure it's above other content */
    }

    .floating-button-handle {
        background-color: rgba(0, 0, 0, 0.2); /* Semi-transparent handle */
        color: transparent; /* No text, just handle area */
        cursor: grab;
        width: 100%; /* Full width of the button */
        height: 5px; /* Height of the handle */
        margin-bottom: -5px; /* overlap button to make it seamless */
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;
        cursor: grab; /* visual cue for draggable area */
    }
    .floating-button-handle:active {
        cursor: grabbing;
    }   

    /* Styles for Settings Button in Header */
    .settings-button-header {
        background-color: #555; color: #eee; border: 1px solid #777; padding: 6px 10px;
        font-size: 13px; cursor: pointer; border-radius: 4px; transition: background-color 0.3s ease;
        margin-left: 8px; /* Add some spacing between buttons */
    }
    .settings-button-header:hover { background-color: #777; } 

    /* Floating Button Styles (FINAL: Refined handle and container styles) */
    .floating-button-container {
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 1000;
        display: flex;
        flex-direction: row;
        align-items: stretch;
        border-radius: 4px;
        overflow: hidden;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    }

    .floating-button-handle {
        background-color: #555;
        color: #eee;
        cursor: move;
        width: 20px; /* INCREASED: Handle width to 20px */
        height: auto;
        flex-grow: 0;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 0; /* REMOVED: padding */
        z-index: 1001; /* INCREASED: z-index to 1001 */


        border-top-left-radius: 4px;
        border-bottom-left-radius: 4px;
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
    }
    .floating-button-handle:active {
        cursor: move;
    }

    /* Three Dot "Drag Icon" for Handle (REFINED: Removed font-size and letter-spacing) */
    .floating-button-handle::before {
        content: '⋮';
        /* font-size: 1.2em;      REMOVED: font-size */
        /* letter-spacing: -2px; REMOVED: letter-spacing */
        color: #eee;
        opacity: 0.8;
    }


    .gallery-button {
        border-top-left-radius: 4px;
        border-bottom-left-radius: 4px;
        border-top-right-radius: 4px;
        border-bottom-right-radius: 4px;
    }

    /* Video/GIF Card Styles */
    .gallery-media {
        width: 100%;
        height: 100%;
        display: block;
        border-radius: 10px;
        cursor: pointer;
        object-fit: cover; /* or contain, depending on desired behavior */
        background-color: black; /* Fallback background color for video thumbnails */
    }

    .play-icon {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 2em;
        color: white;
        opacity: 0.8;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.6); /* Shadow for better visibility */
        pointer-events: none; /* Make icon non-interactive */
    }

    .fullscreen-video {
        max-width: 90%;
        max-height: 90%;
        display: block;
    }

    /* No Metadata Message Style */
    .no-metadata-message {
        font-style: italic;
        color: #aaa;
        padding: 10px;
        text-align: center;
    }
`;
