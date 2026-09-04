# Editor TinyMCE con Notas Reutilizables

Sistema de editor de texto enriquecido con un panel lateral para gestionar notas reutilizables, categorías dinámicas, colores personalizables y exportación/importación en XML.

## 📁 Estructura de Archivos

```
TinyHTMLEditor/
├── index.html              # Archivo HTML principal
├── styles.css              # Estilos CSS
├── script.js               # JavaScript (funciones, eventos, lógica)
├── TinyHTMLEditor.html     # Archivo original (monolítico, para referencia)
├── notes.xml               # Archivo de datos para importar/exportar notas
├── README.md               # Este archivo
├── chrome-extension/       # Extensión de Chrome (popup de copia/pegado rápido)
│   ├── manifest.json
│   ├── content-script.js   # Sincroniza notas (localStorage -> chrome.storage.local)
│   ├── focus-tracker.js    # Recuerda el campo enfocado para el botón "Pegar"
│   ├── popup.html / popup.js / popup.css
│   └── README.md           # Instrucciones de instalación de la extensión
└── tinymce_8.6.0/          # Librería TinyMCE local
    └── tinymce/
        └── js/tinymce/     # Archivos minificados de TinyMCE
```

## 🚀 Cómo Usar

1. Abrir `index.html` en un navegador web
2. El editor carga automáticamente con:
   - Editor TinyMCE enriquecido
   - Panel lateral de notas
   - Categorías predeterminadas
   - Notas de ejemplo

## ✨ Características

### Editor TinyMCE
- Formatos: Negrita, cursiva, subrayado
- Listas numeradas y sin numerar
- Tablas
- Imágenes (Base64)
- Enlaces
- Visualización de código HTML

### Sistema de Notas
- ✅ Crear notas desde el editor
- ✅ Editar notas existentes
- ✅ Cargar notas al editor
- ✅ Eliminar notas
- ✅ Categorías dinámicas (crear nuevas)
- ✅ 5 colores personalizables
- ✅ Filtrar por categoría
- ✅ Reordenar notas (drag & drop)

### Almacenamiento
- localStorage (navegador) - Almacenamiento principal
- XML - Importar/exportar como backup

### Interfaz
- Panel lateral colapsable
- Modal de ayuda integrado (❓)
- Indicadores de estado en tiempo real
- Interfaz responsive

## 🎨 Colores Disponibles
- 🟨 Amarillo (#fff4a3)
- 🟩 Verde (#d7f7d7)
- 🟦 Azul (#d6e8ff)
- 🟥 Rosa (#ffd7e6)
- 🟪 Morado (#eadbff)

## 📋 Categorías Predeterminadas
- Dispatching
- Update
- Cloud Task

*Puedes agregar más categorías dinámicamente desde el panel lateral.*

## 💾 Persistencia de Datos

- **localStorage**: Almacenamiento principal del navegador
- **XML**: Archivo para backup y transferencia entre navegadores
- Las notas se guardan automáticamente al crear/editar

## 🔧 Archivos Separados

| Archivo | Contenido |
|---------|-----------|
| `index.html` | Estructura HTML limpia, enlaces a CSS/JS externos |
| `styles.css` | Todos los estilos: layouts, colores, animaciones, responsive |
| `script.js` | Toda la lógica: notas, categorías, XML, eventos, TinyMCE |

## 📝 Funciones Principales (script.js)

### Gestión de Notas
- `guardarNotaDesdeEditor()` - Guardar contenido del editor como nota
- `editNoteFromList(noteId)` - Editar nota existente
- `deleteNote(noteId)` - Eliminar nota
- `loadNoteIntoEditor(noteId)` - Cargar nota en el editor

### Gestión de Categorías
- `renderCategorySelect()` - Renderizar selector de categorías
- `addNewCategory()` - Agregar nueva categoría
- `renderFilters()` - Renderizar botones de filtro

### Almacenamiento
- `saveNotesToStorage()` - Guardar en localStorage
- `exportarNotasXml()` - Descargar como XML
- `importarNotasXml()` - Cargar desde XML

### Modal de Ayuda
- `openHelpModal()` - Abrir modal con instrucciones
- `closeHelpModal()` - Cerrar modal

## 🎓 Uso del Modal de Ayuda

Haz clic en el botón ❓ en la barra de herramientas para ver instrucciones detalladas sobre:
- Editor TinyMCE
- Botones disponibles
- Panel de notas
- Categorías dinámicas
- Persistencia de datos
- Consejos prácticos

## 🔄 Flujo de Trabajo Típico

1. **Crear nota**
   - Escribe contenido en el editor
   - Completa título en el panel lateral
   - Selecciona categoría y color
   - Haz clic en "Guardar del editor"

2. **Editar nota**
   - Haz clic en ✏️ en la tarjeta de la nota
   - Modifica contenido/título/categoría/color
   - Haz clic en "Actualizar nota"
   - Haz clic en "Limpiar" para terminar

3. **Reutilizar nota**
   - Haz clic en 👁️ para cargar la nota al editor
   - Edita el contenido según necesites

4. **Hacer backup**
   - Haz clic en "Exportar XML"
   - Se descarga archivo con todas las notas

## 🛠️ Requisitos

- Navegador moderno con JavaScript habilitado
- Soporte para localStorage
- No requiere servidor

## 🧩 Extensión de Chrome (Copia Rápida)

La carpeta [`chrome-extension/`](chrome-extension/README.md) contiene una extensión que **convive** con esta app web (no la reemplaza):

- Sincroniza las notas de `localStorage` hacia `chrome.storage.local` mientras `index.html` esté abierto (vía `content-script.js`).
- El popup permite buscar y filtrar por categoría (recuerda la última categoría elegida).
- **Copiar:** copia la nota con formato (HTML + texto plano) al portapapeles, igual que "Copiar nota con formato" en el editor.
- **Pegar:** inserta la nota con formato en el último campo que tuvo el foco en la pestaña activa (útil para pegar directo en otras páginas sin volver al editor).

**Instalación:**
1. Ir a `chrome://extensions` y activar "Modo de desarrollador".
2. Clic en "Cargar descomprimida" y seleccionar la carpeta `chrome-extension`.
3. Si abres `index.html` como archivo local (`file://`), habilita "Permitir acceso a las URL de archivos" en los detalles de la extensión.

Más detalles en [chrome-extension/README.md](chrome-extension/README.md).

## 📄 Licencia

- Editor TinyMCE: GPL (versión 8.6.0)
- Este proyecto: Uso libre

## 🐛 Notas Técnicas

- Las imágenes se guardan en Base64 (dentro del HTML)
- Drag & drop para reordenar notas funciona en la vista actual
- El modal se cierra con ESC o click fuera
- Las categorías son compartidas entre todas las notas
