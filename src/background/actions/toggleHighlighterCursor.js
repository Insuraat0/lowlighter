import { executeInCurrentTab } from '../utils.js';

function toggleHighlighterCursor() {
    function contentScriptToggleHighlighterCursor() {
        window.highlighterAPI.highlighterCursor.toggle();
    }

    executeInCurrentTab({ func: contentScriptToggleHighlighterCursor });
}

export default toggleHighlighterCursor;
