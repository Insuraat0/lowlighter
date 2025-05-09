const XHTML = 'http://www.w3.org/1999/xhtml';

const mainElement = document.getElementById('main');
const folderList = document.getElementById('folderlist');

function formatDate(dateString) {
    const dateObject = new Date(dateString);
    const dateFormatted = dateObject.toLocaleString('en-GB', {
        year: '2-digit',
        month: 'long',
        day: '2-digit',
        hour: 'numeric',
        hourCycle: 'h11',
        minute: '2-digit'
    }).replace(' at ', ', ').replace('pm', 'PM').replace('am', 'AM');

    return dateFormatted;
}

function initMinilists(folderContent, colorOptions, highlights) {
    for (const pageName in folderContent) {
        const pageObject = folderContent[pageName];
        const pageHighlights = highlights[pageName];

        if (!pageHighlights?.length) continue;

        const minilistElement = document.createElementNS(XHTML, 'div');
        const headerElement = document.createElementNS(XHTML, 'div');
        const headerTopRowElement = document.createElementNS(XHTML, 'div');
        const titleElement = document.createElementNS(XHTML, 'span');
        const urlElement = document.createElementNS(XHTML, 'span');
        const headerBottomRowElement = document.createElementNS(XHTML, 'div');
        const dateElement = document.createElementNS(XHTML, 'span');
        const countElement = document.createElementNS(XHTML, 'span');

        minilistElement.classList.add('minilist');
        minilistElement.dataset.updated = pageObject.updated;
        minilistElement.dataset.created = pageObject.created || pageObject.updated; // TODO: Remove or statment, all will have this
        minilistElement.appendChild(headerElement);

        headerElement.classList.add('header');
        headerElement.appendChild(headerTopRowElement);
        headerElement.appendChild(headerBottomRowElement);

        headerTopRowElement.classList.add('header-top-row');
        headerTopRowElement.appendChild(titleElement);
        headerTopRowElement.appendChild(urlElement);

        titleElement.classList.add('title');
        titleElement.innerText = pageObject.name;

        urlElement.classList.add('url');
        urlElement.innerText = `(${pageName})`;

        headerBottomRowElement.classList.add('header-bottom-row');
        headerBottomRowElement.appendChild(dateElement);
        headerBottomRowElement.appendChild(countElement);

        dateElement.classList.add('date');
        dateElement.innerText = formatDate(pageObject.updated);

        var highlightCounter = 0;
        var colorCounter = new Set;
        countElement.classList.add('count');

        pageObject.list.forEach((highlightIndex) => {
            const highlight = pageHighlights[highlightIndex];
            const colorId = highlight.id;
            const highlightColor = colorOptions.find(color => color.id == colorId)

            if (!highlightColor) { return }
            highlightCounter++;
            colorCounter.add(colorId);

            const entryElement = document.createElementNS(XHTML, 'div');
            const noteElement = document.createElementNS(XHTML, 'div');
            const noteContentElement = document.createElementNS(XHTML, 'textarea');

            minilistElement.appendChild(entryElement);

            const siteArray = pageName.split('/');
            entryElement.classList.add('entry');
            entryElement.dataset.pageOrder = highlight.order;
            entryElement.dataset.created = highlight.createdAt;
            entryElement.dataset.site = siteArray[0];
            entryElement.dataset.page = '/' + siteArray.splice(1).join('/');
            entryElement.dataset.color = colorId.slice(-1);
            entryElement.style.borderColor = highlightColor.color;
            entryElement.innerText = highlight.string.trim();
            entryElement.appendChild(noteElement);
            entryElement.addEventListener('click', (event) => {
                if (event.target != entryElement) { return }
                entryElement.classList.toggle('expanded');
            });

            noteElement.classList.add('note');
            noteElement.appendChild(noteContentElement);

            noteContentElement.rows = 3;
            noteContentElement.value = highlight.note || '';
            noteContentElement.addEventListener('change', async () => {
                highlight.note = noteContentElement.value.trim();
                chrome.storage.local.set({ highlights });
                //  TODO: if the color is changed in another tab, the change is undone 
            });
        })

        minilistElement.dataset.highlights = highlightCounter;
        countElement.innerText = `(${highlightCounter} highlights, ${colorCounter.size} colors)`;

        mainElement.appendChild(minilistElement);
    }
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

async function init() {
    const { highlights } = await chrome.storage.local.get('highlights');
    const { colors } = await chrome.storage.sync.get('colors');
    const { rootFolder } = await chrome.storage.local.get('rootFolder');
    const { selectedFolderPath } = await chrome.storage.local.get({ selectedFolderPath: 'root.default' });

    if (!highlights || !colors || !rootFolder) {
        const simpleMessage = document.createElementNS(XHTML, 'span');
        simpleMessage.innerText = 'Nothing to show!';

        mainElement.appendChild(simpleMessage);
        return;
    }

    const selectedFolder = parseSubfolders(rootFolder, selectedFolderPath, true, false);
    initFolderList(rootFolder, 'root', 'root', folderList);
    initMinilists(selectedFolder.contents, colors, highlights);
}

init();
