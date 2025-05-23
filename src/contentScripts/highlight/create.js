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
  const highlightIndex = await store(selection, container, url, location.href, document.title, color.id);
  highlight(selectionString, container, selection, color.id, color.color, color.textColor, highlightIndex);
  updatePageOrder(url);
}

export default create;
