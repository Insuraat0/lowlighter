import getColorOptions from './getColorOptions.js';

async function editColor(colorId, name, color, textColor) {
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
}

export default editColor;
