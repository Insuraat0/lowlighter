const separateMinilistsSelector = document.getElementById('separate-minilists-by');
const sortMinilistsSelector = document.getElementById('sort-minilists-by');
const sortEntriesSelector = document.getElementById('sort-entries-by');
const searchBar = document.getElementById('searchbar-input');
const searchButton = document.getElementById('search-button');

function basicSearch(text, searchHeader = false) {
    document.querySelectorAll('.minilist').forEach((minilist) => {
        var showMinilist = false;
        var ignoreChecks = false;

        if (searchHeader && minilist.firstElementChild.textContent.includes(text)) ignoreChecks = true;
        minilist.querySelectorAll('.entry').forEach((entry) => {
            if (ignoreChecks || entry.textContent.includes(text) || entry.querySelector('textarea').textContent.includes(text)) {
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
    document.querySelectorAll('.minilist').forEach((minilist) => {
        const minilistEntries = Array.from(minilist.children).splice(1);
        minilistEntries.sort((entry, next) => {
            if (descending) [entry, next] = [next, entry];
            if (attribute == 'textContent') return entry.textContent.localeCompare(next.textContent);
            return Number(entry.dataset[attribute]) - (Number(next.dataset[attribute]));
        });

        minilistEntries.forEach((minilistChild) => minilist.appendChild(minilistChild));
    });
}

function basicMinilistAttributeSort(attribute, descending = false) {
    const minilists = Array.from(mainElement.children).splice(1);
    minilists.sort((minilist, next) => {
        if (descending) [minilist, next] = [next, minilist];
        if (attribute == 'title' || attribute == 'url') {
            console.log(attribute)
            return minilist.querySelector(`.${attribute}`).textContent.localeCompare(next.querySelector(`.${attribute}`).textContent);
        }

        return Number(minilist.dataset[attribute]) - Number(next.dataset[attribute]);
    });

    minilists.forEach((minilist) => mainElement.appendChild(minilist));
}

function initSorts() {
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
}

initSorts();


/* Perofmance test should not be included in release 
function performanceTest() {
    for (var i = 0; i < 300; i++) {
        basicEntryAttributeSort('pageOrder', true);
        basicEntryAttributeSort('pageOrder', false);
        basicEntryAttributeSort('textContent', true);
        basicEntryAttributeSort('textContent', false);
        basicEntryAttributeSort('createOrder', true);
        basicEntryAttributeSort('createOrder', false);
    }
}

document.getElementById('search-button').addEventListener('click', performanceTest); 
/**/
