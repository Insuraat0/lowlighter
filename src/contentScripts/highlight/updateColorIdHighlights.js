async function updateColorIdHighlights(color) {
    document.querySelectorAll(`.highlighter--highlighted[data-color-id='${color.id.slice(-1)}']`).forEach((highlight) => {
        highlight.style.backgroundColor = color.color;
        highlight.style.color = color.textColor;
    });
}

export default updateColorIdHighlights;
