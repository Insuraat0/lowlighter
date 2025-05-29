function createMinilist(divider, selectedFolder, key, altKey = null) {
    const minilistElement = document.createElementNS(XHTML, 'div');
    minilistElement.classList.add('minilist');

    const headerElement = document.createElementNS(XHTML, 'div');
    minilistElement.appendChild(headerElement);
    headerElement.classList.add('header');

    const headerTopRowElement = document.createElementNS(XHTML, 'div');
    headerElement.appendChild(headerTopRowElement);
    headerTopRowElement.classList.add('header-top-row');

    const titleElement = document.createElementNS(XHTML, 'span');
    headerTopRowElement.appendChild(titleElement);
    titleElement.classList.add('title');

    const countElement = document.createElementNS(XHTML, 'span');
    countElement.classList.add('count');

    if (divider == 'page' || divider == 'page-date') {
        const urlElement = document.createElementNS(XHTML, 'span');
        headerTopRowElement.appendChild(urlElement);
        urlElement.classList.add('url');
        urlElement.innerText = key;
    }

    if (divider == 'page') {
        const pageName = selectedFolder.contents[key].metadata.pageName || 'No title';
        titleElement.innerText = pageName;
    } else if (divider == 'page-date') {
        const pageName = selectedFolder.contents[key].metadata.pageName || 'No title';
        titleElement.innerText = altKey + ': ' + pageName;
    } else if (divider == 'site-date') {
        titleElement.innerText = altKey + ': ' + key;
    } else {
        titleElement.innerText = key;
    }

    if (divider == 'date') {
        headerTopRowElement.appendChild(countElement);
    } else {
        const headerBottomRowElement = document.createElementNS(XHTML, 'div');
        headerElement.appendChild(headerBottomRowElement);
        headerBottomRowElement.classList.add('header-bottom-row');

        const dateElement = document.createElementNS(XHTML, 'span');
        headerBottomRowElement.appendChild(dateElement);
        dateElement.classList.add('date');

        headerBottomRowElement.appendChild(countElement);
    }

    return minilistElement;
}

function divideIntoMinilistsVariables(divider) {
    const formatDate = (timestamp) => new Date(Number(timestamp)).toLocaleDateString();
    switch (divider) {
        case 'page':
            return {
                getKey: (data) => data.site + data.page,
                getMinilistArguments: (folder, key) => createMinilist(divider, folder, key),
                getSortDisplays: () => [['inherit', 'inherit', 'inherit', 'inherit', 'inherit'], ['inherit', 'inherit', 'inherit']],
            }
        case 'date':
            return {
                getKey: (data) => formatDate(data.created),
                getMinilistArguments: (folder, key) => createMinilist(divider, folder, key),
                getSortDisplays: () => [['none', 'inherit', 'none', 'none', 'inherit'], ['inherit', 'none', 'inherit']],
            }
        case 'page-date':
            return {
                getKey: (data) => data.site + data.page + '#;' + formatDate(data.created),
                getMinilistArguments: (folder, key) => createMinilist(divider, folder, ...key.split('#;')),
                getSortDisplays: () => [['inherit', 'inherit', 'inherit', 'inherit', 'inherit'], ['inherit', 'inherit', 'inherit']],
            }
        case 'site':
            return {
                getKey: (data) => data.site,
                getMinilistArguments: (folder, key) => createMinilist(divider, folder, key),
                getSortDisplays: () => [['none', 'inherit', 'inherit', 'inherit', 'inherit'], ['inherit', 'none', 'inherit']],
            }
        case 'site-date':
            return {
                getKey: (data) => data.site + '#;' + formatDate(data.created),
                getMinilistArguments: (folder, key) => createMinilist(divider, folder, ...key.split('#;')),
                getSortDisplays: () => [['none', 'inherit', 'inherit', 'inherit', 'inherit'], ['inherit', 'none', 'inherit']],
            }
        case 'none':
            return {
                getKey: () => 'All highlights',
                getMinilistArguments: (folder, key) => createMinilist(divider, folder, key),
                getSortDisplays: () => [null, ['inherit', 'none', 'inherit']],
            }
        default:
            throw new Error(divider + 'is not a valid minilist separator');
    }
}

function divideIntoMinilists(entryList, divider, selectedFolder, clear = false) {
    const {
        getKey,
        getMinilistArguments,
        getSortDisplays,
    } = divideIntoMinilistsVariables(divider);

    const newMinilists = {};
    entryList.forEach((entry) => {
        if (!entry) return;

        const entryData = entry.dataset;
        const key = getKey(entryData);

        if (!newMinilists[key]) newMinilists[key] = {
            minilist: getMinilistArguments(selectedFolder, key),
            highlightCounter: 0,
            colorCounter: new Set,
            lastUpdated: 0,
            created: 1e20,
        };

        const entryParent = newMinilists[key];
        entryParent.minilist.appendChild(entry);
        entryParent.highlightCounter++;
        entryParent.colorCounter.add(entryData.color);
        entryParent.lastUpdated = Math.max(entryParent.lastUpdated, Number(entryData.created));

        if (divider != 'date') {
            entryParent.created = Math.min(entryParent.created, Number(entryData.created));
        }
    });

    if (clear) document.querySelectorAll('.minilist').forEach((minilist) => minilist.remove());

    const allNewMinilistData = Object.values(newMinilists);
    allNewMinilistData.forEach((minilistData) => {
        const minilistElement = minilistData.minilist;
        mainElement.appendChild(minilistElement);
        minilistElement.dataset.updated = minilistData.lastUpdated;
        minilistElement.dataset.highlights = minilistData.highlightCounter;
        minilistElement.querySelector('.count').innerText = `${minilistData.highlightCounter} highlights, ${minilistData.colorCounter.size} colors`;

        if (divider == 'page' || divider == 'site' || divider == 'none') {
            minilistElement.dataset.created = minilistData.created;
            minilistElement.querySelector('.date').innerText = (new Date(minilistData.lastUpdated)).toLocaleString();
        } else if (divider == 'page-date' || divider == 'site-date') {
            minilistElement.dataset.created = minilistData.created;
            minilistElement.querySelector('.date').innerText = (new Date(minilistData.lastUpdated)).toLocaleTimeString();
        }

    });

    const [minilistSortDisplays, entrySortDisplays] = getSortDisplays();
    ['create', 'page', 'abc'].forEach((id, i) => {
        const display = entrySortDisplays[i];
        document.getElementById('en-sort-' + id).style.display = display;
        document.getElementById('en-sort-' + id + 1).style.display = display;
    });

    if (divider == 'page' || divider == 'page-date') {
        document.getElementById('en-sort-page').selected = true;
        basicEntryAttributeSort('pageOrder', false);
    } else {
        document.getElementById('en-sort-create1').selected = true;
        basicEntryAttributeSort('created', true);
    }

    const minilistsCount = allNewMinilistData.length;
    if (minilistsCount == 0) return;
    if (minilistsCount == 1) { sortMinilistsSelector.style.display = 'none'; return }

    sortMinilistsSelector.style.display = 'initial';
    ['url', 'update', 'create', 'title', 'count'].forEach((id, i) => {
        const display = minilistSortDisplays[i];
        document.getElementById('ml-sort-' + id).style.display = display;
        document.getElementById('ml-sort-' + id + 1).style.display = display;
    });

    const titleOptionA = document.getElementById('ml-sort-title');
    const titleOptionD = document.getElementById('ml-sort-title1');
    if (divider == 'page' || divider == 'page-date') {
        titleOptionA.innerText = 'Title (A to Z)';
        titleOptionD.innerText = 'Title (Z to A)';
    } else if (divider == 'site' || divider == 'site-date') {
        titleOptionA.innerText = 'URL (A to Z)';
        titleOptionD.innerText = 'URL (Z to A)';
    }

    if (divider == 'date') {
        document.getElementById('ml-sort-update1').selected = true;
        basicMinilistAttributeSort('updated', true);
    } else {
        document.getElementById('ml-sort-create1').selected = true;
        basicMinilistAttributeSort('created', true);

    }
}
