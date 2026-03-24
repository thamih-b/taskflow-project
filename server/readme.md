# 🖥 TaskFlow — Servidor Node.js + Express

Documentación técnica del backend de TaskFlow.  
← Volver al proyecto principal: [`../README.md`](../README.md)

---

## 📑 Tabla de Contenidos

1. [Infraestructura del Servidor](#-infraestructura-del-servidor)
2. [Middlewares](#-middlewares)
3. [Modelo de Datos](#-modelo-de-datos)
4. [API REST — Referencia Completa](#-api-rest--referencia-completa)
5. [Capa de Red del Frontend](#-capa-de-red-del-frontend)
6. [Documentación Swagger](#-documentación-interactiva--swagger-ui)
7. [Pruebas de Integración](#-pruebas-de-integración--thunder-client)

---

## 🏗 Infraestructura del Servidor

### Estructura de carpetas
```text
server/
├── .env
├── .env.example
├── package.json
└── src/
    ├── index.js
    ├── config/
    │   └── env.js
    ├── routes/
    │   └── task.routes.js
    ├── controllers/
    │   └── task.controller.js
    ├── services/
    │   └── task.service.js
    └── api/
        └── cliente.js
```

### Separación de responsabilidades
```text
Petición HTTP
│
▼
┌─────────────┐ ┌──────────────┐
│ Routes │──── extrae parámetros ─────▶│ Controller │
│ │ valida inputs │ │
│ │◀─── devuelve respuesta ──────│ │
└─────────────┘ └──────┬───────┘
│ llama métodos puros
▼
┌──────────────────┐
│ Service │
│ Lógica de │
│ negocio pura │
│ sin HTTP │
└──────────────────┘
```

Cada capa tiene **una única razón para cambiar**:
- Si cambia el protocolo (REST → GraphQL) → solo `routes` y `controller`
- Si cambia la lógica de negocio → solo `service`
- Si cambia la base de datos → solo `service`

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

Si el servidor arranca sin `PORT`, el proceso aborta **antes de inicializar Express**
con un mensaje claro — equivalente a un *fail-fast* de sistemas críticos.

### `src/index.js` — Orden de middlewares
cors() → permite peticiones cross-origin

express.json() → parsea body con Content-Type: application/json

express.urlencoded() → parsea body con Content-Type: application/x-www-form-urlencoded

express.static() → sirve los archivos del frontend (solo en desarrollo)

/health → endpoint de diagnóstico sin autenticación

/api/docs → Swagger UI

/api/v1/tareas → enrutador de la API (ANTES del fallback)

errorHandler(4 args) → captura errores lanzados con next(err)

*path fallback → devuelve index.html para navegación client-side


---

## 🔌 Middlewares

### 1. `cors()`

Añade las cabeceras `Access-Control-Allow-Origin` a cada respuesta.
Sin este middleware el navegador bloquearía todas las peticiones `fetch()` al
servidor cuando el frontend se sirve desde un origen diferente
(ej. `localhost:5500` → `localhost:3000`).

### 2. `express.json()`

Parsea el cuerpo cuando el `Content-Type` es `application/json` y lo expone
en `req.body`. Sin él, `req.body` sería `undefined` en todos los `POST` y `PUT`.

### 3. `express.static(PASTA_FRONTEND)`

```js
// Sube 2 niveles desde server/src/ hasta la raíz del proyecto
const PASTA_FRONTEND = path.join(__dirname, '..', '..');
app.use(express.static(PASTA_FRONTEND));
```

Sirve `index.html`, `app.js`, `i18n.js`, etc. desde el sistema de archivos.
Solo activo en desarrollo — en producción (Vercel) los estáticos los sirve la CDN.

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

Express identifica un middleware de errores por su **aridad de 4 parámetros**.
Responsabilidades:
- **Mapeo semántico:** convierte errores de dominio en códigos HTTP correctos
- **Seguridad:** nunca filtra stack traces al cliente

### 5. Fallback SPA (`*path`)

```js
app.get('*path', (req, res) => {
  res.sendFile(path.join(PASTA_FRONTEND, 'index.html'));
});
```

Registrado **después** de las rutas de la API. La sintaxis `*path` (en lugar de `*`)
es requerida por Express 5 con `path-to-regexp` v8.

---

## 📐 Modelo de Datos

### Tarea (servidor)

```js
{
  id:         number,   // Auto-incremental
  titulo:     string,
  prioridad:  "alta" | "media" | "baja",
  completada: boolean,
  creadaEn:   string,   // ISO 8601 UTC
}
```

### Tarea (frontend — tras normalización por `cliente.js`)

```js
{
  id:                string,
  text:              string,
  priority:          "high" | "medium" | "low",
  completed:         boolean,
  category:          string,
  subtasks:          Subtask[],
  due_date?:         string,
  due_date_has_time?: boolean,
  due_date_end?:     string,
}
```

### Tabla de normalización de prioridades

| Frontend envía | Servidor guarda | Frontend recibe | Frontend muestra |
|:-:|:-:|:-:|:-:|
| `"high"` | `"alta"` | `"high"` | 🔴 Alta |
| `"medium"` | `"media"` | `"medium"` | 🟠 Media |
| `"low"` | `"baja"` | `"low"` | 🟢 Baja |

La normalización ocurre en dos puntos:
- **`task.controller.js`** al recibir del frontend → `medium → media`
- **`cliente.js`** al recibir del servidor → `media → medium`

---

## 🌐 API REST — Referencia Completa

**Base URL:** `http://localhost:3000/api/v1`

---

### `GET /tareas` — Listar todas las tareas

Devuelve todas las tareas almacenadas en memoria.

**Petición**
```bash
curl http://localhost:3000/api/v1/tareas
```

**Lo que el usuario ve en terminal — lista con datos**
```json
[
  {
    "id": 1,
    "titulo": "Estudiar para el examen",
    "prioridad": "alta",
    "completada": false,
    "creadaEn": "2026-03-22T10:30:00.000Z"
  },
  {
    "id": 2,
    "titulo": "Revisar pull requests",
    "prioridad": "media",
    "completada": false,
    "creadaEn": "2026-03-22T11:00:00.000Z"
  }
]
```

**Lo que el usuario ve — lista vacía (servidor recién arrancado)**
```json
[]
```

---

### `POST /tareas` — Crear una tarea

El campo `titulo` es obligatorio.

| Campo | Tipo | Requerido | Valores válidos |
|---|---|:-:|---|
| `titulo` | string | ✅ | Cualquier texto no vacío |
| `prioridad` | string | ❌ | `"high"` `"medium"` `"low"` `"alta"` `"media"` `"baja"` |

**Petición — caso correcto**
```bash
curl -X POST http://localhost:3000/api/v1/tareas \
  -H "Content-Type: application/json" \
  -d '{"titulo": "Revisar pull requests", "prioridad": "high"}'
```

**Lo que el usuario ve — `201 Created`**
```json
{
  "id": 1,
  "titulo": "Revisar pull requests",
  "prioridad": "alta",
  "completada": false,
  "creadaEn": "2026-03-22T11:00:00.000Z"
}
```

> 💡 Nota: el usuario envía `"high"` y el servidor guarda `"alta"` — la normalización ocurre en el controlador.

**Petición — sin título**
```bash
curl -X POST http://localhost:3000/api/v1/tareas \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Lo que el usuario ve — `400 Bad Request`**
```json
{
  "error": "El campo \"titulo\" es obligatorio y no puede estar vacío."
}
```

**Petición — título con solo espacios**
```bash
curl -X POST http://localhost:3000/api/v1/tareas \
  -H "Content-Type: application/json" \
  -d '{"titulo": "   "}'
```

**Lo que el usuario ve — `400 Bad Request`**
```json
{
  "error": "El campo \"titulo\" es obligatorio y no puede estar vacío."
}
```

---

### `DELETE /tareas/:id` — Eliminar una tarea

**Petición — tarea existente**
```bash
curl -X DELETE http://localhost:3000/api/v1/tareas/1
```

**Lo que el usuario ve — `204 No Content`**
```bash
# Sin cuerpo en la respuesta — el silencio confirma el éxito
```

**Petición — ID que no existe**
```bash
curl -X DELETE http://localhost:3000/api/v1/tareas/999
```

**Lo que el usuario ve — `404 Not Found`**
```json
{
  "error": "Tarea no encontrada."
}
```

---

### `GET /health` — Estado del servidor

Útil para verificar que el servidor está activo antes de hacer otras peticiones.

**Petición**
```bash
curl http://localhost:3000/health
```

**Lo que el usuario ve — `200 OK`**
```json
{
  "status": "OK",
  "timestamp": "2026-03-22T10:00:00.000Z"
}
```

---

## 🔗 Capa de Red del Frontend

`server/src/api/cliente.js` es el **único punto de contacto** entre la UI y el servidor.

```js
const clienteApi = {
  BASE_URL: 'http://localhost:3000/api/v1',
  _normalizarPrioridad(p) { ... },
  _normalizarTarea(datos)  { ... },
  async _solicitar(ruta, opciones) { ... },
  async listarTareas()    { ... },  // GET    /tareas
  async crearTarea(datos) { ... },  // POST   /tareas
  async eliminarTarea(id) { ... },  // DELETE /tareas/:id
}
```

### Estados de red en la UI
cargarTareas()
│
├─ 1. CARGA → mostrarCargando() — "⏳ Cargando tareas..."
├─ 2. ÉXITO → renderizar()
└─ 3. ERROR → mostrarError() + botón "Intentar de nuevo"

---

## 📖 Documentación Interactiva — Swagger UI
http://localhost:3000/api/docs


Incluye descripción de cada endpoint, ejemplos de request/response y **"Try it out"**
para ejecutar peticiones reales desde el navegador.

```bash
cd server
npm install swagger-ui-express
```

---

## 🧪 Pruebas de Integración — Thunder Client

El archivo `postman-collection.json` contiene **12 peticiones en 3 carpetas**.

### 🟢 Sistema (2 requests)
| Nombre | Método | Esperado |
|---|:-:|:-:|
| Health Check | `GET` | `200` |
| Swagger UI | `GET` | `200` HTML |

### ✅ Flujo Feliz (5 requests)
| Nombre | Método | Esperado |
|---|:-:|:-:|
| Lista vacía | `GET` | `200 []` |
| Crear tarea básica | `POST` | `201` |
| Crear sin prioridad | `POST` | `201` prioridad=`"media"` |
| Listar con datos | `GET` | `200 [...]` |
| Eliminar existente | `DELETE` | `204` |

### ❌ Errores Forzados (5 requests)
| Escenario | Esperado |
|---|:-:|
| Body vacío | `400` |
| Título con espacios | `400` |
| Título null | `400` |
| ID inexistente | `404` |
| ID negativo | `404` |

### Cómo forzar el error 500

```js
// En task.service.js — añadir temporalmente:
crearTarea(datos) {
  throw new Error('FALLO_SIMULADO'); // ← retirar después de la prueba
  // ...
}
```

Verifica que el body **no contiene** el stack trace — confirma que los detalles
técnicos no se filtran al cliente.