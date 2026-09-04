# CS Snippets - Extensión de Chrome (Copia Rápida)

Este popup lee las notas guardadas por la app principal (`index.html`) y permite copiar
el contenido de cualquiera al portapapeles sin abrir el editor completo.

## Cómo funciona
- `content-script.js` se inyecta en la página de CS Snippets y copia `localStorage`
  (clave `tinyhtml-notes-v1`) hacia `chrome.storage.local` cada vez que se guardan notas.
- `focus-tracker.js` se inyecta en todas las páginas (`<all_urls>`) y recuerda el
  último campo editable (`input`, `textarea` o `contentEditable`) que tuvo foco, porque
  al abrir el popup la pestaña pierde el foco y `document.activeElement` pasa a ser
  `<body>`. El botón "Pegar" le manda un mensaje a ese script para insertar el texto.
- `popup.html`/`popup.js` leen `chrome.storage.local` y muestran la lista con buscador,
  filtro por categoría y botones "Copiar" (copia el HTML crudo, igual que "Copiar HTML")
  y "Pegar" (inserta el HTML crudo en el último campo enfocado de la pestaña activa).

## Instalar en Chrome
1. Ir a `chrome://extensions`.
2. Activar "Modo de desarrollador".
3. Clic en "Cargar descomprimida" y seleccionar esta carpeta (`chrome-extension`).
4. Si abres `index.html` como archivo local (`file://`), entra a los detalles de la
   extensión y activa **"Permitir acceso a las URL de archivos"** (Chrome no lo
   habilita por defecto para `file://`).
5. Abre `index.html`, crea/edita notas normalmente. Luego abre el ícono de la
   extensión para ver y copiar el contenido desde cualquier pestaña.

## Notas
- Si sirves la app desde `http://localhost` o `http://127.0.0.1` en vez de `file://`,
  ya está soportado en el `manifest.json` (agrega otros orígenes si usas otro puerto/host).
- No requiere conexión a internet ni código remoto (cumple políticas de Chrome Web Store).
