const XHTML = 'http://www.w3.org/1999/xhtml';

const mainElement = document.getElementById('main');

async function init() {
    const { highlights } = await chrome.storage.local.get('highlights');
    const { colors } = await chrome.storage.sync.get('colors');

    for (const pageName in highlights) {
        const minilistElement = document.createElementNS(XHTML, 'div');
        const headerElement = document.createElementNS(XHTML, 'div');
        const titleElement = document.createElementNS(XHTML, 'span');
        const urlElement = document.createElementNS(XHTML, 'span');

        titleElement.classList.add('title');
        titleElement.innerText = 'Page title';

        urlElement.classList.add('url');
        urlElement.innerText = `(${pageName})`;

        headerElement.classList.add('header');
        headerElement.appendChild(titleElement);
        headerElement.appendChild(urlElement);

        minilistElement.classList.add('minilist');
        minilistElement.appendChild(headerElement);

        highlights[pageName].forEach((highlight) => {
            const colorId = highlight.id;
            const highlightColor = colors.find(color => color.id == colorId)
            if (!highlightColor) { return }

            const entryElement = document.createElementNS(XHTML, 'div');
            const noteElement = document.createElementNS(XHTML, 'div');
            const noteContentElement = document.createElementNS(XHTML, 'textarea');

            noteContentElement.rows = 3;
            noteContentElement.value = highlight.note || '';
            noteContentElement.addEventListener('change', async () => {
                highlight.note = noteContentElement.value.trim();
                chrome.storage.local.set({ highlights });
                //  TODO: if the color is changed in another tab, the change is undone 
            });

            noteElement.classList.add('note');
            noteElement.appendChild(noteContentElement);

            const entryClasses = entryElement.classList;
            entryClasses.add('entry');
            entryElement.style.borderColor = highlightColor.color;
            entryElement.innerText = highlight.string.trim();
            entryElement.appendChild(noteElement);
            entryElement.addEventListener('click', (event) => {
                if (event.target != entryElement) { return }
                entryClasses.toggle('expanded');
            });

            minilistElement.appendChild(entryElement);
        })

        mainElement.appendChild(minilistElement);
    }
}

init();
