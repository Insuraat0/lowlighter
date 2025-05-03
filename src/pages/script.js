const XHTML = 'http://www.w3.org/1999/xhtml';

const highlightButton = document.getElementById('highlight-button');
const cursorButton = document.getElementById('cursor-button');
const deleteAllButton = document.getElementById('delete-button');
const copyAllButton = document.getElementById('copy-button');
const shortcutsButton = document.getElementById('shortcuts-button');
const colorNameInput = document.getElementById('name-input');
const highlightColorInput = document.getElementById('highlight-color-input');
const textColorInput = document.getElementById('text-color-input');
const colorsList = document.getElementById('colors-list');
const colorDisplayTemplate = document.getElementById('color-display-template');

var colorOptions;

async function getFromMessage(action) {
    const response = await chrome.runtime.sendMessage({ action: action });
    return response.response;
}

async function closeAfterMessage(action) {
    await chrome.runtime.sendMessage({ action: action });
    window.close();
}

async function initActionButtons() {
    const allKeybinds = await chrome.commands.getAll();

    const highlightKeybind = allKeybinds.find(keybind => keybind.name == 'a-execute-highlight');
    highlightButton.querySelector('.keylabel').innerText = highlightKeybind?.shortcut || 'No keybind';
    highlightButton.addEventListener('click', () => closeAfterMessage('highlight'));

    const cursorKeybind = allKeybinds.find(keybind => keybind.name == 'b-toggle-highlighter-cursor');
    cursorButton.querySelector('.keylabel').innerText = cursorKeybind?.shortcut || 'No keybind';
    cursorButton.addEventListener('click', () => closeAfterMessage('toggle-highlighter-cursor'));

    const deleteAllKeybind = allKeybinds.find(keybind => keybind.name == 'delete-all');
    deleteAllButton.querySelector('.keylabel').innerText = deleteAllKeybind?.shortcut || 'No keybind';
    deleteAllButton.addEventListener('click', () => closeAfterMessage('remove-highlights'));

    const copyAllKeybind = allKeybinds.find(keybind => keybind.name == 'copy-all');
    copyAllButton.querySelector('.keylabel').innerText = copyAllKeybind?.shortcut || 'No keybind';

    shortcutsButton.addEventListener('click', () => {
        chrome.tabs.create({ url: 'chrome://extensions/shortcuts/' });
    });
}

async function updateSelectedColorProperties() {
    const selectedColor = await getFromMessage('get-current-color');
    const selectedColorId = selectedColor.id;
    const newColorName = colorNameInput.value;
    const newColor = highlightColorInput.value;
    const newTextColor = textColorInput.value;

    const selectedColorListElement = document.getElementById(selectedColorId);
    selectedColorListElement.querySelector('.bg').style.fill = newColor;
    selectedColorListElement.querySelector('.tx').style.fill = newTextColor;
    selectedColorListElement.removeEventListener('click', () => changeColor(selectedColor));

    const selectedColorOption = colorOptions.find(option => option.id == selectedColorId);
    selectedColorOption.color = newColor;
    selectedColorOption.textColor = newTextColor;
    selectedColorOption.name = newColorName;

    chrome.runtime.sendMessage({
        action: 'edit-color',
        colorId: selectedColorId,
        color: newColor,
        textColor: newTextColor,
        name: newColorName,
    });
}

function initSelectedColorElement() {
    colorNameInput.addEventListener('change', updateSelectedColorProperties);
    highlightColorInput.addEventListener('change', updateSelectedColorProperties);
    textColorInput.addEventListener('change', updateSelectedColorProperties);
}

async function setSelectedColorElement(colorId) {
    const colorOption = colorOptions.find(option => option.id == colorId);

    colorNameInput.placeholder = colorId;
    colorNameInput.value = colorOption.name;
    highlightColorInput.value = colorOption.color;
    textColorInput.value = colorOption.textColor;
}

function changeColor(colorId) {
    setSelectedColorElement(colorId);
    chrome.runtime.sendMessage({
        action: 'change-color',
        color: colorId,
    });
}

async function addColor(svgText) {
    const { response: colorOption } = await chrome.runtime.sendMessage({
        action: 'create-color',
        name: '',
        color: '#ffde70',
        textColor: '#000000',
    });

    const colorOptionElement = document.createElementNS(XHTML, 'div');
    const allColorElements = colorsList.children;
    const colorAddElement = allColorElements[allColorElements.length - 1]

    colorOptionElement.id = colorOption.id;
    colorOptionElement.classList.add('color');
    colorOptionElement.innerHTML = svgText;
    colorOptionElement.querySelector('.bg').style.fill = colorOption.color;
    colorOptionElement.querySelector('.tx').style.fill = colorOption.textColor;
    colorOptionElement.addEventListener('click', () => changeColor(colorOption));
    changeColor(colorOption);

    colorsList.insertBefore(colorOptionElement, colorAddElement);
    if (allColorElements.length > 10) { colorAddElement.remove() };

}

async function initColorsList() {
    colorOptions = await getFromMessage('get-color-options');
    const selectedColor = await getFromMessage('get-current-color');
    const svgFetchResponse = await fetch('../assets/images/display_color.svg');
    const svgText = await svgFetchResponse.text();
    setSelectedColorElement(selectedColor.id);

    colorOptions.forEach(async (colorOption) => {
        const colorOptionElement = document.createElementNS(XHTML, 'div');
        colorOptionElement.id = colorOption.id;
        colorOptionElement.classList.add('color');
        colorOptionElement.innerHTML = svgText;
        colorOptionElement.querySelector('.bg').style.fill = colorOption.color;
        colorOptionElement.querySelector('.tx').style.fill = colorOption.textColor;

        colorOptionElement.addEventListener('click', () => changeColor(colorOption.id));
        colorsList.appendChild(colorOptionElement);
    });

    if (colorOptions.length < 10) {
        const colorAddElement = document.createElementNS(XHTML, 'div');
        const addColorSvgFetchResponse = await fetch('../assets/images/add_color.svg');
        const addColorSvgText = await addColorSvgFetchResponse.text();

        colorAddElement.classList.add('color');
        colorAddElement.innerHTML = addColorSvgText;

        colorAddElement.addEventListener('click', () => addColor(svgText));
        colorsList.appendChild(colorAddElement);
    }
}

initActionButtons();
initSelectedColorElement();
initColorsList();

