// ===== FUNÇÕES GLOBAIS =====
let tarefas = [];  // Array global UNIFICADO

function loadTasks() {
  const saved = localStorage.getItem("tareas");
  return saved ? JSON.parse(saved) : [];
}

function saveTasks(tasks) {
  localStorage.setItem("tareas", JSON.stringify(tasks));
}

function saveTaskDeletion() {
  const section = document.querySelector('section[aria-label="Lista de tarefas"]');
  const articles = section ? section.querySelectorAll('article') : [];

  tarefas = [];
  articles.forEach((article, i) => {

    tarefas.push({
      text: article.querySelector('h3')?.textContent || 'Sem título',
      category: article.querySelector('p')?.textContent?.replace('Categoria: ', '') || 'Geral',
      priority: article.querySelector('.priority-select')?.value || 'medium',
      completed: article.querySelector('.task-check-input')?.checked || false
    });
  });
  
  const json = JSON.stringify(tarefas);
  localStorage.setItem('tareas', json);
}

function renderTasks() {
  
  const section = document.querySelector('section[aria-label="Lista de tarefas"]');
  const h2 = section?.querySelector('h2');
  
  // Limpa tasks antigas
  section.querySelectorAll('article').forEach(article => article.remove());
  
  // Renderiza tasks salvas
  tarefas.forEach(tarea => {
    const taskId = 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const newTask = `
      <article class="priority-${tarea.priority || 'medium'} ${tarea.completed ? 'completed' : ''}">
        <div class="task-header">
          <div class="task-checkbox">
            <input type="checkbox" id="${taskId}" class="task-check-input" ${tarea.completed ? 'checked' : ''}>
            <label for="${taskId}" class="task-check-label"></label>
          </div>
          <h3>${tarea.text}</h3>
          <select class="priority-select">
            <option value="high" ${tarea.priority === 'high' ? 'selected' : ''}>Alta</option>
            <option value="medium" ${tarea.priority === 'medium' ? 'selected' : ''}>Media</option>
            <option value="low" ${tarea.priority === 'low' ? 'selected' : ''}>Baja</option>
          </select>
          <span class="priority-badge">${{high:'Alta',medium:'Media',low:'Baja'}[tarea.priority] || 'Media'}</span>
          <button class="delete-btn" onclick="deleteTask(this)">×</button>
        </div>
        <p>Categoria: <strong>${tarea.category || 'Geral'}</strong></p>
      </article>
    `;
    h2.insertAdjacentHTML('afterend', newTask);
  });
}

function deleteTask(btn) {
  if (confirm("Exterminar la tarea?")) {
    btn.closest("article").remove();
    saveTaskDeletion();
  }
}

// ===== EVENT DELEGATION (funciona com novas tasks) =====
document.addEventListener('DOMContentLoaded', function() {
  tarefas = loadTasks();
  renderTasks();
  
  // Checkbox + Priority (event delegation)
  document.addEventListener('change', function(e) {
    const article = e.target.closest('article');
    if (!article) return;
    
    if (e.target.classList.contains('task-check-input')) {
      article.classList.toggle('completed', e.target.checked);
      saveTaskDeletion();  // Persiste
    } else if (e.target.classList.contains('priority-select')) {
      article.classList.remove('priority-high', 'priority-medium', 'priority-low');
      article.classList.add(`priority-${e.target.value}`);
      const badge = article.querySelector('.priority-badge');
      const labels = { high: 'Alta', medium: 'Media', low: 'Baja' };
      badge.textContent = labels[e.target.value];
      saveTaskDeletion();  // Persiste
    }
  });
  
   // Filtros
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      const filter = e.target.dataset.filter;
      document.querySelectorAll("article").forEach(task => {
        task.style.display = "none";
        if (filter === "all") {
          task.style.display = "flex";
        } else if (filter === "high" && task.classList.contains("priority-high")) {
          task.style.display = "flex";
        } else if (filter === "medium" && task.classList.contains("priority-medium")) {
          task.style.display = "flex";
        } else if (filter === "low" && task.classList.contains("priority-low")) {
          task.style.display = "flex";
        } else if (filter === "completed" && task.classList.contains("completed")) {
          task.style.display = "flex";
        }
      });
    });
  });
});

// Filtro busca SIMPLIFICADO (no FINAL do script.js)
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  
  if (!searchInput) {
    console.error('❌ #searchInput não encontrado!');
    return;
  }
  
  console.log('✅ Search input pronto!');
  
  // Remove listeners antigos (evita conflito)
  searchInput.oninput = null;
  searchInput.onkeyup = null;
  
  // Listener SIMPLES
  searchInput.addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase().trim();
    console.log('🔍 Buscando:', termo);  // Debug
    
    document.querySelectorAll('article').forEach(article => {
      const h3 = article.querySelector('h3')?.textContent.toLowerCase() || '';
      const p = article.querySelector('p')?.textContent.toLowerCase() || '';
      const match = h3.includes(termo) || p.includes(termo);
      article.style.display = match ? 'flex' : 'none';
    });
  });
  
  // Força foco inicial
  searchInput.focus();
});


// ===== ADD TAREFA (HTML direto + bind automático via delegation) =====
document.querySelector(".add-btn")?.addEventListener("click", () => {
  const taskInput = document.getElementById("newTaskInput");
  const categoryInput = document.getElementById("newCategoryInput");
  const taskText = taskInput?.value.trim();
  const categoryText = categoryInput?.value.trim() || "Geral";

  if (!taskText) {
    alert("Escriba el nombre de la tarea!");
    taskInput?.focus();
    return;
  }

  const taskId = "task" + Date.now();
  const newTask = `
    <article class="priority-medium">
      <div class="task-header">
        <div class="task-checkbox">
          <input type="checkbox" id="${taskId}" class="task-check-input">
          <label for="${taskId}" class="task-check-label"></label>
        </div>
        <h3>${taskText}</h3>
        <select class="priority-select">
          <option value="high">Alta</option>
          <option value="medium" selected>Media</option>
          <option value="low">Baja</option>
        </select>
        <span class="priority-badge">Media</span>
        <button class="delete-btn" onclick="deleteTask(this)">×</button>
      </div>
      <p>Categoria: <strong>${categoryText}</strong></p>
    </article>
  `;

  const h2Title = document.querySelector('section[aria-label="Lista de tarefas"] h2');
  h2Title?.insertAdjacentHTML("afterend", newTask);

  taskInput.value = "";
  categoryInput.value = "";
  taskInput?.focus();
  
  saveTaskDeletion();  // Salva nova task
});