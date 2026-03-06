Organizador de Tareas - Documentación Técnica

📋 Descripción General

Organizador de Tareas es una aplicación web single-page (SPA) completamente funcional diseñada para la gestión eficiente de tareas diarias. Desarrollada con HTML5, Tailwind CSS y JavaScript vanilla, ofrece una experiencia moderna, responsiva y persistente.

✨ Características Principales

| Funcionalidad   | Descripción                                          |
| --------------- | ---------------------------------------------------- |
| 🎨 Tema Dual    | Claro/Oscuro con detección automática y persistencia |
| 📱 Responsive   | Perfecto en móvil, tablet y desktop                  |
| 💾 Persistencia | LocalStorage - nunca pierdas tus tareas              |
| 🔍 Búsqueda     | Filtrado en tiempo real por texto/categoría          |
| 🏷 Categorías   | Dinámicas - se crean automáticamente                 |
| ⭐ Prioridades   | Alta/Media/Baja con colores distintivos              |
| ✅ Completadas   | Marca y filtra tareas terminadas                     |
| 🗑 Confirmación | Prevención de eliminaciones accidentales             |

🛠 Tecnologías Utilizadas

Frontend:
├── HTML5 (Semántica ARIA)
├── Tailwind CSS (v3.x) - Configuración custom
└── JavaScript ES6+ (Vanilla - Sin frameworks)

Almacenamiento:
└── LocalStorage (PWA-ready)

Herramientas:
├── Git/GitHub
└── VS Code


🎨 Diseño y UX
Paleta de Colores

    Primaria: Amarillo ámbar (#F5ECD6 / #1C1917)

    Prioridades: Rojo/Almendra/Verde

    Gradientes: Radiales sutiles para profundidad

Animaciones

    Transiciones suaves (300ms)

    Hover effects en botones

    Feedback visual en interacciones

📂 Estructura del Proyecto

taskflow-project/
├── index.html          # Aplicación completa
├── README.md          # Esta documentación
└── .gitignore         # Plantilla estándar


🚀 Instalación y Uso
Requisitos

    Navegador moderno (Chrome 90+, Firefox 90+, Safari 14+)

Deploy (1 clic)

# Clona el repositorio
git clone https://github.com/thamih-b/taskflow-project.git

# Abre index.html
# ¡Listo! Funciona offline

Hosting Gratuito

    GitHub Pages: Configuración → Pages → Deploy desde main

    Netlify: Drag & drop index.html

    Vercel: vercel --prod

⚙️ Funcionalidades Detalladas
1. Gestión de Tareas

• Agregar: Input + Enter / Botón
• Editar: Dropdown prioridad en vivo
• Completar: Checkbox con animación ✓
• Eliminar: Confirmación con nombre de tarea

2. Filtros Avanzados
• Prioridad: Todas/Alta/Media/Baja/Completadas/Pendientes
• Categorías: Dinámicas (se auto-generan)
• Búsqueda: Texto + Categoría (tiempo real)

3. Persistencia Inteligente
• Auto-save cada cambio
• Theme preference guardado
• Datos sobreviven recarga/navegador cerrado

🔧 Personalización
Cambiar Colores
// En <script> tailwind.config
colors: {
  primary: { DEFAULT: '#tu-color', dark: '#dark-color' }
}

Agregar Prioridad Nueva
// En template HTML + CSS
priority-select → <option value="urgente">Urgente</option>

📱 Soporte de Dispositivos

| Dispositivo | Estado       | Notas                   |
| ----------- | ------------ | ----------------------- |
| Desktop     | ✅ Optimizado | Sidebar lateral         |
| Tablet      | ✅ Perfecto   | Layout adaptativo       |
| Móvil       | ✅ Nativo     | Botón flotante + gestos |

🎯 Roadmap Futuro

    Drag & Drop (reordenar tareas)

    Fechas de vencimiento

    Exportar/Importar JSON

    Notificaciones PWA

    Sincronización multi-dispositivo

👨‍💻 Autor

Thami B
Estudiante de Desarrollo de Aplicaciones Multiplataforma
GitHub | taskflow-project



🛠️ Guía para Desarrolladores
🚀 Configuración de Desarrollo
npm init -y                          # Inicializar proyecto (opcional)
npm install --save-dev live-server   # Servidor con hot reload
npx live-server                      # 🚀 http://localhost:8080


Alternativas:

    VS Code: Extensión "Live Server"

    BrowserSync: browser-sync start --server --files "*.html"

📄 Licencia

Propietaria / Todos los Derechos Reservados
© 2026 Organizador de Tareas
Todos los derechos reservados.

Prohibida la reproducción, distribución, modificación o uso comercial sin autorización expresa por escrito del autor.

✅ Uso personal y educativo permitido únicamente para estudio y portafolio individual.
🤝 Contribuciones

    Fork el proyecto

    Cree una branch feature/nueva-funcionalidad

    Commit sus cambios (git commit -m "feat: descripción")

    Push a la branch (git push origin feature/nueva-funcionalidad)

    Abra un Pull Request

Convención de Commits
feat: nueva funcionalidad
fix: corrección de bug
docs: documentación
style: formato (sin cambios funcionales)
refactor: reescritura sin nueva lógica

🐛 Problemas Comunes y Soluciones

| Problema             | Solución                                          |
| -------------------- | ------------------------------------------------- |
| Mobile desalineado   | overflow-x: hidden en html/body                   |
| Colores incorrectos  | Ctrl+F5 (limpiar caché completo)                  |
| LocalStorage vacío   | Verificar Application → Local Storage en DevTools |
| Tailwind no carga    | CDN activo + conexión internet                    |
| Filtros no funcionan | console.log() en event listeners                  |

Debug Rápido
// En consola DevTools
localStorage.clear()  // Reset datos
location.reload()     // Recargar

¡Gracias por su interés en contribuir! 🚀

🛠 Desarrollado con ❤️ para organización productiva
Última actualización: Marzo 2026