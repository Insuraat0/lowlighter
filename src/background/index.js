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
        chrome.contextMenus.create({ title: 'Yellow', id: 'yellow', parentId: 'highlight-colors', type: 'radio' });
        chrome.contextMenus.create({ title: 'Blue', id: 'blue', parentId: 'highlight-colors', type: 'radio' });
        chrome.contextMenus.create({ title: 'Green', id: 'green', parentId: 'highlight-colors', type: 'radio' });
        chrome.contextMenus.create({ title: 'Pink', id: 'pink', parentId: 'highlight-colors', type: 'radio' });
        chrome.contextMenus.create({ title: "Dark", id: "dark", parentId: "highlight-colors", type: "radio" });

        // Get the initial selected color value
        const { title: colorTitle } = await getCurrentColor();
        chrome.contextMenus.update(colorTitle, { checked: true });
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
            case 'change-color-to-yellow':
                changeColor('yellow');
                break;
            case 'change-color-to-cyan':
                changeColor('blue');
                break;
            case 'change-color-to-lime':
                changeColor('green');
                break;
            case 'change-color-to-magenta':
                changeColor('pink');
                break;
            case 'change-color-to-dark':
                changeColor('dark');
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
                editColor(request.colorTitle, request.color, request.textColor);
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
