import getColorOptions from './getColorOptions.js';

async function changeColor(colorId) {
    if (!colorId) return;
    const colorOptions = await getColorOptions();
    const colorOption = colorOptions.find((option) => option.id === colorId);
    if (!colorOption) return;

    chrome.storage.sync.set({ color: colorId });

    // Also update the context menu
    chrome.contextMenus.update(colorId, { checked: true });
}

export default changeColor;
