let showHighlighterCursor = false;

function highlightOnSelection() {
    if (!showHighlighterCursor) return;

    const selection = window.getSelection();
    const selectionString = selection.toString();

    if (selectionString) { // If there is text selected
        chrome.runtime.sendMessage({ action: 'highlight' });
    }
}

function initializeHighlighterCursor() {
    document.addEventListener('mouseup', highlightOnSelection);
}

function toggleHighlighterCursor() {
    showHighlighterCursor = !showHighlighterCursor;

    if (showHighlighterCursor) {
        document.body.style.cursor = `url(${chrome.runtime.getURL('src/assets/images/cursor.svg')}) 2 8, text`

        // Highlight right away if some text is already selected:
        highlightOnSelection();
    } else {
        document.body.style.cursor = 'unset';
    }
}

export { initializeHighlighterCursor, toggleHighlighterCursor };
