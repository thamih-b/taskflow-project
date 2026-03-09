Organizador de Tareas - Documentación Técnica
📋 Descripción General

Organizador de Tareas es una aplicación web single-page (SPA) completamente funcional y avanzada, diseñada para la gestión eficiente de tareas diarias. Desarrollada con HTML5, Tailwind CSS y JavaScript vanilla, ofrece una experiencia moderna, responsiva, altamente interactiva y con almacenamiento persistente.
🌍 **Demo en Vivo (Vercel):** [Prueba la aplicación aquí](https://taskflow-project-organizador-tareas.vercel.app/)

✨ Características Principales
| Funcionalidad              | Descripción                                                       |
| -------------------------- | ----------------------------------------------------------------- |
| 🔄 Drag & Drop             | Reordena tus tareas fácilmente arrastrando y soltando             |
| ☑️ Acciones Masivas        | Selecciona múltiples tareas para completarlas o borrarlas en lote |
| 📊 Estadísticas en Vivo    | Panel dinámico con conteo de tareas totales, pendientes y hechas  |
| 📝 Textos Inteligentes     | Truncamiento automático con opción de "Leer más / Ver menos"      |
| 🎨 Tema Dual               | Modo Claro/Oscuro con detección automática y persistencia         |
| 📱 Diseño Responsive       | Padding y layout adaptativo perfecto en móvil, tablet y desktop   |
| 💾 Persistencia            | LocalStorage - nunca pierdas tus datos ni configuraciones         |
| 🔍 Filtros y Búsqueda      | Búsqueda en tiempo real y filtros por estado y prioridad          |
| 🏷 Categorías Inteligentes | Autocompletado al crear y filtros autogenerados                   |
| ⭐ Prioridades              | Alta/Media/Baja con selectores dinámicos y colores distintivos    |
| ✏️ Edición Rápida          | Edita el título de cualquier tarea sobre la marcha                |

🛠 Tecnologías Utilizadas

Frontend:
├── HTML5 (Semántica y Accesibilidad ARIA)
├── Tailwind CSS (v3.x) - Configuración custom y gradientes
└── JavaScript ES6+ (Vanilla - POO, Set, Drag & Drop API)

Almacenamiento:
└── LocalStorage (PWA-ready)

Herramientas:
├── Git/GitHub
└── VS Code (Live Server)
🎨 Diseño y UX

Paleta de Colores:

    Primaria: Amarillo ámbar (#F5ECD6 / #1C1917)

    Prioridades y Estados: Rojo (Alta), Ámbar (Media), Esmeralda (Baja/Completado), Azul (Selección).

    Gradientes: Radiales sutiles en el fondo para generar profundidad.

Controles y UI:

    Botones de acción (Check/Selección) rediseñados como círculos modernos puros.

    Adaptación de contraste forzado (color-scheme) en el modo oscuro para controles nativos.

    Animaciones fluidas (300ms), hover effects, y feedback visual de escalado (scale) al interactuar.

📂 Estructura del Proyecto
taskflow-project/
├── index.html         # Interfaz y lógica centralizada (SPA)
├── README.md          # Documentación técnica
└── .gitignore         # Plantilla estándar

🚀 Instalación y Uso

Requisitos:

    Navegador web moderno (Chrome 90+, Firefox 90+, Safari 14+, Edge).

Deploy Local (1 clic):
# Clona el repositorio
git clone https://github.com/thamih-b/taskflow-project.git

# Abre index.html en tu navegador
# ¡Listo! Funciona de manera 100% offline

Hosting Gratuito:

    GitHub Pages: Configuración → Pages → Deploy desde branch main

    Netlify: Drag & drop del archivo index.html

    Vercel: Ejecutar vercel --prod en la terminal

⚙️ Funcionalidades Detalladas
1. Gestión Avanzada de Tareas

    Creación: Input con "Enter" o botón. Autocompletado de categorías existentes vía <datalist> y selector de prioridad por defecto.

    Edición y Orden: Botón "✏️" para cambiar texto y sistema "Drag & Drop" (Arrastrar y Soltar) para reordenar la lista.

    Lectura: Las tareas muy largas se acortan automáticamente a 4-5 líneas, revelando un botón interactivo de "Leer más".

2. Acciones Masivas y Estadísticas

    Selección: Casilla circular azul para seleccionar tareas específicas.

    Controles Dinámicos: Botones para "Seleccionar Todo", "Completar Seleccionadas" y "Borrar Seleccionadas".

    Métricas: Un panel lateral dedicado muestra en tiempo real cuántas tareas hay en total, cuántas faltan y cuántas están hechas.

3. Filtros Inteligentes

    Múltiples Vistas: Alterna entre Todas, Alta, Media, Baja, Hechas y Pendientes.

    Categorías Dinámicas: Los botones de categorías se renderizan solos basándose en las tareas existentes.

    Búsqueda: Motor de búsqueda en tiempo real que escanea tanto títulos como nombres de categorías.

🧪 Testing Manual y Resultados

Se ha realizado una batería de pruebas manuales para garantizar la estabilidad de la aplicación. A continuación se documentan los casos de prueba y sus resultados:

| Caso de Prueba | Acción Realizada | Resultado Obtenido (Status) |
| :--- | :--- | :--- |
| **Lista vacía** | Iniciar la app sin datos en el LocalStorage. | ✅ Se muestra correctamente el placeholder: *"✨ No hay tareas. ¡Agrega la primera!"* y los contadores en 0. |
| **Añadir sin título** | Presionar "Agregar" o "Enter" dejando el campo de texto en blanco. | ✅ La aplicación intercepta la acción y no crea tareas vacías ni genera errores. |
| **Título muy largo** | Pegar un párrafo extenso como título de una tarea. | ✅ El texto se trunca automáticamente a 4-5 líneas (`line-clamp`) y aparece el botón interactivo *"Leer más ▼" / "Ver menos ▲"*. |
| **Completar varias** | Seleccionar múltiples tareas y usar el botón "Completar Sel." o marcar individualmente. | ✅ Los círculos se vuelven verdes, el texto se tacha y el panel de estadísticas actualiza "Hechas" y "Pendientes" en tiempo real. |
| **Eliminar varias** | Seleccionar múltiples tareas y presionar "Borrar Sel.". | ✅ Aparece un prompt de confirmación. Al aceptar, se eliminan del DOM, el array y las estadísticas se actualizan correctamente. |
| **Persistencia** | Recargar la página (`F5`) o cerrar y volver a abrir el navegador. | ✅ Las tareas, sus estados (hecha/pendiente), prioridades y el tema (claro/oscuro) se cargan intactos desde el `LocalStorage`. |


📱 Soporte de Dispositivos
| Dispositivo | Estado       | Notas                                                  |
| ----------- | ------------ | ------------------------------------------------------ |
| Desktop     | ✅ Optimizado | Sidebar lateral anclado (Sticky) y layout expandido    |
| Tablet      | ✅ Perfecto   | Layout fluido con márgenes amplios                     |
| Móvil       | ✅ Nativo     | Espaciado ajustado (padding), elementos auto-alineados |

🎯 Roadmap Futuro

    Drag & Drop (reordenar tareas) (Completado)

    Fechas de vencimiento y recordatorios

    Exportar/Importar tareas (Backup en archivo JSON)

    Transformación a PWA con Notificaciones push

    Sincronización multi-dispositivo (Backend/Firebase)

👨‍💻 Autor

Thami B
Estudiante de Desarrollo de Aplicaciones Multiplataforma
GitHub 
https://github.com/thamih-b

GitHub | taskflow-project
https://github.com/thamih-b/taskflow-project

🛠️ Guía para Desarrolladores
Configuración de Desarrollo
npm init -y                          # Inicializar proyecto (opcional)
npm install --save-dev live-server   # Servidor con hot reload
npx live-server                      # 🚀 Inicia en http://localhost:8080

Alternativas: Extensión "Live Server" en VS Code.
📄 Licencia

Propietaria / Todos los Derechos Reservados
© 2026 Organizador de Tareas. Todos los derechos reservados.
Prohibida la reproducción, distribución, modificación o uso comercial sin autorización expresa por escrito del autor.
✅ Uso personal y educativo permitido únicamente para estudio y portafolio individual.
🤝 Contribuciones

    Haz un Fork del proyecto.

    Crea una branch (git checkout -b feature/nueva-funcionalidad).

    Haz Commit de los cambios (git commit -m "feat: descripción").

    Haz Push a la branch (git push origin feature/nueva-funcionalidad).

    Abre un Pull Request.

Convención de Commits:

    feat: nueva funcionalidad

    fix: corrección de bug

    style: formato, UI y CSS

    refactor: reescritura de código sin alterar lógica

🐛 Problemas Comunes y Soluciones
| Problema                          | Solución                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------ |
| Textos vacíos o desalineados      | Usar una sola línea en el código HTML para etiquetas con whitespace-pre-wrap.        |
| Colores incorrectos (Tema oscuro) | Presionar Ctrl+F5 o vaciar caché. El <select> nativo usa color-scheme: dark.         |
| Drag & Drop no funciona           | Asegurarse de que las tareas no tengan elementos de texto que bloqueen los punteros. |
| LocalStorage no actualiza         | Recargar con F5 o ejecutar localStorage.clear() en la consola (DevTools).            |

Desarrollado con ❤️ para la organización productiva.
Última actualización: Marzo 2026