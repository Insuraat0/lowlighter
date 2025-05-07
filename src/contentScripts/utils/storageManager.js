import { addHighlightError } from './errorManager.js';

import { highlight } from '../highlight/index.js';

const STORE_FORMAT_VERSION = chrome.runtime.getManifest().version;

function parseSubfolders(rootFolder, subfolderPath, update, excludeRoot) {
    var selectedFolder = rootFolder;
    subfolderPath.split('.').forEach((subfolder) => {
        if (subfolder == 'root') return;

        const selectedSubfolders = selectedFolder.subfolders;
        const currentTime = Date.now();
        if (update && !selectedSubfolders[subfolder]) {
            selectedSubfolders[subfolder] = { subfolders: {}, contents: {}, updated: currentTime, created: currentTime }
        }

        selectedFolder = selectedSubfolders[subfolder];
    });

    if (excludeRoot && !selectedFolder.contents) selectedFolder = selectedFolder.subfolders.default;
    if (update) chrome.storage.local.set({ rootFolder });
    return selectedFolder
}

async function updatePageOrder(url) {
    const { highlights } = await chrome.storage.local.get({ highlights: {} });
    const pageHighlights = highlights[url];
    document.querySelectorAll('.highlighter--highlighted').forEach((highlight, indexInPage) => {
        const indexInStorage = highlight.dataset.highlightId;
        pageHighlights[indexInStorage].order = indexInPage;
    });

    chrome.storage.local.set({ highlights });
}

async function store(selection, container, url, href, pageTitle, id) {
    const { highlights } = await chrome.storage.local.get({ highlights: {} });
    const { rootFolder } = await chrome.storage.local.get({ rootFolder: { subfolders: { default: { subfolders: {}, contents: {} } } } });
    const { selectedFolderPath } = await chrome.storage.local.get({ selectedFolderPath: 'root.default' });
    const selectedFolder = parseSubfolders(rootFolder, selectedFolderPath, false, true);
    const folderContent = selectedFolder.contents;

    const currentTime = Date.now();
    if (!highlights[url]) highlights[url] = [];
    if (!folderContent[url]) folderContent[url] = { list: [], name: pageTitle, created: currentTime };

    const count = highlights[url].push({
        version: STORE_FORMAT_VERSION,
        string: selection.toString(),
        container: getQuery(container),
        anchorNode: getQuery(selection.anchorNode),
        anchorOffset: selection.anchorOffset,
        focusNode: getQuery(selection.focusNode),
        focusOffset: selection.focusOffset,
        id,
        href,
        uuid: crypto.randomUUID(),
        createdAt: currentTime,
    });

    const index = count - 1
    selectedFolder.updated = currentTime;
    folderContent[url].updated = currentTime;
    folderContent[url].list.push(index);

    chrome.storage.local.set({ highlights });
    chrome.storage.local.set({ rootFolder });

    return index;
}

async function update(highlightIndex, url, newColorId) {
    const { highlights } = await chrome.storage.local.get({ highlights: {} });
    const highlightsInKey = highlights[url];

    if (highlightsInKey) {
        const highlightObject = highlightsInKey[highlightIndex];
        if (highlightObject) {
            highlightObject.id = newColorId;
            highlightObject.updatedAt = Date.now();
            chrome.storage.local.set({ highlights });
        }
    }
}

async function loadAll(url) {
    const result = await chrome.storage.local.get({ highlights: {} });
    const highlights = result.highlights[url];

    if (!highlights) return;
    const { response: colorOptions } = await chrome.runtime.sendMessage({ action: 'get-color-options' });
    for (let i = 0; i < highlights.length; i++) {
        load(highlights[i], i, colorOptions);
    }
}

// noErrorTracking is optional
function load(highlightVal, highlightIndex, colorOptions, noErrorTracking) {
    const selection = {
        anchorNode: elementFromQuery(highlightVal.anchorNode),
        anchorOffset: highlightVal.anchorOffset,
        focusNode: elementFromQuery(highlightVal.focusNode),
        focusOffset: highlightVal.focusOffset,
    };

    const { id, string: selectionString, version } = highlightVal;
    const { color, textColor } = (id == 'none') ? { color: 'inherit', textColor: 'inherit' } : colorOptions.find(option => option.id == id);
    const container = elementFromQuery(highlightVal.container);

    if (!selection.anchorNode || !selection.focusNode || !container) {
        console.log(selection, container);
        if (!noErrorTracking) {
            addHighlightError(highlightVal, highlightIndex, colorOptions);
        }
        return false;
    }

    const success = highlight(selectionString, container, selection, id, color, textColor, highlightIndex, version);

    if (!noErrorTracking && !success) {
        addHighlightError(highlightVal, highlightIndex, colorOptions);
    }
    return success;
}

async function removeHighlight(highlightIndex, url) {
    const { highlights } = await chrome.storage.local.get({ highlights: {} });

    highlights[url].splice(highlightIndex, 1);
    chrome.storage.local.set({ highlights });
}

async function clearPage(url) {
    const { highlights } = await chrome.storage.local.get({ highlights: {} });

    delete highlights[url];
    chrome.storage.local.set({ highlights });
}

function elementFromQuery(storedQuery) {
    const re = />textNode:nth-of-type\(([0-9]+)\)$/ui;
    const result = re.exec(storedQuery);

    if (result) { // For text nodes, nth-of-type needs to be handled differently (not a valid CSS selector)
        const textNodeIndex = parseInt(result[1], 10);
        storedQuery = storedQuery.replace(re, "");
        const parent = robustQuerySelector(storedQuery);

        if (!parent) return undefined;

        return parent.childNodes[textNodeIndex];
    }

    return robustQuerySelector(storedQuery);
}

function robustQuerySelector(query) {
    try {
        return document.querySelector(query);
    } catch (error) {
        // It is possible that this query fails because of an invalid CSS selector that actually exists in the DOM.
        // This was happening for example here: https://lawphil.net/judjuris/juri2013/sep2013/gr_179987_2013.html
        // where there is a tag <p"> that is invalid in HTML5 but was still rendered by the browser
        // In this case, manually find the element:
        let element = document;
        for (const queryPart of query.split(">")) {
            if (!element) return null;

            const re = /^(.*):nth-of-type\(([0-9]+)\)$/ui;
            const result = re.exec(queryPart);
            const [, tagName, index] = result || [undefined, queryPart, 1];
            element = Array.from(element.childNodes).filter((child) => child.localName === tagName)[index - 1];
        }
        return element;
    }
}

// From an DOM element, get a query to that DOM element
function getQuery(element) {
    if (element.id) return `#${escapeCSSString(element.id)}`;
    if (element.localName === 'html') return 'html';

    const parent = element.parentNode;

    const parentSelector = getQuery(parent);
    // The element is a text node
    if (!element.localName) {
        // Find the index of the text node:
        const index = Array.prototype.indexOf.call(parent.childNodes, element);
        return `${parentSelector}>textNode:nth-of-type(${index})`;
    } else {
        const index = Array.from(parent.childNodes).filter((child) => child.localName === element.localName).indexOf(element) + 1;
        return `${parentSelector}>${element.localName}:nth-of-type(${index})`;
    }
}

// Colons and spaces are accepted in IDs in HTML but not in CSS syntax
// Similar (but much more simplified) to the CSS.escape() working draft
function escapeCSSString(cssString) {
    return cssString.replace(/(:)/ug, "\\$1");
}

export {
    store,
    update,
    updatePageOrder,
    loadAll,
    load,
    removeHighlight,
    clearPage,
};
