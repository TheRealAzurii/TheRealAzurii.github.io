const contentKey = 'notepad-content';
const textarea = document.getElementById('notepad-content');

window.addEventListener('load', () => {
    const savedContent = localStorage.getItem(contentKey);
    if (savedContent) {
        textarea.value = savedContent;
    }
});

textarea.addEventListener('input', () => {
    localStorage.setItem(contentKey, textarea.value);
});