async function updateNote(event) {
    // TODO: This would ideally only get the page from storage
    const { highlights } = await chrome.storage.local.get('highlights');
    const noteElement = event.target;
    const entryData = noteElement.parentElement.parentElement.dataset;

    highlights[entryData.site + entryData.page][entryData.index].note = noteElement.value.trim();
    chrome.storage.local.set({ highlights });
}

function createEntry(pageName, index, highlight, color) {
    const entryElement = document.createElementNS(XHTML, 'div');
    const siteArray = pageName.split('/');
    entryElement.classList.add('entry');
    entryElement.dataset.pageOrder = highlight.order;
    entryElement.dataset.created = highlight.createdAt;
    entryElement.dataset.index = index;
    entryElement.dataset.site = siteArray[0];
    entryElement.dataset.page = '/' + siteArray.splice(1).join('/');
    entryElement.dataset.color = color.id.slice(-1);
    entryElement.style.borderColor = color.color;
    entryElement.innerText = highlight.string.trim();
    entryElement.addEventListener('click', (event) => {
        if (event.target != entryElement) { return }
        entryElement.classList.toggle('expanded');
    });

    const noteElement = document.createElementNS(XHTML, 'div');
    entryElement.appendChild(noteElement);
    noteElement.classList.add('note');

    const noteContentElement = document.createElementNS(XHTML, 'textarea');
    noteElement.appendChild(noteContentElement);
    noteContentElement.rows = 3;
    noteContentElement.value = highlight.note || '';
    noteContentElement.addEventListener('change', updateNote);

    return entryElement;
}

function entryListFromFolder(folderContent, highlights, colors) {
    return Object.keys(folderContent).map(pageName => {
        const pageHighlights = highlights[pageName];
        if (!pageHighlights) return;

        return folderContent[pageName].list.map(index => {
            const highlight = pageHighlights[index];
            const highlightColor = colors.find(color => color.id == highlight.id);
            if (!highlightColor) return;

            return createEntry(pageName, index, highlight, highlightColor)
        });
    }).flat();
}
