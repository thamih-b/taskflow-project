// Toggle checkbox e completed
document.querySelectorAll('.task-check-input').forEach(cb => {
  cb.addEventListener('change', (e) => {
    const task = e.target.closest('article');
    task.classList.toggle('completed', e.target.checked);
  });
});

// Mudança de prioridade
document.querySelectorAll('.priority-select').forEach(select => {
  select.addEventListener('change', (e) => {
    const task = e.target.closest('article');
    task.className = `priority-${e.target.value}` + (task.classList.contains('completed') ? ' completed' : '');
    // Atualiza badge texto (opcional)
    const badge = task.querySelector('.priority-badge');
    const labels = {high: 'Alta', medium: 'Media', low: 'Baja'};
    badge.textContent = labels[e.target.value];
  });
});

// Deletar tarefa
function deleteTask(btn) {
  if (confirm('Eliminar la tarea?')) {
    btn.closest('article').remove();
  }
}

// Adicionar nova tarefa COM CATEGORIA
document.querySelector('.add-btn').addEventListener('click', () => {
  const taskInput = document.getElementById('newTaskInput');
  const categoryInput = document.getElementById('newCategoryInput');
  const taskText = taskInput.value.trim();
  const categoryText = categoryInput.value.trim() || 'Geral'; // Default se vazio

  if (!taskText) {
    alert('Escriba el nombre de la tarea!');
    taskInput.focus();
    return;
  }

  const taskId = 'task' + Date.now();
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
  
  // Insere ANTES das tasks existentes (nova fica no topo)
  const h2Title = document.querySelector('section[aria-label="Lista de tarefas"] h2');
  h2Title.insertAdjacentHTML('afterend', newTask);
  
  // Limpa inputs
  taskInput.value = '';
  categoryInput.value = '';
  taskInput.focus();

  // Re-bind events para nova task (checkbox + priority)
  const newCb = document.getElementById(taskId);
  newCb.addEventListener('change', (e) => {
    const task = e.target.closest('article');
    task.classList.toggle('completed', e.target.checked);
  });
  
  const newSelect = newCb.closest('article').querySelector('.priority-select');
  newSelect.addEventListener('change', (e) => {
    const task = e.target.closest('article');
    task.className = `priority-${e.target.value}` + (task.classList.contains('completed') ? ' completed' : '');
    const badge = task.querySelector('.priority-badge');
    const labels = {high: 'Alta', medium: 'Media', low: 'Baja'};
    badge.textContent = labels[e.target.value];
  });
});


// Filtros (básico)
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    const filter = e.target.dataset.filter;
    document.querySelectorAll('article').forEach(task => {
      task.style.display = 'none';
      if (filter === 'all') {
        task.style.display = 'flex';
      } else if (filter === 'high' && task.classList.contains('priority-high')) {
        task.style.display = 'flex';
      } else if (filter === 'completed' && task.classList.contains('completed')) {
        task.style.display = 'flex';
      }
    });
  });
});
