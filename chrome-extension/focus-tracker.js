// Recuerda el último campo editable enfocado en la página, porque al abrir el
// popup la ventana pierde el foco y document.activeElement pasa a ser <body>.
let lastFocusedElement = null;

function isEditable(el) {
    if (!el) return false;
    const tag = el.tagName ? el.tagName.toLowerCase() : '';
    return tag === 'input' || tag === 'textarea' || el.isContentEditable === true;
}

// Convierte el HTML de la nota a texto plano, igual que hace la app web al copiar
function htmlToPlainText(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html || '';
    return temp.innerText || temp.textContent || '';
}

document.addEventListener('focusin', (event) => {
    if (isEditable(event.target)) {
        lastFocusedElement = event.target;
    }
}, true);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type !== 'cs-snippets-paste') return undefined;

    const el = lastFocusedElement;
    if (!el || !el.isConnected) {
        // No respondemos: la página tiene varios frames (ej. el iframe del editor
        // TinyMCE) y solo el frame que realmente tiene el campo debe contestar.
        return undefined;
    }

    el.focus();
    const tag = el.tagName ? el.tagName.toLowerCase() : '';
    let success = false;

    if (tag === 'input' || tag === 'textarea') {
        // Los campos de texto plano no pueden renderizar HTML, así que insertamos el texto equivalente
        const text = htmlToPlainText(message.content);
        const start = el.selectionStart ?? el.value.length;
        const end = el.selectionEnd ?? el.value.length;
        el.setRangeText(text, start, end, 'end');
        el.dispatchEvent(new Event('input', { bubbles: true }));
        success = true;
    } else if (el.isContentEditable) {
        // insertHTML respeta el formato (negritas, listas, etc.), igual que "copiar con formato"
        success = document.execCommand('insertHTML', false, message.content);
    }

    sendResponse({ success });
    return undefined;
});
