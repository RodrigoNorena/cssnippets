const STORAGE_KEY = 'tinyhtml-notes-v1';
const CATEGORIES_KEY = 'tinyhtml-categories-v1';
const XML_PATH = './notes.xml';
const noteColors = ['#fff4a3', '#ffd7e6', '#d7f7d7', '#d6e8ff', '#eadbff'];
const DEFAULT_CATEGORIES = ['Dispatching', 'Update', 'Cloud Task'];

let notes = [];
let categories = [];
let currentFilter = 'all';
let currentSelectedNoteId = null;
let selectedColor = '#fff4a3';
let draggedNoteId = null;
let isEditingMode = false;
let previewTextLength = 150;
let noteLayout = 'grid';

const noteTitle = document.getElementById('noteTitle');
const noteCategory = document.getElementById('noteCategory');
const notesContainer = document.getElementById('notesContainer');
const filtersContainer = document.getElementById('filters');
const layoutToggleBtn = document.getElementById('layoutToggleBtn');
const notesPanel = document.getElementById('notesPanel');
const importXmlInput = document.getElementById('importXmlInput');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const newCategoryContainer = document.getElementById('newCategoryContainer');
const newCategoryInput = document.getElementById('newCategoryInput');
const saveCategoryBtn = document.getElementById('saveCategoryBtn');
const cancelCategoryBtn = document.getElementById('cancelCategoryBtn');
const saveNoteBtn = document.getElementById('saveNoteBtn');
const clearNoteBtn = document.getElementById('clearNoteBtn');

function mostrarEstado(texto) {
    const status = document.getElementById('status');
    status.textContent = texto;
    clearTimeout(mostrarEstado.timeoutId);
    mostrarEstado.timeoutId = setTimeout(() => {
        status.textContent = '';
    }, 3000);
}

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

function formatDate(timestamp) {
    if (!timestamp) return 'Sin fecha';
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? 'Sin fecha' : date.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function createId() {
    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'note-' + Date.now() + '-' + Math.random().toString(16).slice(2);
}

function getSafeNoteContent(content) {
    if (content && typeof content === 'string') {
        return content.trim();
    }
    return '';
}

function getCategoriesFromNotes() {
    const categoriesFromNotes = new Set(notes.map(note => note.category || 'General'));
    return ['all', ...Array.from(categoriesFromNotes)];
}

function saveCategoriesToStorage() {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

function readCategoriesFromStorage() {
    try {
        const raw = localStorage.getItem(CATEGORIES_KEY);
        return raw ? JSON.parse(raw) : DEFAULT_CATEGORIES.slice();
    } catch (error) {
        return DEFAULT_CATEGORIES.slice();
    }
}

function renderCategorySelect() {
    noteCategory.innerHTML = categories.map(cat => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join('');
}

function renderFilters() {
    const filterCategories = getCategoriesFromNotes();
    const buttons = filterCategories.map(category => {
        const label = category === 'all' ? 'Todas' : category;
        const activeClass = currentFilter === category ? 'active' : '';
        return `<button class="filter-btn ${activeClass}" data-filter="${category}" type="button">${escapeHtml(label)}</button>`;
    }).join('');

    filtersContainer.innerHTML = buttons;
    filtersContainer.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', () => {
            currentFilter = button.dataset.filter;
            renderFilters();
            renderNotes();
        });
    });
}

function updateLayoutToggleButton() {
    if (!layoutToggleBtn) return;
    layoutToggleBtn.textContent = `Vista: ${noteLayout === 'grid' ? 'Cuadrícula' : 'Lista'}`;
    layoutToggleBtn.setAttribute('title', noteLayout === 'grid' ? 'Cambiar a vista de lista' : 'Cambiar a vista de cuadrícula');
}

function setNotesLayout(layout) {
    noteLayout = layout === 'list' ? 'list' : 'grid';
    notesContainer.classList.toggle('notes-list-view', noteLayout === 'list');
    notesContainer.classList.toggle('notes-grid-view', noteLayout === 'grid');
    updateLayoutToggleButton();
    renderNotes();
}

function renderNotes() {
    const filteredNotes = currentFilter === 'all'
        ? notes
        : notes.filter(note => (note.category || 'General') === currentFilter);

    notesContainer.classList.toggle('notes-list-view', noteLayout === 'list');
    notesContainer.classList.toggle('notes-grid-view', noteLayout === 'grid');

    if (!filteredNotes.length) {
        notesContainer.innerHTML = '<div class="empty-state">No hay notas para esta categoría.</div>';
        return;
    }

    notesContainer.innerHTML = filteredNotes.map(note => {
        const noteTitleText = note.title ? escapeHtml(note.title) : 'Sin título';
        const previewText = stripHtml(note.content || '');
        const snippet = previewText ? (previewText.length > previewTextLength ? previewText.slice(0, previewTextLength) + '...' : previewText) : 'Sin contenido';
        const isSelected = currentSelectedNoteId === note.id ? 'style="outline: 2px solid rgba(64, 103, 255, 0.5);"' : '';
        const listMode = noteLayout === 'list';
        const previewMarkup = listMode
            ? ''
            : `<div class="note-preview">${escapeHtml(snippet)}</div>`;
        const titleMarkup = listMode
            ? `<h4 class="note-title-inline">${noteTitleText}</h4>`
            : `<h4>${noteTitleText}</h4>`;
        const footerMarkup = listMode
            ? ''
            : `<div class="note-card-footer"><span>${formatDate(note.updatedAt || note.createdAt)}</span></div>`;

        return `
            <article class="note-card ${listMode ? 'is-list' : 'is-grid'}" data-id="${note.id}" draggable="true" style="--note-color: ${note.color || '#fff4a3'};" ${isSelected}>
                <div class="note-card-header">
                    <span class="note-category">${escapeHtml(note.category || 'General')}</span>
                    ${listMode ? titleMarkup : ''}
                    <div class="note-actions">
                        <button type="button" data-action="load" data-id="${note.id}" aria-label="Cargar nota" title="Cargar nota">&#x1F441;</button>
                        <button type="button" data-action="copy" data-id="${note.id}" aria-label="Copiar nota con formato" title="Copiar nota con formato">&#x1F4CB;</button>
                        <button type="button" data-action="delete" data-id="${note.id}" aria-label="Eliminar nota" title="Eliminar nota">&#x274C;</button>
                    </div>
                </div>

                ${!listMode ? titleMarkup : ''}
                ${previewMarkup}
                <div class="note-hover-preview"></div>
                ${footerMarkup}
            </article>
        `;
    }).join('');

    notesContainer.querySelectorAll('.note-card').forEach(card => {
        const noteId = card.dataset.id;
        const note = notes.find(item => item.id === noteId);
        const hoverPreview = card.querySelector('.note-hover-preview');

        if (hoverPreview) {
            let hoverTimer = null;

            const showPreview = () => {
                if (!note) return;
                hoverPreview.innerHTML = note.content || '<p>Sin contenido</p>';
                hoverPreview.classList.add('visible');
            };

            const hidePreview = () => {
                hoverPreview.classList.remove('visible');
                hoverPreview.innerHTML = '';
                clearTimeout(hoverTimer);
            };

            card.addEventListener('mouseenter', () => {
                clearTimeout(hoverTimer);
                hoverTimer = setTimeout(showPreview, 1000);
            });

            card.addEventListener('mouseleave', () => {
                clearTimeout(hoverTimer);
                hidePreview();
            });
        }

        card.addEventListener('click', (event) => {
            const actionTarget = event.target.closest('[data-action]');
            if (actionTarget) {
                const action = actionTarget.dataset.action;
                const noteId = actionTarget.dataset.id;

                if (action === 'load') {
                    loadNoteIntoEditor(noteId);
                }
                if (action === 'copy') {
                    copyNoteFormatted(noteId);
                }
                if (action === 'delete') {
                    deleteNote(noteId);
                }
                return;
            }

            const activeNoteId = card.dataset.id;
            currentSelectedNoteId = activeNoteId;
            renderNotes();
        });

        card.addEventListener('dragstart', (event) => {
            draggedNoteId = card.dataset.id;
            event.dataTransfer.effectAllowed = 'move';
            card.classList.add('dragging');
        });

        card.addEventListener('dragend', () => {
            draggedNoteId = null;
            card.classList.remove('dragging');
            notesContainer.querySelectorAll('.note-card').forEach(el => el.classList.remove('drag-over'));
        });

        card.addEventListener('dragover', (event) => {
            event.preventDefault();
            card.classList.add('drag-over');
        });

        card.addEventListener('dragleave', () => {
            card.classList.remove('drag-over');
        });

        card.addEventListener('drop', (event) => {
            event.preventDefault();
            const targetId = card.dataset.id;
            reorderNotes(draggedNoteId, targetId);
            card.classList.remove('drag-over');
        });
    });
}

function reorderNotes(sourceId, targetId) {
    if (!sourceId || !targetId || sourceId === targetId) {
        return;
    }

    const sourceIndex = notes.findIndex(note => note.id === sourceId);
    const targetIndex = notes.findIndex(note => note.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    const [movedNote] = notes.splice(sourceIndex, 1);
    notes.splice(targetIndex, 0, movedNote);
    saveNotesToStorage();
    renderNotes();
}

function saveNotesToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    syncNotesToExtension();
}

// Notifica a la extensión de Chrome (content script) para que copie las notas a chrome.storage
function syncNotesToExtension() {
    window.dispatchEvent(new CustomEvent('tinyhtml-notes-sync', { detail: notes }));
}

function readNotesFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (error) {
        return [];
    }
}

function ensureExampleNotes() {
    if (notes.length > 0) return;

    notes = [
        {
            id: createId(),
            title: 'Ideas del proyecto',
            category: 'Dispatching',
            color: '#fff4a3',
            content: '<p>Crear un panel lateral para notas rápidas con categorías.</p><ul><li>Guardar contenido HTML</li><li>Reutilizar notas</li></ul>',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: createId(),
            title: 'Recordatorio',
            category: 'Cloud Task',
            color: '#d7f7d7',
            content: '<p>Revisar propuestas de diseño y exportar notas a XML.</p>',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];
    saveNotesToStorage();
}

function loadCategoriesFromXml(xmlText) {
    if (!xmlText || !xmlText.trim()) {
        return DEFAULT_CATEGORIES.slice();
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
    const categoryNodes = Array.from(xmlDoc.querySelectorAll('categories > category'));

    if (categoryNodes.length === 0) {
        return DEFAULT_CATEGORIES.slice();
    }

    return categoryNodes.map(node => node.getAttribute('name')).filter(name => name);
}

function loadNotesFromXml(xmlText) {
    if (!xmlText || !xmlText.trim()) {
        return [];
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
    const xmlNotes = Array.from(xmlDoc.querySelectorAll('note'));

    return xmlNotes.map(noteNode => ({
        id: noteNode.getAttribute('id') || createId(),
        title: noteNode.getAttribute('title') || 'Sin título',
        category: noteNode.getAttribute('category') || 'General',
        color: noteNode.getAttribute('color') || '#fff4a3',
        content: noteNode.querySelector('content') ? noteNode.querySelector('content').textContent : '',
        createdAt: noteNode.getAttribute('createdAt') || new Date().toISOString(),
        updatedAt: noteNode.getAttribute('updatedAt') || new Date().toISOString()
    }));
}

function serializeNotesToXml(items) {
    const xmlCategories = categories.map(cat => `\n    <category name="${escapeXmlAttribute(cat)}" />`).join('');

    const xmlNotes = items.map(note => {
        const content = note.content || '';
        const safeContent = content.replace(/]]>/g, ']]]]><![CDATA[>');

        return `
  <note id="${escapeXmlAttribute(note.id || createId())}" title="${escapeXmlAttribute(note.title || 'Sin título')}" category="${escapeXmlAttribute(note.category || 'General')}" color="${escapeXmlAttribute(note.color || '#fff4a3')}" createdAt="${escapeXmlAttribute(note.createdAt || new Date().toISOString())}" updatedAt="${escapeXmlAttribute(note.updatedAt || new Date().toISOString())}">
    <content><![CDATA[${safeContent}]]></content>
  </note>`;
    }).join('');

    return '<?xml version="1.0" encoding="UTF-8"?>\n<notes>\n  <categories>' + xmlCategories + '\n  </categories>' + xmlNotes + '\n</notes>';
}

function escapeXmlAttribute(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

async function loadNotesAtStartup() {
    const localNotes = readNotesFromStorage();
    const localCategories = readCategoriesFromStorage();
    
    if (localNotes.length) {
        notes = localNotes;
        categories = localCategories;
        renderCategorySelect();
        renderNotes();
        renderFilters();
        syncNotesToExtension();
        return;
    }

    try {
        const response = await fetch(XML_PATH, { cache: 'no-store' });
        if (response.ok) {
            const xmlText = await response.text();
            const xmlNotes = loadNotesFromXml(xmlText);
            const xmlCategories = loadCategoriesFromXml(xmlText);
            if (xmlNotes.length || xmlCategories.length) {
                notes = xmlNotes;
                categories = xmlCategories.length ? xmlCategories : DEFAULT_CATEGORIES.slice();
                saveNotesToStorage();
                saveCategoriesToStorage();
                renderCategorySelect();
                renderNotes();
                renderFilters();
                return;
            }
        }
    } catch (error) {
        console.log('No se pudo cargar notes.xml, se usará almacenamiento local.', error);
    }

    categories = DEFAULT_CATEGORIES.slice();
    ensureExampleNotes();
    renderCategorySelect();
    renderNotes();
    renderFilters();
    syncNotesToExtension();
}

function populateFormFromNote(note) {
    if (!note) return;
    noteTitle.value = note.title || '';
    noteCategory.value = note.category || 'General';
    currentSelectedNoteId = note.id;
    isEditingMode = true;

    const colorButtons = document.querySelectorAll('.swatch');
    colorButtons.forEach(button => {
        const isActive = button.dataset.color === (note.color || '#fff4a3');
        button.classList.toggle('active', isActive);
    });

    selectedColor = note.color || '#fff4a3';
    
    saveNoteBtn.textContent = 'Actualizar nota';
    saveNoteBtn.style.backgroundColor = '#48bb78';
    clearNoteBtn.style.display = 'block';
    
    renderNotes();
}

function limpiarFormulario() {
    noteTitle.value = '';
    noteCategory.value = 'General';
    currentSelectedNoteId = null;
    isEditingMode = false;
    selectedColor = '#fff4a3';
    
    document.querySelectorAll('.swatch').forEach((btn, idx) => {
        btn.classList.toggle('active', idx === 0);
    });
    
    saveNoteBtn.textContent = 'Guardar del editor';
    saveNoteBtn.style.backgroundColor = '';
    clearNoteBtn.style.display = 'none';
    renderNotes();
}

function buildNoteFromForm({ isUpdate = false, id = null } = {}) {
    const title = noteTitle.value.trim();
    const category = noteCategory.value || 'General';
    const content = tinymce.get('editor').getContent({ format: 'html' });

    const baseNote = {
        id: id || createId(),
        title: title || 'Sin título',
        category,
        color: selectedColor,
        content: getSafeNoteContent(content),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    if (isUpdate && id) {
        const existingNote = notes.find(item => item.id === id);
        if (existingNote) {
            baseNote.createdAt = existingNote.createdAt || baseNote.createdAt;
        }
    }

    return baseNote;
}

function guardarNotaManual() {
    const noteId = currentSelectedNoteId;
    const isUpdate = Boolean(noteId && notes.some(item => item.id === noteId));

    if (isUpdate) {
        notes = notes.map(item => item.id === noteId ? buildNoteFromForm({ isUpdate: true, id: noteId }) : item);
        mostrarEstado('Nota actualizada');
    } else {
        const newNote = buildNoteFromForm({ isUpdate: false });
        notes.unshift(newNote);
        currentSelectedNoteId = newNote.id;
        mostrarEstado('Nota guardada');
    }

    saveNotesToStorage();
    renderFilters();
    renderNotes();
}

function guardarNotaDesdeEditor() {
    guardarNotaManual();
}

function deleteNote(noteId) {
    notes = notes.filter(note => note.id !== noteId);
    if (currentSelectedNoteId === noteId) {
        currentSelectedNoteId = null;
        isEditingMode = false;
        limpiarFormulario();
    }
    saveNotesToStorage();
    renderFilters();
    renderNotes();
    mostrarEstado('Nota eliminada');
}

function loadNoteIntoEditor(noteId) {
    const targetNote = notes.find(note => note.id === noteId);
    if (!targetNote) return;

    tinymce.get('editor').setContent(targetNote.content || '');
    currentSelectedNoteId = targetNote.id;
    populateFormFromNote(targetNote);
    mostrarEstado('Nota cargada en el editor');
}

async function copyNoteFormatted(noteId) {
    const targetNote = notes.find(note => note.id === noteId);
    if (!targetNote) return;

    const htmlContent = targetNote.content || '';
    const temporaryContainer = document.createElement('div');
    temporaryContainer.innerHTML = htmlContent;
    temporaryContainer.style.position = 'fixed';
    temporaryContainer.style.left = '-9999px';
    temporaryContainer.style.top = '0';
    document.body.appendChild(temporaryContainer);

    const plainText = temporaryContainer.innerText || temporaryContainer.textContent || '';

    try {
        if (navigator.clipboard && window.ClipboardItem) {
            const clipboardData = {
                'text/html': new Blob([htmlContent], { type: 'text/html' }),
                'text/plain': new Blob([plainText], { type: 'text/plain' })
            };
            await navigator.clipboard.write([new ClipboardItem(clipboardData)]);
        } else {
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(temporaryContainer);
            selection.removeAllRanges();
            selection.addRange(range);
            if (!document.execCommand('copy')) {
                throw new Error('No se pudo copiar el contenido');
            }
            selection.removeAllRanges();
        }
        mostrarEstado('Nota copiada con formato');
    } catch (error) {
        mostrarEstado('No se pudo copiar la nota');
    } finally {
        temporaryContainer.remove();
    }
}

function cargarNotaAlEditor() {
    if (!currentSelectedNoteId) {
        mostrarEstado('Primero selecciona o guarda una nota');
        return;
    }
    loadNoteIntoEditor(currentSelectedNoteId);
}

function toggleSidebar() {
    notesPanel.classList.toggle('collapsed');
}

function exportarNotasXml() {
    const xml = serializeNotesToXml(notes);
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(blob);
    enlace.download = 'notes.xml';
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(enlace.href);
    mostrarEstado('Archivo XML exportado');
}

async function importarNotasXml() {
    importXmlInput.click();
}

importXmlInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const xmlText = e.target.result;
        const importedNotes = loadNotesFromXml(xmlText);
        const importedCategories = loadCategoriesFromXml(xmlText);

        if (importedNotes.length) {
            notes = [...importedNotes, ...notes];
            saveNotesToStorage();
            renderFilters();
            renderNotes();
            mostrarEstado(`${importedNotes.length} nota(s) importadas`);
        }

        if (importedCategories.length) {
            categories = [...new Set([...importedCategories, ...categories])];
            saveCategoriesToStorage();
            renderCategorySelect();
        }
    };
    reader.readAsText(file);
    importXmlInput.value = '';
});

if (layoutToggleBtn) {
    layoutToggleBtn.addEventListener('click', () => {
        setNotesLayout(noteLayout === 'grid' ? 'list' : 'grid');
    });
}

document.querySelectorAll('.color-picker .swatch').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.color-picker .swatch').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        selectedColor = button.dataset.color;
    });
});

addCategoryBtn.addEventListener('click', () => {
    newCategoryContainer.style.display = 'flex';
    newCategoryInput.focus();
});

function addNewCategory() {
    const categoryName = newCategoryInput.value.trim();

    if (!categoryName) {
        mostrarEstado('Nombre de categoría vacío');
        return;
    }

    if (categories.includes(categoryName)) {
        mostrarEstado('Categoría ya existe');
        return;
    }

    categories.push(categoryName);
    saveCategoriesToStorage();
    renderCategorySelect();
    renderFilters();

    newCategoryInput.value = '';
    newCategoryContainer.style.display = 'none';
    mostrarEstado('Categoría agregada');
}

saveCategoryBtn.addEventListener('click', addNewCategory);

cancelCategoryBtn.addEventListener('click', () => {
    newCategoryInput.value = '';
    newCategoryContainer.style.display = 'none';
});

newCategoryInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        addNewCategory();
    }
});

// Funciones del modal de ayuda
function openHelpModal() {
    const helpModal = document.getElementById('helpModal');
    helpModal.classList.remove('hidden');
}

function closeHelpModal() {
    const helpModal = document.getElementById('helpModal');
    helpModal.classList.add('hidden');
}

// Cerrar modal al hacer clic fuera del contenido
document.addEventListener('click', (event) => {
    const helpModal = document.getElementById('helpModal');
    if (event.target === helpModal) {
        closeHelpModal();
    }
});

// Cerrar modal con ESC
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeHelpModal();
    }
});

// Inicializar TinyMCE
function initEditor() {
    tinymce.init({
        selector: '#editor',
        height: 650,
        license_key: 'gpl',
        paste_data_images: true,
        plugins: ['lists', 'link', 'image', 'table', 'code', 'autolink', 'visualblocks', 'wordcount'],
        plugins: ['accordion', 'advlist', 'anchor', 'autolink',  'autosave', 'charmap', 'code', 'codesample', 'directionality', 'emoticons', 'fullscreen', 'help', 'image', 'importcss', 'insertdatetime', 'link', 'lists', 'media',    'nonbreaking', 'pagebreak', 'preview', /*'quickbars',*/ 'save', 'searchreplace',    'table', 'visualblocks', 'visualchars', 'wordcount',    /* Premium plugins for demo purposes only */    'mediaembed',  ],
        toolbar: 'undo redo | blocks fontfamily fontsize | formatselect | bold italic underline | alignleft aligncenter alignright | bullist numlist | link image table | code visualblocks | removeformat',
        toolbar: "clearbutton | undo redo | fontfamily fontsize | bold italic underline strikethrough | forecolor backcolor removeformat | align numlist bullist | link image | lineheight outdent indent| charmap emoticons | code fullscreen preview | anchor codesample | ltr rtl | accordion accordionremove | ",
        toolbar_mode: 'sliding',
        setup: (editor) => {
            editor.on('init', async () => {
                await loadNotesAtStartup();
            });
            
            editor.ui.registry.addButton('clearbutton', {                
                icon: 'new-document',  // Icono opcional de la librería de TinyMCE
                tooltip: 'Clear all the content in the editor', // Tooltip al pasar el mouse
                onAction: function () {
                    // 3. Define la acción para vaciar el editor
                    editor.setContent(''); 
                    // Opcional: Enfocar el editor automáticamente después de limpiar
                    editor.focus(); 
                }
            });
        }
    });
}

// Copiar y descargar HTML
function copiarHTML() {
    const content = tinymce.get('editor').getContent({ format: 'html' });
    navigator.clipboard.writeText(content).then(() => {
        mostrarEstado('HTML copiado al portapapeles');
    });
}

function descargarHTML() {
    const content = tinymce.get('editor').getContent({ format: 'html' });
    const blob = new Blob(
        ['<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n<title>Documento</title>\n</head>\n<body>\n' + content + '\n</body>\n</html>'],
        { type: 'text/html;charset=utf-8' }
    );
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'documento.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    mostrarEstado('Archivo HTML descargado');
}

// Inicializar editor cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initEditor);
