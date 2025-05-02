import getColorOptions from './getColorOptions.js';

async function createColor() {
    const colorOptions = await getColorOptions();
    const colorId = `color${colorOptions.length}`;
    const colorOption = {
        color: '#ffde70',
        id: colorId,
        name: '',
        textColor: '#000000',
    };

    colorOptions.push(colorOption);
    chrome.contextMenus.create({
        title: colorId,
        id: colorId,
        parentId: 'highlight-colors',
        type: 'radio',
    });

    chrome.storage.sync.set({ colors: colorOptions });
    return colorOption;
}

export default createColor;
