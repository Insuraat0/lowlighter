import {
    changeColor,
    editColor,
    getColorOptions,
    getCurrentColor,
    getHighlights,
    getLostHighlights,
    highlightText,
    loadPageHighlights,
    removeHighlight,
    removeHighlights,
    showHighlight,
    toggleHighlighterCursor,
} from './actions/index.js';
import { wrapResponse } from './utils.js';


function initialize() {
    initializeContextMenus();
    initializeContextMenuEventListeners();
    initializeTabEventListeners();
    initializeKeyboardShortcutEventListeners();
    initializeMessageEventListeners();
}


function initializeContextMenus() {
    // Add option when right-clicking
    chrome.runtime.onInstalled.addListener(async () => {
        // remove existing menu items
        chrome.contextMenus.removeAll();

        chrome.contextMenus.create({ title: 'Highlight', id: 'highlight', contexts: ['selection'] });
        chrome.contextMenus.create({ title: 'Toggle Cursor', id: 'toggle-cursor' });
        chrome.contextMenus.create({ title: 'Highlighter color', id: 'highlight-colors' });

		const colorOptions = await getColorOptions();
		colorOptions.forEach((colorOption) => {
        	chrome.contextMenus.create({ title: colorOption.name, id: colorOption.id, parentId: 'highlight-colors', type: 'radio' });
		});

        // Get the initial selected color value
        const { id: colorId } = await getCurrentColor();
        chrome.contextMenus.update(colorId, { checked: true });
    });
}

function initializeContextMenuEventListeners() {
    chrome.contextMenus.onClicked.addListener(({ menuItemId, parentMenuItemId }) => {
        if (parentMenuItemId === 'highlight-colors') {
            changeColor(menuItemId);
            return;
        }

        switch (menuItemId) {
            case 'highlight':
                highlightText();
                break;
            case 'toggle-cursor':
                toggleHighlighterCursor();
                break;
        }
    });
}


function initializeTabEventListeners() {
    // If the URL changes, try again to highlight
    // This is done to support javascript Single-page applications
    // which often change the URL without reloading the page
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, _tab) => {
        if (changeInfo.url) {
            loadPageHighlights(tabId);
        }
    });
}

function initializeKeyboardShortcutEventListeners() {
    // Add Keyboard shortcuts
    chrome.commands.onCommand.addListener((command) => {
        switch (command) {
            case 'execute-highlight':
                highlightText();
                break;
            case 'toggle-highlighter-cursor':
                toggleHighlighterCursor();
                break;
            case 'change-color-to-color0':
                changeColor('color0');
                break;
            case 'change-color-to-color1':
                changeColor('color1');
                break;
            case 'change-color-to-color2':
                changeColor('color2');
                break;
            case 'change-color-to-color3':
                changeColor('color3');
                break;
            case 'change-color-to-color4':
                changeColor('color4');
                break;
            case 'change-color-to-color5':
                changeColor('color5');
                break;
            case 'change-color-to-color6':
                changeColor('color6');
                break;
            case 'change-color-to-color7':
                changeColor('color7');
                break;
            case 'change-color-to-color8':
                changeColor('color8');
                break;
            case 'change-color-to-color9':
                changeColor('color9');
                break;
        }
    });
}

function initializeMessageEventListeners() {
    // Listen to messages from content scripts
    /* eslint-disable consistent-return */
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
        if (!request.action) return;

        switch (request.action) {
            case 'highlight':
                highlightText();
                return;
            case 'remove-highlights':
                removeHighlights();
                return;
            case 'remove-highlight':
                removeHighlight(request.highlightId);
                return;
            case 'change-color':
                changeColor(request.color);
                return;
            case 'edit-color':
                editColor(request.colorId, request.color, request.textColor);
                return;
            case 'toggle-highlighter-cursor':
                toggleHighlighterCursor();
                return;
            case 'get-highlights':
                wrapResponse(getHighlights(), sendResponse);
                return true; // return asynchronously
            case 'get-lost-highlights':
                wrapResponse(getLostHighlights(), sendResponse);
                return true; // return asynchronously
            case 'show-highlight':
                return showHighlight(request.highlightId);
            case 'get-current-color':
                wrapResponse(getCurrentColor(), sendResponse);
                return true; // return asynchronously
            case 'get-color-options':
                wrapResponse(getColorOptions(), sendResponse);
                return true; // return asynchronously
        }
    });
    /* eslint-enable consistent-return */
}

export { initialize };
