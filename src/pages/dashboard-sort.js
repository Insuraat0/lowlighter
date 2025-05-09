const separateMinilistsSelector = document.getElementById('separate-minilists-by');
const sortMinilistsSelector = document.getElementById('sort-minilists-by');
const sortEntriesSelector = document.getElementById('sort-entries-by');
const searchBar = document.getElementById('searchbar-input');
const searchButton = document.getElementById('search-button');

function basicSearch(text, searchHeader = false) {
    document.querySelectorAll('.minilist').forEach((minilist) => {
        const ignoreChecks = (searchHeader && minilist.firstElementChild.textContent.includes(text));
        var showMinilist = false;

        minilist.querySelectorAll('.entry').forEach((entry) => {
            if (ignoreChecks || entry.textContent.includes(text) || entry.querySelector('textarea').value.includes(text)) {
                entry.style.display = 'block';
                showMinilist = true;
            } else {
                entry.style.display = 'none';
            }
        })

        if (showMinilist) {
            minilist.style.display = 'flex';
        } else {
            minilist.style.display = 'none';
        }
    });
}

function basicEntryAttributeSort(attribute, descending = false) {
    function sortFunction(entry, next) {
        if (descending) [entry, next] = [next, entry];
        if (attribute == 'textContent') return entry.textContent.localeCompare(next.textContent);
        return Number(entry.dataset[attribute]) - (Number(next.dataset[attribute]));
    }

    document.querySelectorAll('.minilist').forEach((minilist) => {
        const minilistEntries = Array.from(minilist.children).splice(1);
        minilistEntries.sort(sortFunction);
        minilistEntries.forEach((minilistChild) => minilist.appendChild(minilistChild));
    });
}

function basicMinilistAttributeSort(attribute, descending = false) {
    function sortFunction(minilist, next) {
        if (descending) [minilist, next] = [next, minilist];
        if (attribute == 'title' || attribute == 'url') {
            return minilist.querySelector(`.${attribute}`).textContent.localeCompare(next.querySelector(`.${attribute}`).textContent);
        }
        return Number(minilist.dataset[attribute]) - Number(next.dataset[attribute]);
    }

    const minilists = Array.from(mainElement.children).splice(1);
    minilists.sort(sortFunction);
    minilists.forEach((minilist) => mainElement.appendChild(minilist));
}

async function initSorts() {
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

    const { rootFolder } = await chrome.storage.local.get('rootFolder');
    const { selectedFolderPath } = await chrome.storage.local.get({ selectedFolderPath: 'root.default' });
    const selectedFolder = parseSubfolders(rootFolder, selectedFolderPath, true, false);

    separateMinilistsSelector.addEventListener('change', () => {
        const entryList = Array.from(document.querySelectorAll('.entry'));
        divideIntoMinilists(entryList, separateMinilistsSelector.value, selectedFolder, true);
    });
}

initSorts();


/* Perofmance test should not be included in release
function initPerformanceTest() {
    const start = performance.now();
    for (var i = 0; i < 300; i++) {
        basicEntryAttributeSort('pageOrder', true);
        basicEntryAttributeSort('pageOrder', false);
        basicEntryAttributeSort('textContent', true);
        basicEntryAttributeSort('textContent', false);
        basicEntryAttributeSort('createOrder', true);
        basicEntryAttributeSort('createOrder', false);
    }
    const end = performance.now();
    console.log(end - start);
}

/**

async function initPerformanceTest() {
    const { rootFolder } = await chrome.storage.local.get('rootFolder');
    const { selectedFolderPath } = await chrome.storage.local.get({ selectedFolderPath: 'root.default' });

    const selectedFolder = parseSubfolders(rootFolder, selectedFolderPath, true, false);
    const entryList = Array.from(document.querySelectorAll('.entry'));
    newPerformanceTest(selectedFolder, entryList);
}

function newPerformanceTest(selectedFolder, entryList) {
    const start = performance.now();
    for (var i = 0; i < 150; i++) {
        divideIntoMinilists(entryList, 'page', selectedFolder, true);
        divideIntoMinilists(entryList, 'date', selectedFolder, true);
        divideIntoMinilists(entryList, 'site', selectedFolder, true);
        divideIntoMinilists(entryList, 'page-date', selectedFolder, true);
        divideIntoMinilists(entryList, 'site-date', selectedFolder, true);
    }
    const end = performance.now();
    console.log(end - start);
}

document.getElementById('search-button').addEventListener('click', initPerformanceTest);

/**/
