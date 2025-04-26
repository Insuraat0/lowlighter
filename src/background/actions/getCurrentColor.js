import getColorOptions from './getColorOptions.js';

import { DEFAULT_COLOR_ID } from '../constants.js';

async function getCurrentColor() {
    const { color } = await chrome.storage.sync.get("color");
    const colorId = color || DEFAULT_COLOR_ID;
    const colorOptions = await getColorOptions();
    return colorOptions.find((colorOption) => colorOption.id === colorId) || colorOptions[0];
}

export default getCurrentColor;
