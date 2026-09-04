// Se inyecta en la página de CS Snippets (index.html) para sincronizar las notas
// guardadas en localStorage hacia chrome.storage.local, accesible desde el popup.
const STORAGE_KEY = 'tinyhtml-notes-v1';

function syncNotesToStorage() {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        const notes = raw ? JSON.parse(raw) : [];
        chrome.storage.local.set({ notes, syncedAt: Date.now() });
    } catch (error) {
        console.error('CS Snippets: error al sincronizar notas', error);
    }
}

// Sincronización inicial al cargar la página
syncNotesToStorage();

// El script.js de la página dispara este evento cada vez que las notas cambian
window.addEventListener('tinyhtml-notes-sync', syncNotesToStorage);
