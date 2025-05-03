import { HIGHLIGHT_CLASS, DELETED_CLASS } from './highlight/index.js';

import { removeHighlightEventListeners } from '../hoverTools/index.js';
import { update as updateStorage } from '../utils/storageManager.js';

function remove(highlightId) {
    document.querySelector('.highlighter--hovered').classList.remove('highlighter--hovered');
    document.querySelectorAll(`.highlighter--highlighted[data-highlight-id='${highlightId}']`).forEach((highlight) => {
        highlight.style.backgroundColor = 'inherit';
        highlight.style.color = 'inherit';
        highlight.classList.remove(HIGHLIGHT_CLASS);
        highlight.classList.add(DELETED_CLASS);
        removeHighlightEventListeners(highlight);
    });

    updateStorage(highlightId, window.location.hostname + window.location.pathname, 'none'); // update the value in the local storage
}

export default remove;
