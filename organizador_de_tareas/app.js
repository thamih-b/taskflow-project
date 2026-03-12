class OrganizadorDeTareas {
  constructor() {
    this.tasks = (typeof storageManager !== 'undefined')
      ? storageManager.loadTasks()
      : [];
    this.currentFilter = 'all';
    this.currentCategory = 'all';
    this.searchTerm = '';
    this.selectedTasks = new Set();
    this.expandedTasks = new Set();
    this.openSubtaskPanels = new Set();
    this.lang = (typeof storageManager !== 'undefined')
      ? storageManager.loadLanguage('es')
      : 'es';
    this.statusFilters = [
      {id:'all',       labelKey:'filterAll',       color:'amber'},
      {id:'high',      labelKey:'filterHigh',      color:'red'},
      {id:'medium',    labelKey:'filterMedium',    color:'amber'},
      {id:'low',       labelKey:'filterLow',       color:'emerald'},
      {id:'completed', labelKey:'filterCompleted', color:'zinc'},
      {id:'pending',   labelKey:'filterPending',   color:'blue'}
    ];
    this.init();
  }

  t(key) { return (I18N[this.lang]||I18N.es)[key]||key; }

  setLanguage(lang) {
    this.lang = lang;
    if (typeof storageManager !== 'undefined') {
      storageManager.saveLanguage(lang);
    }
    this.applyTranslations();
    this.renderStatusFilters();
    this.render();
  }

  applyTranslations() {
    const l = this.lang;
    document.documentElement.lang = l;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const v = I18N[l][el.dataset.i18n];
      if (v !== undefined) el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const v = I18N[l][el.dataset.i18nPlaceholder];
      if (v) el.placeholder = v;
    });
    const prio = document.getElementById('newPriorityInput');
    if (prio) { prio.options[0].text=this.t('priorityHigh'); prio.options[1].text=this.t('priorityMedium'); prio.options[2].text=this.t('priorityLow'); }
    // Lang dropdown UI
    const m = LANG_META[l];
    document.getElementById('langCurrentFlag').textContent = m.flag;
    document.getElementById('langCurrentCode').textContent = m.code;
    document.querySelectorAll('.lang-option').forEach(btn => btn.classList.toggle('active-lang', btn.dataset.lang===l));
    // Theme icons
    ['sunIcon','sunIconMobile'].forEach(id => { const el=document.getElementById(id); if(el) el.textContent=`☀️ ${this.t('lightMode')}`; });
    ['moonIcon','moonIconMobile'].forEach(id => { const el=document.getElementById(id); if(el) el.textContent=`🌙 ${this.t('darkMode')}`; });
  }

  init() {
    this.loadTheme();
    this.applyTranslations();
    this.renderStatusFilters();
    this.bindEvents();
    this.render();
  }

  escapeHTML(str) {
    return String(str).replace(/[&<>'"]/g, t=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[t]));
  }

  getPriorityConfig(p) {
    return ({high:{textKey:'prioHigh',color:'bg-red-500/90'},medium:{textKey:'prioMedium',color:'bg-amber-500/90'},low:{textKey:'prioLow',color:'bg-emerald-500/90'}})[p]||{textKey:'prioMedium',color:'bg-amber-500/90'};
  }

  getSubtaskProgress(task) {
    if (!task.subtasks||!task.subtasks.length) return null;
    const done = task.subtasks.filter(s=>s.completed).length;
    return {done, total:task.subtasks.length, pct:Math.round(done/task.subtasks.length*100)};
  }

  addSubtask(taskId) {
    const input = document.getElementById(`subtask-input-${taskId}`);
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    const task = this.tasks.find(t=>t.id===taskId);
    if (!task) return;
    if (!task.subtasks) task.subtasks=[];
    task.subtasks.push({id:Date.now().toString(), text, completed:false});
    this.saveTasks();
    input.value='';
    this.openSubtaskPanels.add(taskId);
    this.render();
  }

  // Toggle subtask → sync parent task
  toggleSubtask(taskId, subtaskId) {
    const task = this.tasks.find(t=>t.id===taskId);
    if (!task||!task.subtasks) return;
    const sub = task.subtasks.find(s=>s.id===subtaskId);
    if (!sub) return;
    sub.completed = !sub.completed;
    // If all subtasks done → mark parent done. If any undone → mark parent pending.
    task.completed = task.subtasks.length>0 && task.subtasks.every(s=>s.completed);
    this.saveTasks();
    this.openSubtaskPanels.add(taskId);
    this.render();
  }

  deleteSubtask(taskId, subtaskId) {
    const task = this.tasks.find(t=>t.id===taskId);
    if (!task||!task.subtasks) return;
    if (!confirm(this.t('confirmDeleteSubtask'))) return;
    task.subtasks = task.subtasks.filter(s=>s.id!==subtaskId);
    this.saveTasks();
    this.openSubtaskPanels.add(taskId);
    this.render();
  }

  toggleSubtaskPanel(taskId) {
    this.openSubtaskPanels.has(taskId) ? this.openSubtaskPanels.delete(taskId) : this.openSubtaskPanels.add(taskId);
    document.getElementById(`subtasks-panel-${taskId}`)?.classList.toggle('open', this.openSubtaskPanels.has(taskId));
    const arrow = document.getElementById(`subtask-arrow-${task.id}`);
    if (arrow) arrow.textContent = this.openSubtaskPanels.has(taskId)?'▲':'▼';
  }

  renderStatusFilters() {
    document.getElementById('statusFiltersContainer').innerHTML = this.statusFilters.map(f=>{
      const on = this.currentFilter===f.id;
      return `<button class="filter-btn text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full border transition
        ${on?`border-${f.color}-900/40 bg-${f.color}-100/80 dark:bg-${f.color}-700/70 text-ink dark:text-${f.color}-50 shadow-sm`
            :`border-${f.color}-700/60 bg-transparent text-${f.color}-800 dark:text-${f.color}-200 hover:bg-${f.color}-100/30`}"
        data-filter="${f.id}">${this.t(f.labelKey)}</button>`;
    }).join('');
  }

  renderCategoryFilters() {
    const container = document.getElementById('categoryFilterContainer');
    const categorySelect = document.getElementById('newCategorySelect');
    const categories = ['all'];
    this.tasks.forEach(task => {
      if (!categories.includes(task.category)) categories.push(task.category);
    });

    let buttonsHTML = '';
    let selectOptionsHTML = '';

    categories.forEach(category => {
      const isActive = this.currentCategory === category;
      const label = category === 'all' ? this.t('filterAll') : category;
      const safeLabel = this.escapeHTML(label);
      const safeCategory = this.escapeHTML(category);

      const buttonClasses = category === 'all'
        ? (isActive
          ? 'bg-amber-200/90 dark:bg-amber-700/80 border-amber-900/60 text-amber-900 dark:text-amber-50'
          : 'bg-amber-100/60 dark:bg-amber-800/40 border-amber-900/30 text-amber-800 dark:text-amber-200 hover:bg-amber-200/60')
        : (isActive
          ? 'bg-blue-200/90 dark:bg-blue-800/80 border-blue-600/60 text-blue-900 dark:text-blue-50'
          : 'bg-blue-50/70 dark:bg-blue-900/40 border-blue-400/50 text-blue-800 dark:text-blue-200 hover:bg-blue-100');

      buttonsHTML += `<button class="cat-filter-btn ${buttonClasses} text-xs font-semibold px-3 py-1.5 rounded-full border shadow-sm transition min-w-[55px]" data-category="${safeCategory}">${safeLabel}</button>`;
      if (category !== 'all') {
        selectOptionsHTML += `<option value="${safeCategory}">${safeLabel}</option>`;
      }
    });

    selectOptionsHTML += `<option value="nueva">${this.t('writeNew')}</option>`;
    container.innerHTML = buttonsHTML;

    if (categorySelect) {
      const currentValue = categorySelect.value;
      categorySelect.innerHTML = selectOptionsHTML;
      if (categories.includes(currentValue) && currentValue !== 'nueva') {
        categorySelect.value = currentValue;
      } else {
        categorySelect.value = categories.length > 1 ? categories[1] : 'General';
      }
    }

    const newCategoryInput = document.getElementById('newCategoryText');
    const cancelNewCategoryButton = document.getElementById('cancelNewCatBtn');
    if (newCategoryInput && cancelNewCategoryButton && categorySelect) {
      newCategoryInput.addEventListener('input', () => {
        cancelNewCategoryButton.classList.toggle('hidden', newCategoryInput.classList.contains('hidden'));
      });
      categorySelect.addEventListener('change', () => {
        cancelNewCategoryButton.classList.toggle('hidden', newCategoryInput.classList.contains('hidden'));
      });
    }
  }

  toggleNewCategoryInput() {
    const selectEl = document.getElementById('newCategorySelect');
    const textEl = document.getElementById('newCategoryText');
    const cancelBtn = document.getElementById('cancelNewCatBtn');
    const evtTarget = (typeof event !== 'undefined') ? event.target : null;

    if (!selectEl || !textEl || !cancelBtn) return;

    const fromSelect = evtTarget === selectEl;
    const fromCancel = evtTarget === cancelBtn;

    if (fromSelect && selectEl.value === 'nueva') {
      selectEl.classList.add('hidden');
      textEl.classList.remove('hidden');
      cancelBtn.classList.remove('hidden');
      textEl.focus();
    } else if (fromCancel) {
      textEl.classList.add('hidden');
      textEl.value = '';
      selectEl.classList.remove('hidden');
      selectEl.selectedIndex = 0;
      cancelBtn.classList.add('hidden');
    }
  }

  createTaskListHeader() {
    const titleElement = document.createElement('h2');
    titleElement.className = 'text-xl font-semibold tracking-wide text-amber-900 dark:text-amber-100 mb-2';
    titleElement.textContent = this.t('taskListTitle');
    return titleElement;
  }

  createProgressElement(progress) {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-center gap-2';

    const label = document.createElement('span');
    label.className = 'text-[10px] uppercase tracking-wider text-amber-700/70 dark:text-amber-400/70 shrink-0 hidden sm:inline';
    label.textContent = this.t('progressLabel');

    const barContainer = document.createElement('div');
    barContainer.className = 'flex-1 h-2 rounded-full bg-amber-200/60 dark:bg-zinc-700/60 overflow-hidden min-w-[50px]';

    const fill = document.createElement('div');
    const colorClass = progress.pct === 100
      ? 'bg-emerald-500'
      : progress.pct >= 50
        ? 'bg-amber-500'
        : 'bg-red-400';
    fill.className = `progress-fill h-full rounded-full ${colorClass}`;
    fill.style.width = `${progress.pct}%`;

    const counter = document.createElement('span');
    counter.className = 'text-[10px] font-bold text-amber-800 dark:text-amber-300 shrink-0';
    counter.textContent = `${progress.done}/${progress.total}`;

    barContainer.appendChild(fill);
    wrapper.appendChild(label);
    wrapper.appendChild(barContainer);
    wrapper.appendChild(counter);

    return wrapper;
  }

  createSubtaskListElement(task) {
    const listContainer = document.createElement('div');
    listContainer.id = `subtask-list-${task.id}`;
    listContainer.className = 'space-y-0.5 mb-3';

    if (!task.subtasks || !task.subtasks.length) {
      return listContainer;
    }

    task.subtasks.forEach(subtask => {
      const row = document.createElement('div');
      row.className = 'flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-amber-100/50 dark:hover:bg-zinc-700/40 group transition';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `sub-${subtask.id}`;
      checkbox.className = 'h-4 w-4 rounded accent-emerald-600 cursor-pointer shrink-0';
      checkbox.checked = !!subtask.completed;
      checkbox.addEventListener('change', () => this.toggleSubtask(task.id, subtask.id));

      const label = document.createElement('label');
      label.htmlFor = checkbox.id;
      label.className = 'flex-1 text-sm text-amber-900/90 dark:text-amber-100/80 cursor-pointer';
      if (subtask.completed) {
        label.classList.add('line-through', 'opacity-55');
      }
      label.textContent = subtask.text;

      const deleteButton = document.createElement('button');
      deleteButton.className = 'opacity-0 group-hover:opacity-100 focus:opacity-100 text-red-400 hover:text-red-600 transition text-xs shrink-0';
      deleteButton.textContent = '✕';
      deleteButton.addEventListener('click', () => this.deleteSubtask(task.id, subtask.id));

      row.appendChild(checkbox);
      row.appendChild(label);
      row.appendChild(deleteButton);

      listContainer.appendChild(row);
    });

    return listContainer;
  }

  createTaskElement(task) {
    const isSelected = this.selectedTasks.has(task.id);
    const isExpanded = this.expandedTasks.has(task.id);
    const isSubtasksOpen = this.openSubtaskPanels.has(task.id);
    const priorityConfig = this.getPriorityConfig(task.priority);
    const subtaskProgress = this.getSubtaskProgress(task);
    const subtasksCount = (task.subtasks || []).length;

    const article = document.createElement('article');
    article.dataset.id = task.id;
    article.draggable = true;
    article.className = [
      'task-item cursor-move relative',
      'bg-gradient-to-br from-amber-50/80 via-amber-100/60 to-amber-50/70',
      'dark:from-zinc-800/70 dark:via-zinc-700/60 dark:to-zinc-800/50',
      'border border-amber-800/30 dark:border-amber-400/40',
      'border-l-8 border-amber-900/60 dark:border-amber-300/50',
      'shadow-[8px_8px_16px_rgba(0,0,0,0.3)]',
      'rounded-2xl p-5 pt-8 pb-4 transition-all duration-200',
      isSelected ? 'ring-2 ring-blue-500/60 scale-[1.01]' : ''
    ].join(' ').trim();

    // Top-left selection checkbox
    const selectionWrapper = document.createElement('div');
    selectionWrapper.className = 'absolute -top-3 -left-4 z-10';

    const selectionCheckbox = document.createElement('input');
    selectionCheckbox.type = 'checkbox';
    selectionCheckbox.id = `sel-${task.id}`;
    selectionCheckbox.className = 'peer sr-only';
    selectionCheckbox.checked = isSelected;
    selectionCheckbox.addEventListener('change', () => this.toggleSelection(task.id));

    const selectionLabel = document.createElement('label');
    selectionLabel.htmlFor = selectionCheckbox.id;
    selectionLabel.className = [
      'flex items-center justify-center w-6 h-6 rounded-full',
      'border-2 border-amber-900/40 dark:border-amber-400/40',
      'bg-amber-50/90 dark:bg-zinc-800/90 shadow-md cursor-pointer',
      'hover:scale-110 transition-all',
      'peer-checked:border-blue-500 peer-checked:shadow-blue-500/20'
    ].join(' ');

    const selectionDot = document.createElement('span');
    selectionDot.className = 'w-3 h-3 rounded-full bg-blue-500 dark:bg-blue-400 scale-0 peer-checked:scale-100 transition-transform duration-200';

    selectionLabel.appendChild(selectionDot);
    selectionWrapper.appendChild(selectionCheckbox);
    selectionWrapper.appendChild(selectionLabel);
    article.appendChild(selectionWrapper);

    // Top-right delete button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'absolute -top-3 -right-4 w-7 h-7 rounded-full bg-red-700 text-amber-50 text-sm font-bold shadow-md hover:bg-red-800 transition';
    deleteButton.textContent = '✕';
    deleteButton.addEventListener('click', () => this.deleteTask(task.id));
    article.appendChild(deleteButton);

    // Header (text + priority)
    const header = document.createElement('div');
    header.className = 'flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-amber-900/20 dark:border-amber-400/30 mb-3';

    const textContainerOuter = document.createElement('div');
    textContainerOuter.className = 'flex-1 flex items-start min-w-0 pr-2';

    const textContainer = document.createElement('div');
    textContainer.className = 'flex-1 min-w-0';

    const textParagraph = document.createElement('p');
    textParagraph.id = `text-${task.id}`;
    textParagraph.dataset.id = task.id;
    textParagraph.className = [
      'task-text text-base sm:text-lg font-serif italic',
      'text-amber-900/95 dark:text-amber-100/90',
      'break-words whitespace-pre-wrap',
      isExpanded ? '' : 'line-clamp-4 md:line-clamp-5',
      task.completed ? 'line-through opacity-60' : ''
    ].join(' ').trim();
    textParagraph.textContent = task.text;

    const expandButton = document.createElement('button');
    expandButton.id = `expand-btn-${task.id}`;
    expandButton.className = 'text-xs font-sans font-bold text-blue-700 dark:text-blue-400 hover:underline mt-1 hidden';
    expandButton.textContent = isExpanded ? this.t('expandLess') : this.t('expandMore');
    expandButton.addEventListener('click', () => this.toggleExpand(task.id));

    const editTaskButton = document.createElement('button');
    editTaskButton.className = 'ml-2 mt-1 text-sm text-[#6b7280] hover:text-amber-700 dark:text-zinc-400 dark:hover:text-amber-300 transition shrink-0';
    editTaskButton.textContent = '✏️';
    editTaskButton.addEventListener('click', () => this.editTask(task.id));

    textContainer.appendChild(textParagraph);
    textContainer.appendChild(expandButton);
    textContainerOuter.appendChild(textContainer);
    textContainerOuter.appendChild(editTaskButton);

    const priorityLabel = document.createElement('label');
    priorityLabel.className = 'self-start w-fit relative shrink-0 inline-flex items-center gap-2 text-xs sm:text-sm rounded-full border border-amber-900/50 dark:border-amber-400/60 bg-amber-50/80 dark:bg-zinc-900/80 px-4 py-2 cursor-pointer group hover:bg-amber-100/50';

    const priorityText = document.createElement('span');
    priorityText.textContent = `${this.t('priorityLabel')}: `;

    const priorityBadge = document.createElement('span');
    priorityBadge.className = `text-xs font-semibold px-2 py-1 rounded-full ml-1 text-white ${priorityConfig.color}`;
    priorityBadge.textContent = this.t(priorityConfig.textKey);

    const prioritySelect = document.createElement('select');
    prioritySelect.setAttribute('aria-label', 'Cambiar prioridad');
    prioritySelect.className = 'absolute inset-0 w-full h-full opacity-0 cursor-pointer bg-white dark:bg-zinc-800 text-ink dark:text-zinc-100';

    ['high', 'medium', 'low'].forEach(priorityValue => {
      const option = document.createElement('option');
      option.value = priorityValue;
      option.className = 'bg-white dark:bg-zinc-800 text-ink dark:text-zinc-100';
      option.textContent = this.t(
        priorityValue === 'high'
          ? 'prioHigh'
          : priorityValue === 'medium'
            ? 'prioMedium'
            : 'prioLow'
      );
      if (task.priority === priorityValue) {
        option.selected = true;
      }
      prioritySelect.appendChild(option);
    });

    prioritySelect.addEventListener('change', event => {
      this.updatePriority(task.id, event.target.value);
    });

    priorityLabel.appendChild(priorityText);
    priorityLabel.appendChild(priorityBadge);
    priorityLabel.appendChild(prioritySelect);

    header.appendChild(textContainerOuter);
    header.appendChild(priorityLabel);
    article.appendChild(header);

    // Category + subtasks toggle
    const categoryRow = document.createElement('div');
    categoryRow.className = 'flex items-center justify-between flex-wrap gap-2 mb-3';

    const categoryText = document.createElement('p');
    categoryText.className = 'text-xs sm:text-sm text-amber-700/80 dark:text-amber-300/70 font-serif italic flex items-center gap-1.5';
    categoryText.textContent = '📓 ';

    const categoryNameSpan = document.createElement('span');
    categoryNameSpan.textContent = task.category;

    const editCategoryButton = document.createElement('button');
    editCategoryButton.className = 'text-[11px] text-[#6b7280] hover:text-amber-700 dark:text-zinc-400 dark:hover:text-amber-300 transition';
    editCategoryButton.textContent = '✏️';
    editCategoryButton.addEventListener('click', () => this.editCategory(task.id));

    categoryText.appendChild(categoryNameSpan);
    categoryText.appendChild(editCategoryButton);

    const subtasksToggleButton = document.createElement('button');
    subtasksToggleButton.className = [
      'inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition',
      isSubtasksOpen
        ? 'bg-amber-200/80 dark:bg-amber-700/70 border-amber-700/50 text-amber-900 dark:text-amber-50'
        : 'bg-amber-50/60 dark:bg-zinc-800/60 border-amber-700/30 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100/70 dark:hover:bg-zinc-700/50'
    ].join(' ');
    subtasksToggleButton.setAttribute('aria-expanded', String(isSubtasksOpen));
    subtasksToggleButton.addEventListener('click', () => this.toggleSubtaskPanel(task.id));

    const subtasksLabel = document.createElement('span');
    subtasksLabel.textContent = `☰ ${this.t('subtasksToggle')}`;

    subtasksToggleButton.appendChild(subtasksLabel);

    if (subtasksCount > 0) {
      const subtasksBadge = document.createElement('span');
      subtasksBadge.className = 'bg-amber-600/80 text-white rounded-full px-1.5 py-0.5 text-[10px] leading-none';
      subtasksBadge.textContent = String(subtasksCount);
      subtasksToggleButton.appendChild(subtasksBadge);
    }

    const subtasksArrow = document.createElement('span');
    subtasksArrow.id = `subtask-arrow-${task.id}`;
    subtasksArrow.className = 'text-[10px]';
    subtasksArrow.textContent = isSubtasksOpen ? '▲' : '▼';
    subtasksToggleButton.appendChild(subtasksArrow);

    categoryRow.appendChild(categoryText);
    categoryRow.appendChild(subtasksToggleButton);
    article.appendChild(categoryRow);

    // Subtasks panel
    const subtasksPanel = document.createElement('div');
    subtasksPanel.id = `subtasks-panel-${task.id}`;
    subtasksPanel.className = `subtasks-panel ${isSubtasksOpen ? 'open' : ''}`;

    const subtasksInner = document.createElement('div');
    subtasksInner.className = 'subtasks-inner';

    const subtasksContent = document.createElement('div');
    subtasksContent.className = 'mt-2 pt-3 border-t border-amber-900/15 dark:border-amber-400/20 mb-3';

    const subtasksTitle = document.createElement('p');
    subtasksTitle.className = 'text-xs uppercase tracking-wider text-amber-700/60 dark:text-amber-400/60 mb-2 px-1';
    subtasksTitle.textContent = this.t('subtasksTitle');

    const subtaskList = this.createSubtaskListElement(task);

    const newSubtaskRow = document.createElement('div');
    newSubtaskRow.className = 'flex gap-2 items-center';

    const newSubtaskInput = document.createElement('input');
    newSubtaskInput.type = 'text';
    newSubtaskInput.id = `subtask-input-${task.id}`;
    newSubtaskInput.placeholder = this.t('addSubtaskPlaceholder');
    newSubtaskInput.className = 'flex-1 rounded-md border border-amber-900/30 dark:border-amber-600/40 bg-amber-50/50 dark:bg-zinc-900/70 px-3 py-2 text-xs text-[#6b7280] dark:text-amber-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/60 transition';
    newSubtaskInput.addEventListener('keypress', event => {
      if (event.key === 'Enter') this.addSubtask(task.id);
    });

    const newSubtaskButton = document.createElement('button');
    newSubtaskButton.className = 'shrink-0 px-3 py-2 rounded-md bg-amber-500/80 hover:bg-amber-600/90 text-amber-950 text-xs font-bold shadow transition active:scale-95';
    newSubtaskButton.textContent = this.t('addSubtaskBtn');
    newSubtaskButton.addEventListener('click', () => this.addSubtask(task.id));

    newSubtaskRow.appendChild(newSubtaskInput);
    newSubtaskRow.appendChild(newSubtaskButton);

    subtasksContent.appendChild(subtasksTitle);
    subtasksContent.appendChild(subtaskList);
    subtasksContent.appendChild(newSubtaskRow);
    subtasksInner.appendChild(subtasksContent);
    subtasksPanel.appendChild(subtasksInner);
    article.appendChild(subtasksPanel);

    // Bottom row (progress + complete checkbox)
    const bottomRow = document.createElement('div');
    bottomRow.className = 'flex items-center gap-3 pt-3 mt-1 border-t border-amber-900/10 dark:border-amber-400/15';

    const progressWrapper = document.createElement('div');
    progressWrapper.id = `progress-wrap-${task.id}`;
    progressWrapper.className = 'min-w-0 max-w-[52%] flex-1';
    if (subtaskProgress) {
      progressWrapper.appendChild(this.createProgressElement(subtaskProgress));
    }

    const spacer = document.createElement('div');
    spacer.className = 'flex-1';

    const completeLabel = document.createElement('label');
    completeLabel.className = 'flex items-center gap-2 cursor-pointer bg-amber-100/80 dark:bg-amber-700/70 px-3 py-1.5 rounded-md border-2 border-emerald-600/40 dark:border-emerald-400/40 shadow hover:bg-amber-200/90 dark:hover:bg-amber-600/80 transition shrink-0 select-none';

    const completeCheckbox = document.createElement('input');
    completeCheckbox.type = 'checkbox';
    completeCheckbox.id = `task-chk-${task.id}`;
    completeCheckbox.className = 'h-4 w-4 cursor-pointer accent-emerald-600';
    completeCheckbox.checked = !!task.completed;
    completeCheckbox.addEventListener('change', () => this.toggleTask(task.id));

    const completeText = document.createElement('span');
    completeText.className = 'text-xs font-semibold text-emerald-800 dark:text-emerald-200';
    completeText.textContent = this.t('markDone');

    completeLabel.appendChild(completeCheckbox);
    completeLabel.appendChild(completeText);

    bottomRow.appendChild(progressWrapper);
    bottomRow.appendChild(spacer);
    bottomRow.appendChild(completeLabel);
    article.appendChild(bottomRow);

    // Handle expand button visibility after layout
    setTimeout(() => {
      if (textParagraph.scrollHeight > textParagraph.clientHeight || this.expandedTasks.has(task.id)) {
        expandButton.classList.remove('hidden');
      }
    }, 0);

    return article;
  }

  render() {
    const container = document.getElementById('tasksContainer');
    this.updateStats();
    this.renderCategoryFilters();
    this.updateBulkActionUI();

    const filteredTasks = this.tasks.filter(task => this.matchesFilter(task));
    container.innerHTML = '';

    container.appendChild(this.createTaskListHeader());

    if (!filteredTasks.length) {
      const emptyState = document.createElement('div');
      emptyState.className = 'text-center py-8 text-[#6b7280] dark:text-amber-300';
      emptyState.textContent = this.searchTerm ? this.t('noTasksSearch') : this.t('noTasks');
      container.appendChild(emptyState);
      return;
    }

    filteredTasks.forEach(task => {
      container.appendChild(this.createTaskElement(task));
    });
  }

  bindEvents() {
    document.getElementById('themeToggle').addEventListener('click',()=>this.toggleTheme());
    document.getElementById('themeToggleMobile')?.addEventListener('click',()=>this.toggleTheme());
    document.getElementById('addTaskBtn').addEventListener('click',()=>this.addTask());
    document.getElementById('newTaskInput').addEventListener('keypress',e=>{ if(e.key==='Enter') this.addTask(); });
    document.getElementById('searchInput').addEventListener('input',e=>{ this.searchTerm=e.target.value.toLowerCase(); this.render(); });
    document.getElementById('selectAllBtn').addEventListener('click',()=>this.toggleSelectAll());
    document.getElementById('completeActionBtn').addEventListener('click',()=>this.executeCompleteAction());
    document.getElementById('deleteActionBtn').addEventListener('click',()=>this.executeDeleteAction());
    document.addEventListener('click',e=>{
      if(e.target.classList.contains('filter-btn')){ this.currentFilter=e.target.dataset.filter; this.selectedTasks.clear(); this.renderStatusFilters(); this.render(); }
      if(e.target.classList.contains('cat-filter-btn')){ this.currentCategory=e.target.dataset.category; this.selectedTasks.clear(); this.render(); }
    });
    const dnd=document.getElementById('tasksContainer');
    dnd.addEventListener('dragstart',e=>{ const it=e.target.closest('.task-item'); if(!it)return; this.draggedId=it.dataset.id; setTimeout(()=>it.classList.add('opacity-40','scale-95'),0); });
    dnd.addEventListener('dragover',e=>e.preventDefault());
    dnd.addEventListener('drop',e=>{ e.preventDefault(); const it=e.target.closest('.task-item'); if(it&&this.draggedId&&it.dataset.id!==this.draggedId) this.reorderTasks(this.draggedId,it.dataset.id); });
    dnd.addEventListener('dragend',e=>{ e.target.closest('.task-item')?.classList.remove('opacity-40','scale-95'); this.draggedId=null; });
  }

  loadTheme() {
    const theme = (typeof storageManager !== 'undefined')
      ? storageManager.loadTheme('light')
      : (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', !isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }

  toggleTheme() {
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    const nextTheme = isCurrentlyDark ? 'light' : 'dark';
    if (typeof storageManager !== 'undefined') {
      storageManager.saveTheme(nextTheme);
    }
    this.loadTheme();
  }

  getTaskFormData() {
    const titleInput = document.getElementById('newTaskInput');
    const prioritySelect = document.getElementById('newPriorityInput');
    const categorySelect = document.getElementById('newCategorySelect');
    const categoryTextInput = document.getElementById('newCategoryText');
    const subtaskInput = document.getElementById('newSubtaskInput');

    const title = titleInput ? titleInput.value.trim() : '';
    const priority = (prioritySelect && prioritySelect.value) || 'medium';

    let category = 'General';
    if (categoryTextInput && !categoryTextInput.classList.contains('hidden') && categoryTextInput.value.trim()) {
      category = categoryTextInput.value.trim();
    } else if (categorySelect && categorySelect.value && categorySelect.value !== 'nueva') {
      category = categorySelect.value;
    }

    const initialSubtaskText = subtaskInput && subtaskInput.value.trim()
      ? subtaskInput.value.trim()
      : '';

    return { title, priority, category, initialSubtaskText };
  }

  validateTask(formData) {
    const errors = [];
    const titleNormalized = formData.title.trim();

    if (!titleNormalized) {
      errors.push(this.t('taskPlaceholder'));
    }

    if (titleNormalized.length > 100) {
      errors.push('El título no puede tener más de 100 caracteres.');
    }

    const normalizedTitle = titleNormalized.toLowerCase();
    const hasDuplicate = this.tasks.some(task => String(task.text || '').trim().toLowerCase() === normalizedTitle);
    if (hasDuplicate) {
      errors.push('Ya existe una tarea con ese mismo título.');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  saveTask(formData) {
    const newTaskId = Date.now().toString();
    const newTask = {
      id: newTaskId,
      text: formData.title,
      category: formData.category,
      priority: formData.priority || 'medium',
      completed: false,
      subtasks: []
    };

    if (formData.initialSubtaskText) {
      newTask.subtasks.push({
        id: `${newTaskId}-sub`,
        text: formData.initialSubtaskText,
        completed: false
      });
    }

    this.tasks.unshift(newTask);
    this.saveTasks();
  }

  resetTaskForm() {
    const titleInput = document.getElementById('newTaskInput');
    const prioritySelect = document.getElementById('newPriorityInput');
    const categorySelect = document.getElementById('newCategorySelect');
    const categoryTextInput = document.getElementById('newCategoryText');
    const subtaskInput = document.getElementById('newSubtaskInput');
    const cancelNewCategoryButton = document.getElementById('cancelNewCatBtn');

    if (titleInput) titleInput.value = '';
    if (prioritySelect) prioritySelect.value = 'medium';
    if (subtaskInput) subtaskInput.value = '';

    if (categoryTextInput) {
      categoryTextInput.value = '';
      categoryTextInput.classList.add('hidden');
    }
    if (cancelNewCategoryButton) {
      cancelNewCategoryButton.classList.add('hidden');
    }
    if (categorySelect) {
      categorySelect.classList.remove('hidden');
    }

    if (titleInput) {
      titleInput.focus();
    }
  }

  addTask() {
    const formData = this.getTaskFormData();
    const validation = this.validateTask(formData);

    if (!validation.valid) {
      alert(validation.errors.join('\n'));
      return;
    }

    this.saveTask(formData);
    this.resetTaskForm();
    this.render();
  }

  editTask(id) { const t=this.tasks.find(t=>t.id===id); if(!t)return; const v=prompt(this.t('editTaskPrompt'),t.text); if(v?.trim()){t.text=v.trim();this.saveTasks();this.render();} }
  editCategory(id) { const t=this.tasks.find(t=>t.id===id); if(!t)return; const v=prompt(this.t('editCategoryPrompt'),t.category); if(v?.trim()){t.category=v.trim();this.saveTasks();this.render();} }
  toggleExpand(id) { this.expandedTasks.has(id)?this.expandedTasks.delete(id):this.expandedTasks.add(id); this.render(); }

  // Toggle tarefa principal → sync subtarefas
  toggleTask(taskId) {
    const task=this.tasks.find(t=>t.id===taskId);
    if(!task) return;
    task.completed=!task.completed;
    if(task.subtasks?.length) task.subtasks.forEach(s=>s.completed=task.completed);
    this.saveTasks(); this.render();
  }

  updatePriority(id,p) { const t=this.tasks.find(t=>t.id===id); if(t){t.priority=p;this.saveTasks();this.render();} }

  deleteTask(id) {
    const t=this.tasks.find(t=>t.id===id); if(!t) return;
    if(confirm(`${this.t('confirmDelete')}${t.text}${this.t('confirmDeleteSuffix')}`)){
      this.tasks=this.tasks.filter(t=>t.id!==id);
      this.selectedTasks.delete(id); this.expandedTasks.delete(id); this.openSubtaskPanels.delete(id);
      this.saveTasks(); this.render();
    }
  }

  reorderTasks(dId,tId) {
    const di=this.tasks.findIndex(t=>t.id===dId), ti=this.tasks.findIndex(t=>t.id===tId);
    if(di>-1&&ti>-1){const[dt]=this.tasks.splice(di,1);this.tasks.splice(ti,0,dt);this.saveTasks();this.render();}
  }

  toggleSelection(id) { this.selectedTasks.has(id)?this.selectedTasks.delete(id):this.selectedTasks.add(id); this.updateBulkActionUI(); this.render(); }

  toggleSelectAll() {
    const f=this.tasks.filter(t=>this.matchesFilter(t));
    const all=f.length>0&&f.every(t=>this.selectedTasks.has(t.id));
    f.forEach(t=>all?this.selectedTasks.delete(t.id):this.selectedTasks.add(t.id));
    this.render();
  }

  // Completar em massa → também sincroniza subtarefas
  executeCompleteAction() {
    const f=this.tasks.filter(t=>this.matchesFilter(t));
    const targets=this.selectedTasks.size>0?this.tasks.filter(t=>this.selectedTasks.has(t.id)):f;
    if(!targets.length) return;
    const newState=!targets.every(t=>t.completed);
    targets.forEach(t=>{ t.completed=newState; if(t.subtasks?.length) t.subtasks.forEach(s=>s.completed=newState); });
    this.selectedTasks.clear(); this.saveTasks(); this.render();
  }

  executeDeleteAction() {
    if(this.selectedTasks.size>0){
      if(confirm(`${this.t('confirmDeleteMultiple')}${this.selectedTasks.size}${this.t('confirmDeleteMultipleSuffix')}`)){
        this.tasks=this.tasks.filter(t=>!this.selectedTasks.has(t.id)); this.selectedTasks.clear();
      } else return;
    } else {
      const count=this.tasks.filter(t=>t.completed).length;
      if(!count) return alert(this.t('noTasksDone'));
      if(confirm(`${this.t('confirmDeleteDone')}${count}${this.t('confirmDeleteDoneSuffix')}`))
        this.tasks=this.tasks.filter(t=>!t.completed);
      else return;
    }
    this.saveTasks(); this.render();
  }

  updateBulkActionUI() {
    const sb=document.getElementById('selectAllBtn'), cb=document.getElementById('completeActionBtn'), db=document.getElementById('deleteActionBtn');
    if(!sb||!cb||!db) return;
    const f=this.tasks.filter(t=>this.matchesFilter(t));
    sb.innerHTML=f.length>0&&f.every(t=>this.selectedTasks.has(t.id))?this.t('deselectAll'):this.t('selectAll');
    const targets=this.selectedTasks.size>0?this.tasks.filter(t=>this.selectedTasks.has(t.id)):f;
    const allDone=targets.length>0&&targets.every(t=>t.completed);
    if(this.selectedTasks.size>0){
      cb.innerHTML=allDone?`${this.t('pendingSelected')} (${this.selectedTasks.size})`:`${this.t('completeSelected')} (${this.selectedTasks.size})`;
      db.innerHTML=`${this.t('deleteSel')} (${this.selectedTasks.size})`;
    } else {
      cb.innerHTML=(allDone&&f.length>0)?this.t('pendingAll'):this.t('completeAll');
      db.innerHTML=this.t('deleteDone');
    }
  }

  matchesFilter(t) {
    const ms=t.text.toLowerCase().includes(this.searchTerm)||t.category.toLowerCase().includes(this.searchTerm);
    const mp=this.currentFilter==='all'||this.currentFilter===t.priority||(this.currentFilter==='completed'&&t.completed)||(this.currentFilter==='pending'&&!t.completed);
    return ms&&mp&&(this.currentCategory==='all'||t.category===this.currentCategory);
  }

  updateStats() {
    const total = this.tasks.length;
    const done = this.tasks.filter(task => task.completed).length;
    const pending = total - done;

    const totalElement = document.getElementById('statTotal');
    const completedElement = document.getElementById('statCompleted');
    const pendingElement = document.getElementById('statPending');

    if (totalElement) totalElement.textContent = String(total);
    if (completedElement) completedElement.textContent = String(done);
    if (pendingElement) pendingElement.textContent = String(pending);
  }

  saveTasks() {
    if (typeof storageManager !== 'undefined') {
      storageManager.saveTasks(this.tasks);
    }
  }
}

const organizadorDeTareas = new OrganizadorDeTareas();
const organizator = organizadorDeTareas;

