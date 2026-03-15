# 📓 Organizador de Tareas

> **Un presente organizado es un futuro seguro.**

Aplicación web SPA (*single-page*) moderna para la gestión eficiente de tareas.
Construida con **HTML5**, **Tailwind CSS** y **JavaScript vanilla** — sin frameworks,
sin servidor, sin paso de compilación. Funciona 100 % en el navegador.

🌍 **Demo en Vivo:** [taskflow-project-organizador-tareas.vercel.app](https://taskflow-project-organizador-tareas.vercel.app/)

---

## ✨ Características

| Funcionalidad | Descripción |
|---|---|
| **Tareas manuales** | Título, categoría, prioridad, deadline opcional y múltiples subtareas con chips |
| **SmartParser** | Análisis de lenguaje natural con Regex + Chrono.js — detecta fechas, prioridades, categorías y múltiples tareas sin API externa |
| **Modal de preaprobación** | Previsualiza y edita cada tarea detectada antes de guardarla |
| **Mini-calendario** | Calendario lateral con puntos por día (verde · naranja · rojo); clic en un día filtra la lista |
| **Alertas de deadline** | Badge rojo para tareas vencidas, badge naranja pulsante para tareas en las próximas 24 h |
| **Subtareas + barra de progreso** | Subtareas anidadas con sincronización de estado al padre |
| **Drag & Drop** | Reordena tarjetas arrastrando; desactivado al ordenar por fecha |
| **Orden por deadline** | Un clic para ordenar ascendentemente por fecha de vencimiento |
| **Modo Claro / Oscuro** | Toggle con detección automática del sistema; persiste en localStorage |
| **i18n** | Español 🇪🇸 · Portugués 🇧🇷 · Inglés 🇺🇸 — traducción en tiempo de ejecución |
| **Acciones masivas** | Seleccionar todo / completar seleccionadas / borrar tareas hechas |
| **Edición inline** | Doble clic en título, categoría o subtarea para editarlos al instante |
| **Almacenamiento persistente** | Todo guardado en localStorage — sobrevive recargas y cierres del navegador |
| **Filtros y búsqueda** | Búsqueda en tiempo real; filtros por estado, prioridad y categoría dinámica |

---

## 🗂 Estructura del Proyecto

organizador/
├── index.html # Shell de la app — layout, tabs, sidebar, modal overlay
├── app.js # Clase principal: OrganizadorDeTareas (toda la lógica)
├── i18n.js # Traducciones (ES / PT / EN) + LANG_META
├── storage.js # storageManager — wrapper de localStorage con try/catch
└── README.md # Este archivo


---

## 🚀 Inicio Rápido

```bash
# Opción 1 — Abrir directo en el navegador
# Descarga o clona el repositorio y abre index.html. Sin dependencias.

# Opción 2 — Servidor con hot reload
npm install --save-dev live-server
npx live-server        # → http://localhost:8080

# Alternativa: extensión "Live Server" en VS Code
Requisitos: Navegador moderno (Chrome 90+, Firefox 90+, Safari 14+, Edge 90+).
📖 Uso
Crear una tarea manual

    Escribe el título en el campo principal.

    Selecciona o escribe una categoría (autocompletado con <datalist>).

    Elige la prioridad: Alta / Media / Baja.

    (Opcional) Añade subtareas: escribe en el campo de subtareas y pulsa + o Enter.
    Aparecen como chips — elimínalos antes de guardar si es necesario.

    (Opcional) Define un deadline. Sin hora → se asigna 23:59 automáticamente;
    con hora → deadline exacto. Soporte de rango horario (Timebox) con hora de fin.

    Haz clic en Agregar o pulsa Enter.

Usar el SmartParser

El SmartParser detecta fechas, prioridades, categorías y múltiples tareas directamente
en el navegador — sin clave API, sin petición de red.

Entrada:  "Reunión de trabajo el viernes a las 10h y entregar informe antes del jueves"

Resultado: Dos tareas detectadas:
  ├── "Reunión de trabajo"   · Timebox  · viernes 10:00
  └── "Entregar informe"    · Deadline · jueves 23:59

Flujo:

    Ve a la pestaña 🧠 Tareas inteligentes.

    Escribe una o varias tareas en lenguaje natural.

    Revisa el modal de preaprobación: edita título, categoría, prioridad, fecha,
    hora, hora de fin y subtareas de cada tarjeta.

    Añade o elimina tarjetas de tarea antes de confirmar.

    Haz clic en ✅ Confirmar y agregar — el calendario navega al mes de la primera tarea.

Ejemplos de entrada:


    "Comprar leite, pão e ovos amanhã às 9h, prioridade baixa" → tarea de compras con deadline

    "Estudar inglês das 14h às 15h30 e revisar exercícios até domingo" → timebox + deadline

    "Médico el lunes a las 8:30" → categoría salud, hora exacta

    "Entregar TCC hasta fin de mes, urgente" → categoría estudios, prioridad alta

Filtrar por día en el calendario

Haz clic en cualquier día del calendario lateral que tenga puntos de color.
La lista de tareas se filtra instantáneamente.
Vuelve a hacer clic en el mismo día (o en el badge ✕ Limpiar filtro) para restablecer.
Editar tareas

    Doble clic en el título de la tarea → edición por prompt.

    Doble clic en la categoría (📓 ...) → renombrar categoría.

    Doble clic en cualquier subtarea → editar su texto.

    Clic en el badge de prioridad → <select> nativo para cambiarla al instante.

⚙️ Configuración (localStorage)

| Clave                  | Tipo               | Descripción                  |
| ---------------------- | ------------------ | ---------------------------- |
| organizator-tasks      | JSON array         | Todas las tareas y subtareas |
| organizator-lang       | "es" \| "pt" \| "en" | Idioma activo                |
| theme                  | "light" \| "dark"  | Tema de la interfaz          |
| organizator-active-tab | "manual" \| "smart" | Última pestaña activa        |

🏗 Arquitectura

Toda la lógica reside en la clase OrganizadorDeTareas, instanciada una vez como
organizator (variable global). Los atributos onclick del HTML llaman directamente
a métodos de este objeto, manteniendo la capa de plantilla simple y desacoplada.
Modelo de datos
// Tarea
{
  id:                string,            // Date.now().toString()
  text:              string,            // Título
  category:          string,            // "Compras" | "Trabajo" | "General" | ...
  priority:          "high" | "medium" | "low",
  completed:         boolean,
  subtasks:          Subtask[],
  due_date?:         string,            // ISO 8601 UTC
  due_date_has_time?: boolean,          // true = hora explícita; false = 23:59 por defecto
  due_date_end?:     string,            // ISO 8601 UTC — hora de fin para tareas Timebox
}

// Subtarea
{
  id:        string,
  text:      string,
  completed: boolean,
}

Módulos
| Archivo    | Responsabilidad                                                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| app.js     | Clase principal — renderizado, filtros, drag & drop, SmartParser, calendario                                                                     |
| i18n.js    | Objeto I18N con claves de traducción; LANG_META con bandera y código; setLanguage(), applyTranslations(), t()                                    |
| storage.js | storageManager — save/load Tasks, save/loadLanguage, save/loadTheme, save/loadActiveTab; todos los accesos a localStorage envueltos en try/catch |

🎨 Diseño y UX

    Paleta: Ámbar (#F5ECD6 claro / #1C1917 oscuro) · Rojo (alta/vencido) · Naranja (urgente) · Esmeralda (baja/hecho) · Azul (selección/filtro activo).

    Controles fijos: Botón de tema (🌙/☀️) y selector de idioma anclados en la esquina superior derecha; no se desplazan con el scroll.

    Navegación por pestañas: Subrayado animado con degradado ámbar/oro oscuro sobre fondo flush al header.

    Sidebar: Fluye con la página de forma natural; sin scroll independiente.

    Animaciones: Transiciones de 300 ms, efectos hover, escala al interactuar y badge pulsante para urgentes.

🧪 Pruebas Manuales
| Caso de Prueba    | Acción                                  | Resultado                                                                 |
| ----------------- | --------------------------------------- | ------------------------------------------------------------------------- |
| Lista vacía       | Iniciar sin datos en localStorage       | ✅ Placeholder "✨ No hay tareas. ¡Agrega la primera!" y contadores en 0    |
| Tarea sin título  | Pulsar Agregar con campo vacío          | ✅ No se crea tarea; sin errores en consola                                |
| Título muy largo  | Pegar un párrafo como título            | ✅ Truncamiento automático con botón "Leer más ▼ / Ver menos ▲"            |
| Completar varias  | Seleccionar y usar "Completar Sel."     | ✅ Círculos verdes, texto tachado, estadísticas actualizadas               |
| Eliminar varias   | Seleccionar y pulsar "Borrar Sel."      | ✅ Confirmación, eliminación del DOM y actualización de estadísticas       |
| Persistencia      | Recargar con F5 o reabrir el navegador  | ✅ Tareas, estados, tema e idioma restaurados desde localStorage           |
| SmartParser       | Frase con dos tareas y fechas distintas | ✅ Modal muestra dos tarjetas editables con fechas resueltas correctamente |
| Filtro calendario | Clic en día con puntos                  | ✅ Lista filtrada; badge de filtro activo con botón para limpiar           |

📱 Compatibilidad
| Dispositivo | Estado       | Notas                                        |
| ----------- | ------------ | -------------------------------------------- |
| Desktop     | ✅ Optimizado | Sidebar lateral + layout expandido           |
| Tablet      | ✅ Perfecto   | Layout fluido con márgenes amplios           |
| Móvil       | ✅ Nativo     | Espaciado ajustado; controles auto-alineados |

🐛 Problemas Comunes
| Problema                           | Solución                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------- |
| Textos vacíos o indentados         | Verificar que no haya whitespace-pre-wrap activo en el elemento           |
| Colores incorrectos en tema oscuro | Ctrl+F5 para vaciar caché; el <select> nativo requiere color-scheme: dark |
| Drag & Drop no responde            | Comprobar que ningún elemento hijo capture el evento de puntero           |
| localStorage sin actualizar        | Recargar con F5 o ejecutar localStorage.clear() en DevTools               |

🎯 Roadmap

    Drag & Drop para reordenar tareas

    Fechas de vencimiento con alertas de urgencia

    Internacionalización (ES / PT / EN)

    Mini-calendario con filtro por día

    SmartParser offline (Regex + Chrono.js)

    Exportar / Importar tareas (JSON)

    PWA con notificaciones push

    Sincronización multi-dispositivo (Backend / Firebase)

🤝 Contribuciones

git checkout -b feature/nueva-funcionalidad   # Crea tu rama
git commit -m "feat: descripción"             # Conventional Commits
git push origin feature/nueva-funcionalidad   # Sube los cambios
# Abre un Pull Request en GitHub

👨‍💻 Autor

Thami B — Estudiante de Desarrollo de Aplicaciones Multiplataforma
GitHub: github.com/thamih-b · Repo: taskflow-project
📄 Licencia

Propietaria / Todos los Derechos Reservados
© 2026 Organizador de Tareas. Prohibida la reproducción, distribución o uso comercial
sin autorización expresa por escrito del autor.
✅ Uso personal y educativo permitido para estudio y portafolio individual.

Desarrollado con ❤️ · Última actualización: Marzo 2026