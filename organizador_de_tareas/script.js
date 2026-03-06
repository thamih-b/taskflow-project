// =============================
// 🌙 DARK MODE
// =============================

let isDark =
  localStorage.getItem("theme") === "dark" ||
  (!localStorage.getItem("theme") &&
    window.matchMedia("(prefers-color-scheme: dark)").matches);

document.documentElement.classList.toggle("dark", isDark);

function toggleDarkMode() {

  const html = document.documentElement;
  const dark = html.classList.toggle("dark");

  document.getElementById("sunIcon")?.classList.toggle("hidden", dark);
  document.getElementById("moonIcon")?.classList.toggle("hidden", !dark);

  localStorage.setItem("theme", dark ? "dark" : "light");

}



// =============================
// 📦 STORAGE
// =============================

let tarefas = [];

function loadTasks() {

  const saved = localStorage.getItem("tareas");
  return saved ? JSON.parse(saved) : [];

}

function saveTasks() {

  localStorage.setItem("tareas", JSON.stringify(tarefas));

}



// =============================
// 🏷 CATEGORIAS
// =============================

function getUniqueCategories() {

  const cats = tarefas.map(t => t.category || "Geral");
  return ["all", ...new Set(cats)];

}



// =============================
// 🏷 RENDER CATEGORY FILTERS
// =============================

function renderCategoryFilters() {

  const container = document.getElementById("categoryFilterContainer");
  if (!container) return;

  const categories = getUniqueCategories();

  let html = "";

  categories.forEach(cat => {

    if (cat === "all") {

      html += `
      <button class="cat-filter-btn active text-xs px-3 py-1.5 rounded-full border border-amber-900/40 bg-amber-100/80 dark:bg-amber-700/70 text-inksoft dark:text-amber-50 shadow-sm hover:bg-amber-200 transition"
      data-category="all">
      Todas
      </button>`;

    } else {

      html += `
      <button class="cat-filter-btn text-xs px-3 py-1.5 rounded-full border border-blue-400/50 bg-blue-50/70 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-800/50 transition"
      data-category="${cat}">
      ${cat}
      </button>`;

    }

  });

  container.innerHTML = html;

}



// =============================
// 📋 RENDER TASKS
// =============================

function renderTasks() {

  const section = document.querySelector('section[aria-label="Lista de tarefas"]');
  const h2 = section?.querySelector("h2");

  if (!section || !h2) return;

  section.querySelectorAll("article").forEach(a => a.remove());

  tarefas.forEach(tarea => {

    const taskId =
      "task_" +
      Date.now() +
      "_" +
      Math.random().toString(36).substring(2);

    const html = `
<article class="priority-${tarea.priority} ${tarea.completed ? "completed" : ""}">

<div class="task-header">

<div class="task-checkbox">
<input type="checkbox" id="${taskId}" class="task-check-input"
${tarea.completed ? "checked" : ""}>
<label for="${taskId}" class="task-check-label"></label>
</div>

<h3>${tarea.text}</h3>

<select class="priority-select">

<option value="high" ${tarea.priority === "high" ? "selected" : ""}>Alta</option>
<option value="medium" ${tarea.priority === "medium" ? "selected" : ""}>Media</option>
<option value="low" ${tarea.priority === "low" ? "selected" : ""}>Baja</option>

</select>

<span class="priority-badge">
${{ high: "Alta", medium: "Media", low: "Baja" }[tarea.priority]}
</span>

<button class="delete-btn">×</button>

</div>

<p>Categoria: <strong>${tarea.category}</strong></p>

</article>
`;

    h2.insertAdjacentHTML("afterend", html);

  });

  renderCategoryFilters();

}



// =============================
// 🗑 DELETE TASK
// =============================

function deleteTask(article) {

  const text = article.querySelector("h3")?.textContent;

  tarefas = tarefas.filter(t => t.text !== text);

  article.remove();

  saveTasks();

}



// =============================
// ➕ ADD TASK
// =============================

function addTask() {

  const taskInput = document.getElementById("newTaskInput");
  const catInput = document.getElementById("newCategoryInput");

  const text = taskInput.value.trim();
  const category = catInput.value.trim() || "Geral";

  if (!text) {

    alert("Escriba el nombre de la tarea");
    return;

  }

  tarefas.push({

    text,
    category,
    priority: "medium",
    completed: false

  });

  saveTasks();

  taskInput.value = "";
  catInput.value = "";

  renderTasks();

}



// =============================
// 🔎 SEARCH
// =============================

function setupSearch() {

  const search = document.getElementById("searchInput");

  if (!search) return;

  search.addEventListener("input", e => {

    const term = e.target.value.toLowerCase();

    document.querySelectorAll("article").forEach(article => {

      const text =
        article.querySelector("h3")?.textContent.toLowerCase() || "";

      const cat =
        article.querySelector("p")?.textContent.toLowerCase() || "";

      const match = text.includes(term) || cat.includes(term);

      article.style.display = match ? "flex" : "none";

    });

  });

}



// =============================
// 🎯 EVENT DELEGATION
// =============================

document.addEventListener("change", e => {

  const article = e.target.closest("article");
  if (!article) return;

  const text = article.querySelector("h3").textContent;

  const task = tarefas.find(t => t.text === text);

  if (!task) return;

  if (e.target.classList.contains("task-check-input")) {

    task.completed = e.target.checked;
    article.classList.toggle("completed", task.completed);

  }

  if (e.target.classList.contains("priority-select")) {

    task.priority = e.target.value;

    article.classList.remove(
      "priority-high",
      "priority-medium",
      "priority-low"
    );

    article.classList.add(`priority-${task.priority}`);

    article.querySelector(".priority-badge").textContent =
      { high: "Alta", medium: "Media", low: "Baja" }[task.priority];

  }

  saveTasks();

});



// =============================
// 🗑 DELETE BUTTON
// =============================

document.addEventListener("click", e => {

  if (e.target.classList.contains("delete-btn")) {

    if (confirm("Exterminar la tarea?")) {

      deleteTask(e.target.closest("article"));

    }

  }

});



// =============================
// 🎛 CATEGORY FILTER
// =============================

document.addEventListener("click", e => {

  if (!e.target.classList.contains("cat-filter-btn")) return;

  const cat = e.target.dataset.category;

  document.querySelectorAll(".cat-filter-btn")
  .forEach(b => b.classList.remove("active"));

  e.target.classList.add("active");

  document.querySelectorAll("article").forEach(article => {

    const articleCat =
      article.querySelector("p strong")?.textContent || "";

    if (cat === "all" || articleCat === cat) {

      article.style.display = "flex";

    } else {

      article.style.display = "none";

    }

  });

});



// =============================
// 🚀 INIT
// =============================

document.addEventListener("DOMContentLoaded", () => {

  tarefas = loadTasks();

  renderTasks();

  setupSearch();

  document
    .querySelector(".add-btn")
    ?.addEventListener("click", addTask);

});