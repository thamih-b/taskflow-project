# 📓 TaskFlow — Organizador de Tareas

> **Un presente organizado es un futuro seguro.**

Aplicación web **SPA** (*Single-Page Application*) para la gestión de tareas personales.
Construida con **HTML5 · Tailwind CSS · JavaScript vanilla** en el frontend,
y un servidor **Node.js + Express** en el backend con API REST.

🌍 **Demo estática (Fase 1):** [taskflow-project-organizador-tareas.vercel.app](https://taskflow-project-organizador-tareas.vercel.app/)

---

## 📑 Tabla de Contenidos

1. [Características](#-características)
2. [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
3. [Inicio Rápido](#-inicio-rápido)
4. [Variables de Entorno](#-variables-de-entorno)
5. [Compatibilidad](#-compatibilidad)
6. [Roadmap](#-roadmap)

> 📖 Documentación técnica del servidor → [`server/README.md`](./server/README.md)

---

## ✨ Características

| Funcionalidad | Descripción |
|---|---|
| **Tareas manuales** | Título, categoría, prioridad, deadline opcional y subtareas con chips |
| **SmartParser** | Análisis de lenguaje natural con Regex + Chrono.js — detecta fechas, prioridades, categorías y múltiples tareas sin API externa |
| **Modal de preaprobación** | Previsualiza y edita cada tarea detectada antes de confirmar |
| **Mini-calendario** | Calendario lateral con puntos de color por día; clic filtra la lista |
| **Alertas de deadline** | Badge rojo para vencidas, badge naranja pulsante para próximas 24 h |
| **Subtareas + progreso** | Subtareas anidadas con sincronización de estado al padre |
| **Drag & Drop** | Reordena tarjetas arrastrando; desactivado al ordenar por fecha |
| **Modo Claro / Oscuro** | Toggle con persistencia en `localStorage` |
| **i18n** | Español 🇪🇸 · Portugués 🇧🇷 · Inglés 🇺🇸 — traducción en tiempo de ejecución |
| **Acciones masivas** | Seleccionar todo / completar seleccionadas / borrar hechas |
| **Edición inline** | Doble clic en título, categoría o subtarea para editar al instante |
| **API REST** | CRUD de tareas servido por Express con arquitectura por capas |
| **Estados de red** | Indicadores visuales de carga, éxito y error en la UI |

---

## 🗂 Arquitectura del Proyecto
```text
taskflow-project/
│
├── index.html                  # Shell de la SPA — layout, tabs, sidebar, modal
├── app.js                      # Clase OrganizadorDeTareas — lógica de UI completa
├── i18n.js                     # Traducciones ES/PT/EN + metadatos de idioma
├── storage.js                  # storageManager — preferencias de UI en localStorage
│
└── server/                     # Servidor Node.js independiente
    ├── README.md               # ← Documentación técnica completa del servidor
    ├── .env                    # Variables de entorno (NO subir a Git)
    ├── .env.example            # Plantilla pública de variables requeridas
    ├── package.json
    └── src/
        ├── index.js
        ├── config/
        ├── routes/
        ├── controllers/
        ├── services/
        └── api/
```

La separación de responsabilidades del backend sigue una **arquitectura de tres capas** estricta.
Consulta [`server/README.md`](./server/README.md) para la documentación detallada.

---

## 🚀 Inicio Rápido

### Requisitos previos

- **Node.js** v18 o superior
- **npm** v9 o superior

### Instalación

```bash
# 1. Clona el repositorio
git clone https://github.com/thamih-b/taskflow-project.git
cd taskflow-project

# 2. Instala las dependencias del servidor
cd server
npm install

# 3. Crea el archivo de entorno
cp .env.example .env
# Edita .env y define PORT=3000
```

### Arranque

```bash
# Modo desarrollo — con recarga automática (nodemon)
cd server
npm run dev

# Modo producción
node src/index.js
```

Abre **http://localhost:3000** en el navegador. El frontend y la API se sirven
desde el mismo proceso y el mismo puerto — no se necesita Live Server ni ningún
servidor adicional.

---

## 🔐 Variables de Entorno

| Variable | Requerida | Descripción |
|---|:-:|---|
| `PORT` | ✅ | Puerto en el que escucha Express |
| `NODE_ENV` | ❌ | Entorno de ejecución (`development` / `production`) |

Archivo `.env.example`:
```env
PORT=3000
NODE_ENV=development
```

> ⚠️ **El archivo `.env` nunca debe subirse a Git.** Comprueba que figura en `.gitignore`.

---

## 📱 Compatibilidad

| Dispositivo | Estado | Notas |
|---|:-:|---|
| Desktop | ✅ Optimizado | Sidebar lateral + layout expandido |
| Tablet | ✅ Perfecto | Layout fluido con márgenes amplios |
| Móvil | ✅ Nativo | Drawer lateral + calendario colapsable |
| Chrome 90+ | ✅ | |
| Firefox 90+ | ✅ | |
| Safari 14+ | ✅ | |
| Edge 90+ | ✅ | |

---

## 🎯 Roadmap

- [x] SPA con SmartParser offline (Regex + Chrono.js)
- [x] Mini-calendario con filtro por día
- [x] Internacionalización (ES / PT / EN)
- [x] Drag & Drop para reordenar tareas
- [x] API REST con Node.js + Express
- [x] Arquitectura por capas (routes → controller → service)
- [x] Gestión de estados de red en la UI (carga / éxito / error)
- [ ] Base de datos persistente (SQLite o MongoDB)
- [ ] Autenticación JWT
- [ ] Exportar / Importar tareas (JSON)
- [ ] PWA con notificaciones push
- [ ] Tests automatizados (Jest + Supertest)
- [ ] Despliegue en producción (Railway / Render)

---

## 👨‍💻 Autor

**Thami B** — Estudiante de Desarrollo de Aplicaciones Multiplataforma  
GitHub: [github.com/thamih-b](https://github.com/thamih-b) · Repo: `taskflow-project`

---

## 📄 Licencia

Propietaria / Todos los Derechos Reservados  
© 2026 TaskFlow — Organizador de Tareas.  
Prohibida la reproducción, distribución o uso comercial sin autorización expresa por escrito del autor.  
✅ Uso personal y educativo permitido para estudio y portafolio individual.

---

*Desarrollado con ❤️ · Última actualización: Marzo 2026*