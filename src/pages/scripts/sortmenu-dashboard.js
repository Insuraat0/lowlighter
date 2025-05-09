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

function initFolderList(folder, folderName, folderPath, parentElement) {
    const subfolders = folder.subfolders;
    const folderElement = document.createElementNS(XHTML, 'div');
    const folderContent = document.createElementNS(XHTML, 'div');

    parentElement.appendChild(folderElement);

    folderElement.classList.add('folder');
    folderElement.appendChild(folderContent);

    folderContent.classList.add('content');
    folderContent.innerText = folderName;
    folderContent.addEventListener('click', () => {
        chrome.storage.local.set({ selectedFolderPath: folderPath });
        location.reload();
    });

    for (const subfolderName in subfolders) {
        const subfolderPath = `${folderPath}.${subfolderName}`;
        initFolderList(subfolders[subfolderName], subfolderName, subfolderPath, folderElement);
    }
}

function parseSubfolders(rootFolder, subfolderPath, update, excludeRoot) {
    var selectedFolder = rootFolder;
    subfolderPath.split('.').forEach((subfolder) => {
        if (subfolder == 'root') return;

        const selectedSubfolders = selectedFolder.subfolders;
        if (update && !selectedSubfolders[subfolder]) {
            selectedSubfolders[subfolder] = { subfolders: {}, contents: {}, updated: Date.now() }
        }

        selectedFolder = selectedSubfolders[subfolder];
    });

    if (excludeRoot && !selectedFolder.contents) selectedFolder = selectedFolder.subfolders.default;
    if (update) chrome.storage.local.set({ rootFolder });
    return selectedFolder
}
