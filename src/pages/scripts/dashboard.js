const XHTML = 'http://www.w3.org/1999/xhtml';

const mainElement = document.getElementById('main');
const sortMenu = document.getElementById('sortmenu');
const messageElement = document.getElementById('message');

const separateMinilistsSelector = document.getElementById('separate-minilists-by');
const sortMinilistsSelector = document.getElementById('sort-minilists-by');
const sortEntriesSelector = document.getElementById('sort-entries-by');
const searchBar = document.getElementById('searchbar-input');
const searchButton = document.getElementById('search-button');
const folderList = document.getElementById('folderlist');

async function initializeDashboard() {
    const { highlights } = await chrome.storage.local.get('highlights');
    const { colors } = await chrome.storage.sync.get('colors');
    const { rootFolder } = await chrome.storage.local.get('rootFolder');
    const { selectedFolderPath } = await chrome.storage.local.get({ selectedFolderPath: 'root.default' });
    const selectedFolder = parseSubfolders(rootFolder, selectedFolderPath, true, false);

    if (!highlights || !colors || !rootFolder) {
        messageElement.style.display = 'initial';
        messageElement.innerText = 'Nothing to show!';
        return;
    }

    try {
        initFolderList(rootFolder, 'root', 'root', folderList);

        const entriesList = entryListFromFolder(selectedFolder.contents, highlights, colors);
        divideIntoMinilists(entriesList, 'page', selectedFolder);

        sortEntriesSelector.addEventListener('change', () => {
            const variables = sortEntriesSelector.value.split(',');
            basicEntryAttributeSort(variables[0], Boolean(variables[1]));
        });

        sortMinilistsSelector.addEventListener('change', () => {
            const variables = sortMinilistsSelector.value.split(',');
            basicMinilistAttributeSort(variables[0], Boolean(variables[1]));
        });

        searchBar.addEventListener('change', () => basicSearch(searchBar.value, true));
        searchButton.addEventListener('click', () => basicSearch(searchBar.value, true));

        separateMinilistsSelector.addEventListener('change', () => {
            const entryList = Array.from(document.querySelectorAll('.entry'));
            divideIntoMinilists(entryList, separateMinilistsSelector.value, selectedFolder, true);
        });

        messageElement.style.display = 'none';
        sortMenu.style.display = 'flex';
    } catch (error) {
        messageElement.style.display = 'initial';
        messageElement.innerText = 'An error occurred, check the console.'
        console.error(error);
    }
}

window.addEventListener('load', initializeDashboard);
