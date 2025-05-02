import { update as updateStorage } from '../utils/storageManager.js';

async function updateColor(highlightId, color = null) {
    color = color || await cycleColor(highlightId);
    document.querySelectorAll(`.highlighter--highlighted[data-highlight-id='${highlightId}']`).forEach((highlight) => {
        highlight.style.backgroundColor = color.color;
        highlight.style.color = color.textColor;
    });

    updateStorage(highlightId, window.location.hostname + window.location.pathname, window.location.pathname, color.id); // update the value in the local storage
}

// Find the current highlight color and return the next color in the list
function cycleColor(highlightId) {
    const highlightEl = document.querySelector(`.highlighter--highlighted[data-highlight-id='${highlightId}']`);
    const currentColor = highlightEl.style.backgroundColor;

    return new Promise((resolve, _reject) => {
        chrome.runtime.sendMessage({ action: 'get-color-options' }, ({ response: colorOptions }) => {
            // Find index by color rgb value (returns -1 if nothing found):
            const currentIndex = colorOptions.findIndex((color) => color.color === currentColor);
            const newColorOption = colorOptions[(currentIndex + 1) % colorOptions.length];
            resolve(newColorOption);
        });
    });
}

export default updateColor;
