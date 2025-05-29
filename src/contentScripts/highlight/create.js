import highlight from './highlight/index.js';

import { store, updatePageOrder } from '../utils/storageManager.js';

async function create(color, selection = window.getSelection()) {
    const selectionString = selection.toString();
    if (!selectionString) return;

    let container = selection.getRangeAt(0).commonAncestorContainer;

    // Sometimes the element will only be text. Get the parent in that case
    // TODO: Is this really necessary?
    while (!container.innerHTML) {
        container = container.parentNode;
    }

    const url = location.hostname + location.pathname
    const metadata = getMetadata();

    const highlightIndex = await store(selection, container, url, location.href, color.id, metadata);
    highlight(selectionString, container, selection, color.id, color.color, color.textColor, highlightIndex);
    updatePageOrder(url);
}

function getMetadata() {
    const metadata = {};

    const jsonldElement = document.querySelector('script[type="application/ld+json"]');
    if (jsonldElement) {
        var jsonldContent = JSON.parse(jsonldElement.innerText);
        if (!jsonldContent['@context']) jsonldContent = jsonldContent[0];

        metadata.author = [jsonldContent.author.name]
            || jsonldContent.author.map(author => author.name);
        metadata.pageName = jsonldContent.name
            || jsonldContent.headline;
        metadata.siteName = jsonldContent?.publisher.name
            || jsonldContent.isPartOf.name;
        metadata.issued = jsonldContent?.dateModified
            || jsonldContent.datePublished;
    } else {
        metadata.author = [document.querySelector('meta[name="author"')?.content];
        metadata.pageName = document.querySelector('meta[property="og:title"]')?.content
            || document.querySelector('meta[name="twitter:title"]')?.content
            || document.title;
        metadata.siteName = document.querySelector('meta[property="og:site_name"]')?.content
            || document.querySelector('meta[name="apple-mobile-web-app-title"]')?.content
            || document.querySelector('meta[name="al:ios:app_name"]')?.content
            || location.hostname;
    }

    return metadata;
}

export default create;
