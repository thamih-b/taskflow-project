// ─── Configuração do Swagger / OpenAPI 3.0 ───────────────────────────────────
// Serve a documentação interativa em http://localhost:3000/api/docs
//
// Dependências necessárias (instalar no server/):
//   npm install swagger-ui-express
//
// Não é necessário swagger-jsdoc — a spec está centralizada aqui,
// evitando anotações espalhadas pelos controladores.

const swaggerUi = require('swagger-ui-express');

// ─── Especificação OpenAPI 3.0 ────────────────────────────────────────────────
const especificacion = {
  openapi: '3.0.3',
  info: {
    title: 'TaskFlow API',
    version: '1.0.0',
    description: `
## API REST para gestión de tareas

Servidor construido con **Node.js + Express** siguiendo arquitectura de tres capas:
\`routes → controller → service\`

### Normalización de prioridades

El frontend envía valores en inglés y el servidor los almacena en español:

| Frontend envía | Servidor almacena |
|:-:|:-:|
| \`high\` | \`alta\` |
| \`medium\` | \`media\` |
| \`low\` | \`baja\` |

Al devolver tareas, \`cliente.js\` invierte la conversión automáticamente.
    `,
    contact: {
      name: 'Thami B',
      url: 'https://github.com/thamih-b',
    },
    license: {
      name: 'Propietaria — uso educativo permitido',
    },
  },

  servers: [
    {
      url: 'http://localhost:3000/api/v1',
      description: 'Servidor de desarrollo local',
    },
  ],

  tags: [
    { name: 'Tareas', description: 'CRUD de tareas en memoria' },
    { name: 'Sistema',  description: 'Diagnóstico y estado del servidor' },
  ],

  // ─── Componentes reutilizables ───────────────────────────────────────────
  components: {
    schemas: {

      // Tarea tal como la devuelve el servidor
      Tarea: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1,
            description: 'Identificador numérico auto-incremental',
          },
          titulo: {
            type: 'string',
            example: 'Estudiar para el examen',
            description: 'Texto principal de la tarea',
          },
          prioridad: {
            type: 'string',
            enum: ['alta', 'media', 'baja'],
            example: 'media',
            description: 'Prioridad almacenada en español',
          },
          completada: {
            type: 'boolean',
            example: false,
          },
          creadaEn: {
            type: 'string',
            format: 'date-time',
            example: '2026-03-22T10:30:00.000Z',
            description: 'Timestamp ISO 8601 UTC de creación',
          },
        },
        required: ['id', 'titulo', 'prioridad', 'completada', 'creadaEn'],
      },

      // Body esperado en POST /tareas
      NuevaTareaInput: {
        type: 'object',
        required: ['titulo'],
        properties: {
          titulo: {
            type: 'string',
            example: 'Revisar pull requests',
            minLength: 1,
            description: 'Campo obligatorio — no puede estar vacío ni ser solo espacios',
          },
          prioridad: {
            type: 'string',
            enum: ['high', 'medium', 'low', 'alta', 'media', 'baja'],
            example: 'medium',
            default: 'medium',
            description: 'Acepta valores en inglés (frontend) o español (interno)',
          },
        },
      },

      // Respuesta de error estándar
      ErrorRespuesta: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            example: 'El campo "titulo" es obligatorio y no puede estar vacío.',
          },
        },
      },

      // Health check
      HealthRespuesta: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'OK' },
          timestamp: { type: 'string', format: 'date-time', example: '2026-03-22T10:00:00.000Z' },
        },
      },
    },
  },

  // ─── Endpoints ───────────────────────────────────────────────────────────
  paths: {

    '/tareas': {

      // GET /api/v1/tareas
      get: {
        tags: ['Tareas'],
        summary: 'Listar todas las tareas',
        description: 'Devuelve el array completo de tareas almacenadas en memoria. Devuelve `[]` si no hay ninguna.',
        responses: {
          200: {
            description: 'Lista de tareas (puede estar vacía)',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Tarea' },
                },
                examples: {
                  conTareas: {
                    summary: 'Con tareas existentes',
                    value: [
                      {
                        id: 1,
                        titulo: 'Estudiar para el examen',
                        prioridad: 'alta',
                        completada: false,
                        creadaEn: '2026-03-22T10:30:00.000Z',
                      },
                      {
                        id: 2,
                        titulo: 'Comprar leche',
                        prioridad: 'baja',
                        completada: true,
                        creadaEn: '2026-03-22T09:00:00.000Z',
                      },
                    ],
                  },
                  sinTareas: {
                    summary: 'Sin tareas (array vacío)',
                    value: [],
                  },
                },
              },
            },
          },
        },
      },

      // POST /api/v1/tareas
      post: {
        tags: ['Tareas'],
        summary: 'Crear una nueva tarea',
        description: `
Crea una tarea y la añade al array en memoria.

**Validaciones aplicadas:**
- \`titulo\` es obligatorio
- \`titulo\` no puede ser una cadena vacía o solo espacios
- Si \`prioridad\` no se envía, se asigna \`"media"\` por defecto
        `,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/NuevaTareaInput' },
              examples: {
                basico: {
                  summary: 'Solo con título',
                  value: { titulo: 'Revisar pull requests' },
                },
                completo: {
                  summary: 'Con prioridad explícita',
                  value: { titulo: 'Entregar informe', prioridad: 'high' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Tarea creada correctamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Tarea' },
                example: {
                  id: 3,
                  titulo: 'Revisar pull requests',
                  prioridad: 'media',
                  completada: false,
                  creadaEn: '2026-03-22T11:00:00.000Z',
                },
              },
            },
          },
          400: {
            description: 'El cuerpo de la petición no supera la validación',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorRespuesta' },
                examples: {
                  sinBody: {
                    summary: 'Body vacío o sin campo titulo',
                    value: { error: 'El campo "titulo" es obligatorio y no puede estar vacío.' },
                  },
                  tituloVacio: {
                    summary: 'titulo con solo espacios',
                    value: { error: 'El campo "titulo" es obligatorio y no puede estar vacío.' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/tareas/{id}': {

      // DELETE /api/v1/tareas/:id
      delete: {
        tags: ['Tareas'],
        summary: 'Eliminar una tarea por ID',
        description: 'Elimina la tarea con el ID indicado. Devuelve `204` sin cuerpo si tiene éxito.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', example: 1 },
            description: 'ID numérico de la tarea a eliminar',
          },
        ],
        responses: {
          204: {
            description: 'Tarea eliminada correctamente (sin cuerpo en la respuesta)',
          },
          404: {
            description: 'No existe ninguna tarea con ese ID',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorRespuesta' },
                example: { error: 'Tarea no encontrada.' },
              },
            },
          },
        },
      },
    },

    // ─── Health check (fuera del prefijo /api/v1) ─────────────────────────
    // Nota: este endpoint se sirve en /health, no en /api/v1/health
    // Se documenta aquí para referencia pero la URL real es http://localhost:3000/health
  },
};

// ─── Opciones de la UI de Swagger ─────────────────────────────────────────────
const opcionesUI = {
  customSiteTitle: 'TaskFlow API Docs',
  customCss: `
    .swagger-ui .topbar { background-color: #1c1917; }
    .swagger-ui .topbar-wrapper img { content: url(''); }
    .swagger-ui .topbar-wrapper::before {
      content: '📓 TaskFlow API';
      color: #fbbf24;
      font-size: 1.2rem;
      font-weight: bold;
      padding-left: 1rem;
    }
  `,
  swaggerOptions: {
    // Expande el primer tag al abrir la documentación
    docExpansion: 'list',
    // Muestra el tiempo de respuesta en las pruebas en vivo
    requestInterceptor: (req) => req,
  },
};

module.exports = { swaggerUi, especificacion, opcionesUI };