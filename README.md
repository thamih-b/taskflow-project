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
3. [Modelo de Datos](#-modelo-de-datos)
4. [Infraestructura del Servidor](#-infraestructura-del-servidor)
5. [Middlewares](#-middlewares)
6. [API REST — Referencia Completa](#-api-rest--referencia-completa)
7. [Capa de Red del Frontend](#-capa-de-red-del-frontend)
8. [Inicio Rápido](#-inicio-rápido)
9. [Variables de Entorno](#-variables-de-entorno)
10. [Pruebas de Integración](#-pruebas-de-integración)
11. [Compatibilidad](#-compatibilidad)
12. [Roadmap](#-roadmap)

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

```
taskflow-project/
│
├── index.html                  # Shell de la SPA — layout, tabs, sidebar, modal
├── app.js                      # Clase OrganizadorDeTareas — lógica de UI completa
├── i18n.js                     # Traducciones ES/PT/EN + metadatos de idioma
├── storage.js                  # storageManager — preferencias de UI en localStorage
│
└── server/                     # Servidor Node.js independiente
    ├── .env                    # Variables de entorno (NO subir a Git)
    ├── .env.example            # Plantilla pública de variables requeridas
    ├── package.json
    └── src/
        ├── index.js            # Punto de entrada — configura Express y arranca
        ├── config/
        │   └── env.js          # Carga y valida variables de entorno al arrancar
        ├── routes/
        │   └── task.routes.js  # Enrutador — mapea verbos HTTP a controladores
        ├── controllers/
        │   └── task.controller.js  # Capa HTTP — extrae req, valida, responde
        ├── services/
        │   └── task.service.js     # Capa de negocio — lógica pura sin HTTP
        └── api/
            └── cliente.js      # Capa de red del frontend — consume la API REST
```

### Separación de responsabilidades

El backend sigue una **arquitectura de tres capas** estricta:

```
Petición HTTP
     │
     ▼
┌─────────────┐     Solo habla HTTP:        ┌──────────────┐
│  Routes     │──── extrae parámetros ─────▶│  Controller  │
│ (task.routes│     valida inputs            │(task.ctrl.js)│
│    .js)     │◀─── devuelve respuesta ──────│              │
└─────────────┘                             └──────┬───────┘
                                                   │ llama métodos puros
                                                   ▼
                                          ┌──────────────────┐
                                          │    Service       │
                                          │(task.service.js) │
                                          │  Lógica de       │
                                          │  negocio pura    │
                                          │  sin HTTP        │
                                          └──────────────────┘
```

Cada capa tiene **una única razón para cambiar**:
- Si cambia el protocolo (REST → GraphQL) → solo `routes` y `controller`
- Si cambia la lógica de negocio → solo `service`
- Si cambia la base de datos → solo `service`

---

## 📐 Modelo de Datos

### Tarea (en el servidor)

```js
{
  id:        number,     // Auto-incremental — asignado por el servicio
  titulo:    string,     // Texto principal de la tarea
  prioridad: "alta" | "media" | "baja",  // Normalizado al recibir del frontend
  completada: boolean,
  creadaEn:  string,     // ISO 8601 UTC — timestamp de creación
}
```

### Tarea (en el frontend — tras normalización por `cliente.js`)

```js
{
  id:                string,           // Convertido a string desde el número del servidor
  text:              string,           // Mapeado desde "titulo"
  priority:          "high" | "medium" | "low",  // Mapeado desde "alta/media/baja"
  completed:         boolean,          // Mapeado desde "completada"
  category:          string,           // Gestionado solo en el frontend
  subtasks:          Subtask[],        // Gestionado solo en el frontend
  due_date?:         string,           // ISO 8601 UTC
  due_date_has_time?: boolean,
  due_date_end?:     string,           // Hora fin para tareas Timebox
}
```

### Tabla de normalización de prioridades

| Frontend envía | Servidor guarda | Frontend recibe | Frontend muestra |
|:-:|:-:|:-:|:-:|
| `"high"` | `"alta"` | `"high"` | 🔴 Alta |
| `"medium"` | `"media"` | `"medium"` | 🟠 Media |
| `"low"` | `"baja"` | `"low"` | 🟢 Baja |

La normalización ocurre en dos puntos:
- **`task.controller.js`** al recibir del frontend → convierte `medium → media`
- **`cliente.js`** al recibir del servidor → convierte `media → medium`

---

## 🏗 Infraestructura del Servidor

### `src/config/env.js` — Validación de entorno al arranque

```js
require('dotenv').config();

const VARIABLES_REQUERIDAS = ['PORT'];

VARIABLES_REQUERIDAS.forEach((nombreVariable) => {
  if (!process.env[nombreVariable]) {
    throw new Error(`❌ Variable obligatoria no definida: ${nombreVariable}`);
  }
});
```

**Por qué importa:** Si el servidor arranca sin `PORT`, fallará de forma silenciosa
o en un momento impredecible. Al validar en el módulo de configuración, que es lo
primero que se importa en `index.js`, el proceso aborta **antes de inicializar Express**
con un mensaje claro. Es el equivalente a un *fail-fast* de sistemas críticos.

### `src/index.js` — Composición del servidor

```
Orden de registro de middlewares (el orden importa en Express):

1. cors()                → permite peticiones cross-origin
2. express.json()        → parsea body con Content-Type: application/json
3. express.urlencoded()  → parsea body con Content-Type: application/x-www-form-urlencoded
4. express.static()      → sirve los archivos del frontend
5. /health               → endpoint de diagnóstico sin autenticación
6. /api/v1/tareas        → enrutador de la API (ANTES del fallback)
7. errorHandler(4 args)  → captura errores lanzados con next(err)
8. *path fallback        → devuelve index.html para navegación client-side
```

---

## 🔌 Middlewares

### 1. `cors()` — Cross-Origin Resource Sharing

Añade las cabeceras HTTP `Access-Control-Allow-Origin` a cada respuesta.
Sin este middleware, el navegador bloquearía todas las peticiones `fetch()` al
servidor si el frontend se sirve desde un origen diferente (ej. `localhost:5500`
del Live Server llamando a `localhost:3000` de Express). En producción, se configura
con una lista blanca de orígenes: `cors({ origin: 'https://tudominio.com' })`.

### 2. `express.json()` — Deserialización del cuerpo

Parsea el cuerpo de la petición cuando el `Content-Type` es `application/json`
y lo expone en `req.body`. Sin este middleware, `req.body` sería `undefined` en
todos los endpoints `POST` y `PUT`, haciendo imposible leer `titulo` o `prioridad`.

### 3. `express.static(PASTA_FRONTEND)` — Servidor de archivos estáticos

Sirve `index.html`, `app.js`, `i18n.js`, etc. desde el sistema de archivos.
Cuando el navegador solicita `GET /app.js`, Express lo encuentra en disco y lo
devuelve con los cabeceros `Cache-Control` apropiados. Esto elimina la necesidad
de un servidor separado para el frontend durante el desarrollo.

```js
// Sube 2 niveles desde server/src/ hasta la raíz del proyecto
const PASTA_FRONTEND = path.join(__dirname, '..', '..');
app.use(express.static(PASTA_FRONTEND));
```

### 4. Middleware de error global (4 parámetros)

```js
app.use((err, req, res, next) => {
  if (err.message === 'NO_ENCONTRADO') {
    return res.status(404).json({ error: 'Tarea no encontrada.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});
```

Express identifica un middleware de errores por su **aridad de 4 parámetros**
(`err, req, res, next`). Cuando cualquier controlador llama a `next(err)`, Express
salta toda la cadena de middlewares normales y busca el primero con 4 parámetros.

Dos responsabilidades críticas:
- **Mapeo semántico:** convierte errores de dominio (`'NO_ENCONTRADO'`) en códigos HTTP correctos (`404`)
- **Seguridad:** nunca filtra trazas de pila (`stack traces`) al cliente — solo devuelve mensajes genéricos en `500`

### 5. Fallback SPA (`*path`)

```js
app.get('*path', (req, res) => {
  res.sendFile(path.join(PASTA_FRONTEND, 'index.html'));
});
```

Registrado **después** de las rutas de la API. Si una petición `GET` no coincide
con ninguna ruta registrada, Express llega aquí y devuelve `index.html`. Esto
permite que el router del frontend maneje URLs directas sin que el servidor
devuelva `404`. La sintaxis `*path` (en lugar de `*`) es requerida por Express 5,
que usa `path-to-regexp` v8 con sintaxis de parámetros nombrados obligatoria.

---

## 🌐 API REST — Referencia Completa

**Base URL:** `http://localhost:3000/api/v1`

---

### `GET /tareas`

Devuelve todas las tareas almacenadas en memoria.

**Respuesta exitosa — `200 OK`**
```json
[
  {
    "id": 1,
    "titulo": "Estudiar para el examen",
    "prioridad": "alta",
    "completada": false,
    "creadaEn": "2026-03-22T10:30:00.000Z"
  }
]
```

**Respuesta vacía — `200 OK`**
```json
[]
```

---

### `POST /tareas`

Crea una nueva tarea. El campo `titulo` es obligatorio.

**Cuerpo de la petición**
```json
{
  "titulo": "Revisar pull requests",
  "prioridad": "medium"
}
```

| Campo | Tipo | Requerido | Valores válidos |
|---|---|:-:|---|
| `titulo` | string | ✅ | Cualquier texto no vacío |
| `prioridad` | string | ❌ | `"high"` `"medium"` `"low"` `"alta"` `"media"` `"baja"` |

**Respuesta exitosa — `201 Created`**
```json
{
  "id": 2,
  "titulo": "Revisar pull requests",
  "prioridad": "media",
  "completada": false,
  "creadaEn": "2026-03-22T11:00:00.000Z"
}
```

**Error de validación — `400 Bad Request`**
```json
{
  "error": "El campo \"titulo\" es obligatorio y no puede estar vacío."
}
```

---

### `DELETE /tareas/:id`

Elimina una tarea por su ID numérico.

**Ejemplo de petición**
```
DELETE /api/v1/tareas/2
```

**Respuesta exitosa — `204 No Content`**
```
(sin cuerpo)
```

**Tarea no encontrada — `404 Not Found`**
```json
{
  "error": "Tarea no encontrada."
}
```

---

### `GET /health`

Endpoint de diagnóstico para verificar que el servidor está activo.

**Respuesta — `200 OK`**
```json
{
  "status": "OK",
  "timestamp": "2026-03-22T10:00:00.000Z"
}
```

---

## 🔗 Capa de Red del Frontend

`server/src/api/cliente.js` es el **único punto de contacto** entre la UI y el servidor.
Ningún otro archivo del frontend realiza `fetch()` directamente.

```js
const clienteApi = {
  BASE_URL: 'http://localhost:3000/api/v1',

  // Convierte prioridad del servidor al formato interno del frontend
  _normalizarPrioridad(p) { ... },

  // Mapea todos los campos del servidor al modelo del frontend
  _normalizarTarea(datos) { ... },

  // Método base: lanza Error si la respuesta no es 2xx
  async _solicitar(ruta, opciones) { ... },

  async listarTareas()       { ... },  // GET  /tareas
  async crearTarea(datos)    { ... },  // POST /tareas
  async eliminarTarea(id)    { ... },  // DELETE /tareas/:id
}
```

### Gestión de estados de red en la UI

El frontend gestiona tres estados visuales para cada operación de red:

```
cargarTareas()
      │
      ├─ 1. CARGA   → mostrarCargando() — spinner "⏳ Cargando tareas..."
      │
      ├─ 2. ÉXITO   → renderizar() — lista de tareas
      │
      └─ 3. ERROR   → mostrarError() — mensaje + botón "Intentar de nuevo"
                       visible si el servidor devuelve 4xx/5xx o no responde
```

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

El servidor imprime en consola:
```
✅ Servidor corriendo en http://localhost:3000
   Frontend → http://localhost:3000
   API      → http://localhost:3000/api/v1/tareas
```

Abre **http://localhost:3000** en el navegador. El frontend y la API se sirven
desde el mismo proceso y el mismo puerto — no se necesita Live Server ni ningún
servidor adicional.

---

## 🔐 Variables de Entorno

| Variable | Requerida | Valor por defecto | Descripción |
|---|:-:|:-:|---|
| `PORT` | ✅ | — | Puerto en el que escucha Express |
| `NODE_ENV` | ❌ | `"development"` | Entorno de ejecución |

Archivo `.env.example` (plantilla pública):
```env
PORT=3000
NODE_ENV=development
```

> ⚠️ **El archivo `.env` nunca debe subirse a Git.** Comprueba que figura en `.gitignore`.

---

## 📖 Documentación Interactiva — Swagger UI

El servidor expone una interfaz Swagger completamente funcional con la especificación **OpenAPI 3.0**.

```
http://localhost:3000/api/docs
```

Incluye:
- Descripción de cada endpoint con parámetros y tipos
- Ejemplos de request y response para todos los casos
- **"Try it out"** — ejecuta peticiones reales desde el navegador sin herramientas externas
- Tabla de normalización de prioridades frontend ↔ servidor

### Instalación de la dependencia

```bash
cd server
npm install swagger-ui-express
```

---

## 🧪 Pruebas de Integración — Thunder Client

El archivo `postman-collection.json` contiene **12 peticiones organizadas en 3 carpetas** con tests automáticos listos para importar en Postman.

### Importar la colección

1. Abre **Postman**
2. Botón **Import** (esquina superior izquierda)
3. Arrastra `postman-collection.json` o selecciónalo con el explorador
4. La colección aparece en el panel izquierdo con sus 3 carpetas

> Los tests de cada request se ejecutan automáticamente al hacer clic en **Send**. Para ejecutar toda la colección de una vez: clic derecho en la colección → **Run collection**.

### Carpetas de la colección

#### 🟢 Sistema (2 requests)
| Nombre | Método | URL | Esperado |
|---|:-:|---|:-:|
| Health Check | `GET` | `/health` | `200` |
| Swagger UI | `GET` | `/api/docs` | `200` HTML |

#### ✅ Flujo Feliz (5 requests)
| Nombre | Método | URL | Body | Esperado |
|---|:-:|---|---|:-:|
| Lista vacía | `GET` | `/api/v1/tareas` | — | `200 []` |
| Crear tarea básica | `POST` | `/api/v1/tareas` | `{"titulo":"...","prioridad":"high"}` | `201` |
| Crear sin prioridad | `POST` | `/api/v1/tareas` | `{"titulo":"..."}` | `201` prioridad=`"media"` |
| Listar con datos | `GET` | `/api/v1/tareas` | — | `200 [...]` |
| Eliminar existente | `DELETE` | `/api/v1/tareas/1` | — | `204` |

#### ❌ Errores Forzados (6 requests)
| Nombre | Escenario | Esperado |
|---|---|:-:|
| `400` — Body vacío | `POST {}` sin campo titulo | `400` |
| `400` — Título con espacios | `titulo: "   "` pasa typeof pero falla trim | `400` |
| `400` — Título null | `titulo: null` falla typeof check | `400` |
| `404` — ID inexistente | `DELETE /tareas/999` | `404` |
| `404` — ID negativo | `DELETE /tareas/-1` | `404` |
| `500` — Error interno | Requiere añadir `throw` temporal en el servicio (ver notas en la petición) | `500` |

### Cómo forzar el error 500

```js
// En server/src/services/task.service.js
// Añadir temporalmente dentro de crearTarea():
crearTarea(datos) {
  throw new Error('FALLO_SIMULADO'); // ← añadir esta línea
  // ...resto del código
}
```

Ejecuta la petición **"500 · Error interno forzado"** de Thunder Client.
El middleware global captura el error y devuelve:

```json
{ "error": "Error interno del servidor." }
```

Verifica que el body **no contiene** el stack trace — esto confirma que los detalles técnicos no se filtran al cliente. Retira el `throw` después de la prueba.

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