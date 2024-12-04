function createCard(className = "", content = "") {
    const cardDiv = document.createElement('div');
    cardDiv.className = `rounded-lg border bg-card text-card-foreground shadow-sm ${className}`;
    cardDiv.innerHTML = content;
    return cardDiv;
}

function createCardContent(className = "", content = "") {
    const contentDiv = document.createElement('div');
    contentDiv.className = `p-6 pt-0 ${className}`;
    contentDiv.innerHTML = content;
    return contentDiv;
}

// Expose functions
window.uiCard = {
    createCard: createCard,
    createCardContent: createCardContent
};
