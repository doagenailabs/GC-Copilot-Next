const safeDOM = {
  createText: (text) => document.createTextNode(text),
  setText: (element, text) => {
    element.textContent = text;
    return element;
  },
  sanitizeHTML: (html) => {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstChild;
  }
};
