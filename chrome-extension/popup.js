const listEl = document.getElementById('notesList');
const searchEl = document.getElementById('searchInput');
const filterEl = document.getElementById('categoryFilter');
const statusEl = document.getElementById('status');

let allNotes = [];
let selectedCategory = 'all';

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function stripHtml(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html || '';
    return (temp.textContent || temp.innerText || '').replace(/\s+/g, ' ').trim();
}

function showStatus(text) {
    statusEl.textContent = text;
    clearTimeout(showStatus.timeoutId);
    showStatus.timeoutId = setTimeout(() => { statusEl.textContent = ''; }, 2000);
}

function renderCategories() {
    const cats = new Set(allNotes.map(note => note.category || 'General'));
    // Al recargar (por notas nuevas) respeta la categoría ya elegida en pantalla; si no, usa la guardada
    const current = filterEl.options.length ? (filterEl.value || 'all') : selectedCategory;
    filterEl.innerHTML = '<option value="all">Todas las categorías</option>' +
        Array.from(cats).map(cat => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join('');
    filterEl.value = Array.from(filterEl.options).some(opt => opt.value === current) ? current : 'all';
    selectedCategory = filterEl.value;
}

function render() {
    const term = searchEl.value.trim().toLowerCase();
    const category = filterEl.value;

    const filtered = allNotes.filter(note => {
        const matchesCategory = category === 'all' || (note.category || 'General') === category;
        const matchesTerm = !term
            || (note.title || '').toLowerCase().includes(term)
            || stripHtml(note.content).toLowerCase().includes(term);
        return matchesCategory && matchesTerm;
    });

    if (!filtered.length) {
        listEl.innerHTML = '<div class="empty">No hay notas. Abre CS Snippets para sincronizar.</div>';
        return;
    }

    listEl.innerHTML = filtered.map(note => {
        const preview = stripHtml(note.content);
        return `
            <div class="note-item" style="--note-color: ${escapeHtml(note.color || '#fff4a3')}">
                <div class="note-item-header">
                    <span class="note-cat">${escapeHtml(note.category || 'General')}</span>
                    <div class="note-item-actions">
                        <button type="button" class="copy-btn" data-id="${escapeHtml(note.id)}">Copiar</button>
                        <button type="button" class="paste-btn" data-id="${escapeHtml(note.id)}" title="Pegar en el campo activo de la pestaña">Pegar</button>
                    </div>
                </div>
                <div class="note-item-title">${escapeHtml(note.title || 'Sin título')}</div>
                <div class="note-item-preview">${escapeHtml(preview.slice(0, 90))}${preview.length > 90 ? '...' : ''}</div>
            </div>
        `;
    }).join('');

    listEl.querySelectorAll('.copy-btn').forEach(button => {
        button.addEventListener('click', () => {
            const note = allNotes.find(item => item.id === button.dataset.id);
            if (!note) return;
            navigator.clipboard.writeText(note.content || '')
                .then(() => showStatus('Copiado'))
                .catch(() => showStatus('Error al copiar'));
        });
    });

    listEl.querySelectorAll('.paste-btn').forEach(button => {
        button.addEventListener('click', () => {
            const note = allNotes.find(item => item.id === button.dataset.id);
            if (!note) return;
            pasteIntoActiveField(note.content)
                .then(success => showStatus(success ? 'Pegado' : 'No hay campo activo'))
                .catch(() => showStatus('Error al pegar'));
        });
    });
}

function loadNotes() {
    chrome.storage.local.get(['notes', 'selectedCategory'], (result) => {
        allNotes = result.notes || [];
        selectedCategory = result.selectedCategory || 'all';
        renderCategories();
        render();
    });
}

// Inserta el contenido en el último campo editable enfocado, recordado por focus-tracker.js
// (usa mensajes en vez de document.activeElement porque el popup ya le robó el foco a la pestaña)
function pasteIntoActiveField(content) {
    return chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
        if (!tab?.id) return false;

        const messaging = new Promise((resolve) => {
            chrome.tabs.sendMessage(tab.id, { type: 'cs-snippets-paste', content: content || '' }, (response) => {
                if (chrome.runtime.lastError) {
                    resolve(false);
                    return;
                }
                resolve(response?.success === true);
            });
        });

        // Salvaguarda: si ningún frame respondió (ej. sitio sin content script), no colgar el botón
        const timeout = new Promise((resolve) => setTimeout(() => resolve(false), 800));

        return Promise.race([messaging, timeout]);
    });
}

searchEl.addEventListener('input', render);
filterEl.addEventListener('change', () => {
    selectedCategory = filterEl.value;
    chrome.storage.local.set({ selectedCategory });
    render();
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.notes) {
        allNotes = changes.notes.newValue || [];
        renderCategories();
        render();
    }
});

loadNotes();
