const XHTML = 'http://www.w3.org/1999/xhtml';

const highlightButton = document.getElementById('highlight-button');
const cursorButton = document.getElementById('cursor-button');
const deleteAllButton = document.getElementById('delete-button');
const copyAllButton = document.getElementById('copy-button');
const shortcutsButton = document.getElementById('shortcuts-button');

const collapseButton = document.getElementById('collapse-button');
const dashboardButton = document.getElementById('dashboard-button');
const settingsButton = document.getElementById('settings-button');
const exitButton = document.getElementById('exit-button');

const colorNameInput = document.getElementById('name-input');
const highlightColorInput = document.getElementById('highlight-color-input');
const textColorInput = document.getElementById('text-color-input');

const colorsList = document.getElementById('colors-list');
const highlightListContainer = document.getElementById('highlight-list-container');
const highlightList = document.getElementById('highlight-list-scroll');

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
    [
        [highlightButton, 'a-execute-highlight'],
        [cursorButton, 'b-toggle-highlighter-cursor'],
        [deleteAllButton, 'delete-all'],
        [copyAllButton, 'copy-all']
    ].forEach(([element, keybindName]) => {
        const keybind = allKeybinds.find(keybind => keybind.name == keybindName);
        element.querySelector('.keylabel').innerText = keybind?.shortcut || 'No keybind';
    })

    highlightButton.addEventListener('click', () => closeAfterMessage('highlight'));
    cursorButton.addEventListener('click', () => closeAfterMessage('toggle-highlighter-cursor'));
    deleteAllButton.addEventListener('click', () => closeAfterMessage('remove-highlights'));
    copyAllButton.addEventListener('click', () => navigator.clipboard.writeText(highlightList.innerText));
    shortcutsButton.addEventListener('click', () => {
        chrome.tabs.create({ url: 'chrome://extensions/shortcuts/' });
    });
}

function initOptionIcons() {
    collapseButton.addEventListener('click', () => {
        const highlightListStyle = highlightListContainer.style;
        if (highlightListStyle.display == 'none') {
            highlightListStyle.display = 'block'
            collapseButton.style.transform = "rotate(0deg)";
        } else {
            highlightListStyle.display = 'none';
            collapseButton.style.transform = "rotate(180deg)";
        }
    });

    dashboardButton.addEventListener('click', () => {
        chrome.tabs.create({ url: 'src/pages/dashboard.xml' });
    });

    settingsButton.addEventListener('click', () => {
        chrome.tabs.create({ url: 'src/pages/settings.xml' });
    });

    exitButton.addEventListener('click', () => window.close());
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

    colorOptions.push(colorOption);

    colorOptionElement.id = colorOption.id;
    colorOptionElement.classList.add('color');
    colorOptionElement.innerHTML = svgText;
    colorOptionElement.querySelector('.bg').style.fill = colorOption.color;
    colorOptionElement.querySelector('.tx').style.fill = colorOption.textColor;
    colorOptionElement.addEventListener('click', () => changeColor(colorOption.id));
    changeColor(colorOption.id);

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

async function initHighlightList() {
    const highlights = await getFromMessage('get-highlights');
    if (!highlights || !highlights.length) {
        highlightListContainer.style.display = 'none';
        collapseButton.style.display = 'none';
        return;
    }
    highlights.forEach((highlight) => {
        const breakElement = document.createElementNS(XHTML, 'hr');
        const highlightElement = document.createElementNS(XHTML, 'div');
        highlightElement.innerText = highlight[1];

        highlightList.appendChild(breakElement);
        highlightList.appendChild(highlightElement);
    });

    const lastBreakElement = document.createElementNS(XHTML, 'hr');
    highlightList.appendChild(lastBreakElement);
}

initActionButtons();
initOptionIcons();
initSelectedColorElement();
initColorsList();
initHighlightList();

