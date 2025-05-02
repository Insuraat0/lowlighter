import getColorOptions from './getColorOptions.js';

async function createColor(name, color, textColor) {
    const colorOptions = await getColorOptions();
    const colorId = `color${colorOptions.length}`;
    const colorOption = {
        color: color,
        id: colorId,
        name: name,
        textColor: textColor,
    };

    colorOptions.push(colorOption);
    chrome.contextMenus.create({
        title: name || colorId,
        id: colorId,
        parentId: 'highlight-colors',
        type: 'radio',
    });

    chrome.storage.sync.set({ colors: colorOptions });
    return colorOption;
}

export default createColor;
