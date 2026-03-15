
## 📖 Usage Examples

### Creating a manual task

1. Type the task title in the main input field.
2. Select a category from the dropdown (or type a new one).
3. Choose priority: **Alta / Media / Baja**.
4. *(Optional)* Add one or more subtasks by typing in the subtask field and pressing `+` or `Enter`. Chips appear below — remove any before saving.
5. *(Optional)* Set a deadline date. Leave the time field empty to default to **23:59** on that day; fill it in for an exact deadline.
6. Click **Agregar** (or press `Enter` in the title field).

### Using Smart Tasks (AI-powered)

```
Input:  "Reunião de trabalho na sexta-feira às 10h e entregar relatório até quinta"

Result: Two tasks detected:
  ├── "Reunião de trabalho"   · Timebox  · Friday 10:00
  └── "Entregar relatório"   · Deadline · Thursday 23:59
```

**Workflow:**
1. Switch to the 🧠 **Tareas inteligentes** tab.
2. Enter your Anthropic API key (stored locally, never sent to third parties).
3. Type a sentence — the AI handles date resolution, priority, and category detection.
4. Review the **preview modal**: edit any field, add/remove subtasks, adjust dates/times.
5. Click **✅ Confirmar y agregar** to save all detected tasks at once.

**Example prompts:**
- `"Comprar leite, pão e ovos amanhã às 9h, prioridade baixa"` → shopping task with deadline
- `"Estudar inglês das 14h às 15h30 e revisar exercícios até domingo"` → timebox + deadline
- `"Médico na segunda às 8h30"` → health category, exact time
- `"Entregar TCC até o fim do mês, urgente"` → studies category, high priority

### Filtering by calendar day

Click any day in the sidebar calendar that has colored dots.  
The main task list instantly filters to show only tasks with a deadline on that day.  
Click the same day again (or the **✕ Limpiar filtro** badge) to reset.

### Editing tasks

- **Double-click** the task title to edit it inline via a prompt.
- **Double-click** the category name (`📓 ...`) to rename the category.
- **Double-click** any subtask label to edit it.
- Click the priority badge to open a native `<select>` and change priority instantly.

---

## ⚙️ Configuration

All user preferences are stored in **localStorage** under these keys:

| Key | Type | Description |
|---|---|---|
| `organizator-tasks` | JSON array | All tasks and subtasks |
| `organizator-lang` | `"es"` \| `"pt"` \| `"en"` | Active language |
| `theme` | `"light"` \| `"dark"` | UI theme |
| `organizator-active-tab` | `"manual"` \| `"smart"` | Last active tab |
| `organizator-api-key` | string | Anthropic API key (optional) |

---

## 🏗 Architecture

The entire application logic lives in a single class, `OrganizadorDeTareas`, instantiated once as `organizator` (global alias). HTML `onclick` attributes call methods directly on this global, keeping the template layer simple.

### Data model

```js
// Task
{
  id:                string,   // Date.now().toString()
  text:              string,   // Task title
  category:          string,   // e.g. "Compras", "Trabalho", "General"
  priority:          "high" | "medium" | "low",
  completed:         boolean,
  subtasks:          Subtask[],
  due_date?:         string,   // ISO 8601 UTC string
  due_date_has_time?: boolean, // true = user set explicit time; false = 23:59 default
  due_date_end?:     string,   // ISO 8601 UTC — end time for Timebox tasks
}

// Subtask
{
  id:        string,
  text:      string,
  completed: boolean,
}
```

---

## 📚 Function Reference

### `OrganizadorDeTareas`

#### Initialisation

| Method | Description |
|---|---|
| `constructor()` | Loads persisted data, sets default state, calls `init()` |
| `init()` | Loads theme, applies translations, renders calendar, binds events, sets active tab to `'manual'` |

#### i18n

| Method | Params | Description |
|---|---|---|
| `t(key)` | `key: string` | Returns the translated string for the current language |
| `setLanguage(lang)` | `lang: 'es' \| 'pt' \| 'en'` | Saves language, re-applies all translations, re-renders |
| `applyTranslations()` | — | Updates all `[data-i18n]` elements, placeholders, select options, icons |

#### Date / Time utilities

| Method | Params | Returns | Description |
|---|---|---|---|
| `buildDueDate(dateStr, timeStr)` | `dateStr: 'YYYY-MM-DD'`, `timeStr: 'HH:mm' \| ''` | `{iso, hasTime}` or `null` | Builds an ISO string from separate date + optional time fields. Defaults to 23:59 if time is empty |
| `parseAIDateToISO(aiDateStr)` | `aiDateStr: 'YYYY-MM-DD HH:mm'` | ISO string | Converts AI-returned datetime string to UTC ISO |
| `formatDueDate(task)` | `task: Task` | Formatted string | Displays date only or date+time depending on `due_date_has_time`; appends end time for Timebox |
| `getLocalDay(isoStr)` | `isoStr: string` | `{year, month, day}` | Converts UTC ISO to a local calendar day object in the user's timezone |
| `isUrgent(task)` | `task: Task` | boolean | `true` if deadline is between now and +24 h |
| `isOverdue(task)` | `task: Task` | boolean | `true` if deadline has passed and task is not completed |

#### Task CRUD

| Method | Params | Description |
|---|---|---|
| `addTask()` | — | Reads form inputs, validates, creates task, resets form |
| `editTask(id)` | `id: string` | Opens a `prompt()` pre-filled with current title |
| `editCategory(id)` | `id: string` | Opens a `prompt()` pre-filled with current category |
| `deleteTask(id)` | `id: string` | Confirms, removes task, cleans up selection/expand sets |
| `toggleTask(taskId)` | `taskId: string` | Toggles `completed`; syncs all subtasks to same state |
| `updatePriority(id, p)` | `id: string`, `p: 'high'|'medium'|'low'` | Updates priority without opening any dialog |
| `reorderTasks(dId, tId)` | dragged/target IDs | Moves dragged task to target position in array |
| `setTaskDueDate(taskId, dateStr, timeStr)` | — | Updates `due_date` + `due_date_has_time` for a task |
| `removeTaskDueDate(taskId)` | `taskId: string` | Deletes all deadline fields from the task |

#### Subtask methods

| Method | Params | Description |
|---|---|---|
| `addSubtask(taskId)` | `taskId: string` | Reads the inline input and appends a new subtask |
| `toggleSubtask(taskId, subtaskId)` | — | Toggles subtask; auto-syncs parent `completed` |
| `editSubtask(taskId, subtaskId)` | — | Opens a `prompt()` (triggered by double-click) |
| `deleteSubtask(taskId, subtaskId)` | — | Confirms and removes the subtask |
| `toggleSubtaskPanel(taskId)` | `taskId: string` | Opens/closes the animated subtask accordion |
| `addPendingSubtask()` | — | Adds a chip to the manual-form pending subtask list |
| `removePendingSubtask(idx)` | `idx: number` | Removes chip by index from pending list |
| `renderPendingSubtasks()` | — | Re-renders the chip row below the subtask input |

#### Smart Task (AI)

| Method | Params | Description |
|---|---|---|
| `executeSmartTask()` | — | Reads API key + prompt, calls Anthropic API, parses JSON response, populates `smartPreviewTasks`, opens modal |
| `openSmartPreviewModal()` | — | Renders the full preview modal with editable fields for each detected task |
| `confirmSmartTask()` | — | Reads all modal fields, creates tasks, inserts into list, navigates calendar |
| `cancelSmartPreview()` | — | Closes modal, clears preview state, restores scroll |
| `addPreviewSubtask(taskIdx)` | `taskIdx: number` | Adds subtask to the preview task at given index |
| `removePreviewSubtask(taskIdx, subIdx)` | — | Removes subtask from preview |
| `removePreviewTask(idx)` | `idx: number` | Removes an entire task card from preview |
| `addEmptyPreviewTask()` | — | Adds a blank task card to preview |
| `detectCategory(text)` | `text: string` | Returns category string based on keyword matching |
| `saveApiKey(key)` | `key: string` | Saves API key to localStorage |
| `loadApiKey()` | — | Returns saved API key or empty string |

#### Calendar

| Method | Params | Description |
|---|---|---|
| `renderCalendar()` | — | Builds the monthly grid with per-day task dots (green/orange/red) |
| `navigateCalendar(dir)` | `dir: 1 \| -1` | Moves the calendar forward or back one month |
| `setCalendarDayFilter(year, month, day)` | — | Activates (or toggles off) the day filter |
| `clearCalendarDayFilter()` | — | Resets the day filter, re-renders task list |
| `updateCalendarFilterBadge()` | — | Shows/hides the active-day badge above the task list |

#### Rendering

| Method | Description |
|---|---|
| `render()` | Main render: filters tasks, sorts if needed, builds all task cards |
| `renderStatusFilters()` | Rebuilds status filter pill buttons in the sidebar |
| `renderCategoryFilters()` | Rebuilds category filter chips + populates category `<select>` |
| `updateBulkActionUI()` | Updates text on the Select All / Complete / Delete bulk buttons |
| `generateTaskHTML(task)` | Returns the full article HTML string for one task |
| `buildDeadlineHTML(task)` | Returns the deadline row HTML (date/time inputs + badge) |
| `buildSubtaskListHTML(task)` | Returns the subtask row HTML for all subtasks |
| `buildProgressHTML(prog)` | Returns the progress bar HTML given `{done, total, pct}` |

#### Bulk actions

| Method | Description |
|---|---|
| `toggleSelectAll()` | Selects all visible tasks, or deselects all if already all selected |
| `executeCompleteAction()` | Marks selected (or all visible) tasks complete/pending; syncs subtasks |
| `executeDeleteAction()` | Deletes selected tasks, or deletes all completed tasks if none selected |

#### Filters

| Method | Description |
|---|---|
| `matchesFilter(task)` | Returns `true` if the task passes all active filters (search, status, category, calendar day) |
| `toggleSortByDeadline()` | Toggles sort-by-deadline mode; disables drag & drop while active |

---

## 🌐 Internationalisation

Add a new language by extending `I18N` in `i18n.js` and adding an entry to `LANG_META`:

```js
// i18n.js
const I18N = {
  // existing: es, pt, en
  fr: {
    appTitle: 'Organisateur de Tâches',
    // ... all keys
  }
};

const LANG_META = {
  // existing entries
  fr: { flag: '🇫🇷', code: 'FR' }
};
```

Then add a button to the language dropdown in `index.html`.

---

## 🤖 Smart Tasks — AI Prompt

The system prompt injected into Claude Sonnet follows a strict JSON-only contract:

```
Input:  natural language sentence (any supported language)
Output: {"tarefas": [{"tarefa": "...", "tipo": "Deadline|Timebox", "start": "YYYY-MM-DD HH:mm|null", "end": "..."}]}
```

Today's date is injected at runtime using `Intl.DateTimeFormat` in the user's locale and timezone, so relative expressions like *"amanhã"*, *"próxima sexta"*, *"em dois dias"* are resolved correctly regardless of the user's location.

---

## 🔒 Privacy

- All task data lives in **your browser's localStorage only**.
- The Anthropic API key is stored in localStorage and sent **only** to `api.anthropic.com` via HTTPS — never to any other server.
- No analytics, no tracking, no telemetry.

---

## 📄 License

MIT — free to use, modify, and distribute.
