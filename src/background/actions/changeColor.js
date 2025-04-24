import getColorOptions from './getColorOptions.js';

async function changeColor(colorTitle) {
    if (!colorTitle) return;
    
	const colorOptions = await getColorOptions();
    const colorOption = colorOptions.find((option) => option.title === colorTitle);
	if (!colorOption) return;

    chrome.storage.sync.set({ color: colorTitle });

    // Also update the context menu
    chrome.contextMenus.update(colorTitle, { checked: true });
}

export default changeColor;
