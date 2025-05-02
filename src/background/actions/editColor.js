import { executeInCurrentTab } from '../utils.js';

import getColorOptions from './getColorOptions.js';

async function editColor(colorId, name, color, textColor) {
    function updateHighlightsInPage(colorOption) {
        window.highlighterAPI.highlight.updateColorIdHighlights(colorOption);
    }

    const colorOptions = await getColorOptions();
    const colorOption = colorOptions.find((option) => option.id === colorId);
    colorOption.name = name;
    colorOption.color = color;
    colorOption.textColor = textColor;

    if (!textColor) {
        delete colorOption.textColor;
    }

    chrome.contextMenus.update(colorId, { title: name || colorId });
    chrome.storage.sync.set({ colors: colorOptions });
    executeInCurrentTab({ func: updateHighlightsInPage, args: [colorOption] });
}

export default editColor;
