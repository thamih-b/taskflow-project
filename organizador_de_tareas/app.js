// ─── SmartParser ─────────────────────────────────────────────────────────────
const SmartParser = {
  splitTasks(input) {
    const text = input.replace(/\s{2,}/g,' ').trim();
    const lists=[];
    const prot=text.replace(/\b(\w[\wÀ-ú]*(?:\s*,\s*\w[\wÀ-ú]*)+(?:\s+(?:e|y|and|ou)\s+\w[\wÀ-ú]*)?)\b/gi,(m)=>{const i=lists.length;lists.push(m);return`__L${i}__`;});
    const av='(?:também|fazer|entregar|estudar|ligar|ir|comprar|reunião|revisar|terminar|enviar|ler|escrever|agendar|marcar|finalizar|completar|preparar|also|además|remember|lembrar|check|conferir)';
    const sep=new RegExp(`\\s*(?:;\\s*|\\s+(?:e\\s+)?(?:também|también|also|além\\s+disso|además)\\s+(?=${av}\\b)|\\s+e\\s+(?=${av}\\b))`,'gi');
    const raw=prot.split(sep).map(p=>p.trim()).filter(Boolean);
    return raw.map(p=>p.replace(/__L(\d+)__/g,(_,i)=>lists[Number(i)])).filter(p=>p.length>1);
  },
  extractDateTime(text,lang){
    if(typeof chrono==='undefined')return{dateISO:null,hasTime:false,endISO:null,cleanText:text};
    let parser=chrono;
    try{if(lang==='pt'&&chrono.pt)parser=chrono.pt;else if(lang==='es'&&chrono.es)parser=chrono.es;}catch{}
    const results=parser.parse(text,new Date(),{forwardDate:true});
    if(!results.length)return{dateISO:null,hasTime:false,endISO:null,cleanText:text};
    const r=results[0],hasTime=r.start.isCertain('hour'),startD=r.start.date();
    if(!hasTime)startD.setHours(23,59,0,0);
    let endISO=null;if(r.end)endISO=r.end.date().toISOString();
    const clean=(text.slice(0,r.index)+text.slice(r.index+r.text.length)).replace(/\s{2,}/g,' ').trim();
    return{dateISO:startD.toISOString(),hasTime,endISO,cleanText:clean};
  },
  extractPriority(text){
    const H=/(urgente|muy\s+urgente|alta\s+prioridad|prioridade\s+alta|high\s+priority|asap|cr[ií]tico)/i;
    const L=/(sin\s+prisa|sem\s+pressa|baja\s+prioridad|prioridade\s+baixa|low\s+priority|quando\s+puder)/i;
    if(H.test(text))return{priority:'high',cleanText:text.replace(H,'').trim()};
    if(L.test(text))return{priority:'low',cleanText:text.replace(L,'').trim()};
    return{priority:'medium',cleanText:text};
  },
  detectCategory(text){
    const t=text.toLowerCase();
    if(/(comprar|compra|mercado|supermercado|tienda|leite|pão|ovos|açúcar|café|manteiga|buy|groceries|shopping)/.test(t))return'Compras';
    if(/(trabalho|reunião|time|trabajo|work|meeting|reunión|equipo|relatório|report|cliente|projeto)/.test(t))return'Trabalho';
    if(/(estudar|estudo|tcc|curso|estudio|study|aula|classe|prova|exame|inglês|lesson|homework)/.test(t))return'Estudos';
    if(/(médico|doctor|consulta|farmácia|farmacia|salud|saúde|remedios|remédio|hospital)/.test(t))return'Saúde';
    if(/(casa|limpar|limpiar|cozinha|cocina|jardim|jardín|faxina|arrumar)/.test(t))return'Casa';
    return'General';
  },
  extractSubtasks(text){
    const m=text.match(/^(?:comprar|compra|buy|obter|pegar|adquirir|buscar|hacer|llevar|traer|preparar|fazer)\s+(.+)$/i);
    if(!m)return[];
    const parts=m[1].split(/,\s*|\s+(?:e|y|and|ou)\s+/i).map(s=>s.replace(/[.,;!?]+$/,'').trim()).filter(s=>s.length>1&&s.split(' ').length<=6);
    if(parts.length<2)return[];
    return parts.map(p=>p.charAt(0).toUpperCase()+p.slice(1));
  },
  parse(input,lang){
    const segs=this.splitTasks(input);
    const list=segs.length?segs:[input.trim()];
    return list.filter(s=>s.trim()).map(seg=>{
      const{dateISO,hasTime,endISO,cleanText:afterDate}=this.extractDateTime(seg,lang);
      const{priority,cleanText:afterPrio}=this.extractPriority(afterDate);
      const subtaskTexts=this.extractSubtasks(afterPrio);
      let title=afterPrio.replace(/^(também|también|also|além\s+disso|además|de|em|a|o|e|para)\s+/i,'').replace(/[.,;!?]+$/,'').replace(/\s{2,}/g,' ').trim();
      title=title.charAt(0).toUpperCase()+title.slice(1);
      if(!title||title.length<2)title=seg.trim();
      return{text:title,category:this.detectCategory(seg),priority,due_date:dateISO,due_date_has_time:hasTime,due_date_end:endISO,subtaskTexts};
    });
  }
};

// ─── OrganizadorDeTareas ──────────────────────────────────────────────────────
class OrganizadorDeTareas {
  constructor(){
    this.tasks=storageManager.loadTasks();
    this.currentFilter='all';
    this.currentCategory='all';
    this.searchTerm='';
    this.selectedTasks=new Set();
    this.expandedTasks=new Set();
    this.openSubtaskPanels=new Set();
    this.activeTab=storageManager.loadActiveTab('manual');
    this.lang=storageManager.loadLanguage('es');
    this.sortedByDeadline=false;
    this.calendarDate=new Date();
    this.calendarDayFilter=null;
    this.smartPreviewTasks=[];
    this.draggedId=null;
    this.pendingSubtasks=[];
    this.mobileDrawerOpen=false;
    this.mobileCalendarOpen=false;
    this.statusFilters=[
      {id:'all',labelKey:'filterAll',color:'amber'},{id:'high',labelKey:'filterHigh',color:'red'},
      {id:'medium',labelKey:'filterMedium',color:'amber'},{id:'low',labelKey:'filterLow',color:'emerald'},
      {id:'completed',labelKey:'filterCompleted',color:'zinc'},{id:'pending',labelKey:'filterPending',color:'blue'}
    ];
    this.init();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  t(k){return(I18N[this.lang]||I18N.es)[k]||k;}
  escapeHTML(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  getPriorityConfig(p){return({high:{textKey:'prioHigh',color:'bg-red-500/90'},medium:{textKey:'prioMedium',color:'bg-rose-400/80'},low:{textKey:'prioLow',color:'bg-emerald-500/90'}})[p]||{textKey:'prioMedium',color:'bg-rose-400/80'};}
  getSubtaskProgress(task){if(!task.subtasks?.length)return null;const done=task.subtasks.filter(s=>s.completed).length;return{done,total:task.subtasks.length,pct:Math.round(done/task.subtasks.length*100)};}

  // Normalize category: trim + capitalize first letter only (for consistent storage)
  normalizeCategory(cat){
    const c=cat.trim();
    return c?c.charAt(0).toUpperCase()+c.slice(1):c;
  }

  // ── i18n ──────────────────────────────────────────────────────────────────
  setLanguage(lang){
    this.lang=lang;storageManager.saveLanguage(lang);
    this.applyTranslations();this.renderStatusFilters();this.renderCalendar();this.render();
  }
  applyTranslations(){
    const l=this.lang;
    document.documentElement.lang=l;
    document.querySelectorAll('[data-i18n]').forEach(el=>{const v=I18N[l][el.dataset.i18n];if(v!==undefined)el.textContent=v;});
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{const v=I18N[l][el.dataset.i18nPlaceholder];if(v)el.placeholder=v;});
    const prio=document.getElementById('newPriorityInput');
    if(prio){prio.options[0].text=this.t('priorityHigh');prio.options[1].text=this.t('priorityMedium');prio.options[2].text=this.t('priorityLow');}
    const m=LANG_META[l];
    const fe=document.getElementById('langCurrentFlag');if(fe)fe.textContent=m.flag;
    const ce=document.getElementById('langCurrentCode');if(ce)ce.textContent=m.code;
    document.querySelectorAll('.lang-option').forEach(b=>b.classList.toggle('active-lang',b.dataset.lang===l));
    const ti=document.getElementById('themeIconFixed');if(ti)ti.textContent=document.documentElement.classList.contains('dark')?'☀️':'🌙';
    const sb=document.getElementById('sortByDeadlineBtn');if(sb)sb.textContent=this.sortedByDeadline?this.t('sortByDeadlineActive'):this.t('sortByDeadlineBtn');
    // Mobile calendar toggle button text
    const mct=document.getElementById('mobileCalToggleBtn');
    if(mct)mct.textContent=this.mobileCalendarOpen?this.t('calToggleHide'):this.t('calToggleShow');
  }

  // ── Locale ────────────────────────────────────────────────────────────────
  getUserLocale(){return{es:'es-ES',pt:'pt-BR',en:'en-US'}[this.lang]||navigator.language||'es-ES';}
  getUserTimezone(){try{return Intl.DateTimeFormat().resolvedOptions().timeZone;}catch{return'UTC';}}

  // ── Date helpers ──────────────────────────────────────────────────────────
  buildDueDate(dateStr,timeStr){
    if(!dateStr)return null;
    const time=(timeStr&&timeStr.trim())?timeStr.trim():'23:59';
    const hasTime=!!(timeStr&&timeStr.trim());
    return{iso:new Date(`${dateStr}T${time}:00`).toISOString(),hasTime};
  }
  isUrgent(task){if(!task.due_date||task.completed)return false;const d=new Date(task.due_date).getTime()-Date.now();return d>0&&d<86400000;}
  isOverdue(task){if(!task.due_date||task.completed)return false;return new Date(task.due_date).getTime()<Date.now();}
  formatDueDate(task){
    if(!task.due_date)return'';
    const l=this.getUserLocale(),tz=this.getUserTimezone(),d=new Date(task.due_date);
    let s=task.due_date_has_time?d.toLocaleString(l,{dateStyle:'short',timeStyle:'short',timeZone:tz}):d.toLocaleDateString(l,{dateStyle:'medium',timeZone:tz});
    if(task.due_date_end)s+=` → ${new Date(task.due_date_end).toLocaleTimeString(l,{hour:'2-digit',minute:'2-digit',timeZone:tz})}`;
    return s;
  }
  getLocalDateStr(iso){if(!iso)return null;try{return new Date(iso).toLocaleDateString('en-CA',{timeZone:this.getUserTimezone()});}catch{return null;}}
  getLocalTimeStr(iso){if(!iso)return null;try{return new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:this.getUserTimezone()}).format(new Date(iso));}catch{return null;}}
  getLocalDay(iso){const s=this.getLocalDateStr(iso);if(!s)return null;const[y,mo,d]=s.split('-').map(Number);return{year:y,month:mo,day:d};}

  // ── Deadline CRUD ─────────────────────────────────────────────────────────
  setTaskDueDate(taskId,dateStr,timeStr){
    const task=this.tasks.find(t=>t.id===taskId);if(!task)return;
    if(!dateStr){delete task.due_date;delete task.due_date_has_time;delete task.due_date_end;}
    else{const r=this.buildDueDate(dateStr,timeStr);if(r){task.due_date=r.iso;task.due_date_has_time=r.hasTime;}}
    this.saveTasks();this.renderCalendar();this.render();
  }
  removeTaskDueDate(taskId){
    const task=this.tasks.find(t=>t.id===taskId);if(!task)return;
    delete task.due_date;delete task.due_date_has_time;delete task.due_date_end;
    this.saveTasks();this.renderCalendar();this.render();
  }

  // ── Sort ──────────────────────────────────────────────────────────────────
  toggleSortByDeadline(){
    this.sortedByDeadline=!this.sortedByDeadline;
    const btn=document.getElementById('sortByDeadlineBtn');
    if(btn){btn.textContent=this.sortedByDeadline?this.t('sortByDeadlineActive'):this.t('sortByDeadlineBtn');btn.classList.toggle('bg-amber-400',this.sortedByDeadline);btn.classList.toggle('text-amber-950',this.sortedByDeadline);btn.classList.toggle('shadow-md',this.sortedByDeadline);}
    this.render();
  }

  // ── Calendar day filter ───────────────────────────────────────────────────
  setCalendarDayFilter(y,mo,d){
    const f=this.calendarDayFilter;
    this.calendarDayFilter=(f&&f.year===y&&f.month===mo&&f.day===d)?null:{year:y,month:mo,day:d};
    this.renderCalendar();this.render();
  }
  clearCalendarDayFilter(){this.calendarDayFilter=null;this.renderCalendar();this.render();}

  // ── Calendar render (renders to both desktop sidebar + mobile inline) ──────
  navigateCalendar(dir){this.calendarDate=new Date(this.calendarDate.getFullYear(),this.calendarDate.getMonth()+dir,1);this.renderCalendar();}

  _buildCalendarHTML(){
    const year=this.calendarDate.getFullYear(),month=this.calendarDate.getMonth(),locale=this.getUserLocale();
    const dayMap=new Map();
    this.tasks.forEach(task=>{
      if(!task.due_date)return;
      const ld=this.getLocalDay(task.due_date);
      if(!ld||ld.year!==year||ld.month!==month+1)return;
      if(!dayMap.has(ld.day))dayMap.set(ld.day,{tasks:[],hasUrgent:false,hasOverdue:false,hasNormal:false});
      const info=dayMap.get(ld.day);info.tasks.push(task);
      if(this.isOverdue(task))info.hasOverdue=true;else if(this.isUrgent(task))info.hasUrgent=true;else info.hasNormal=true;
    });
    const startDow=this.lang==='en'?0:1,refSun=new Date(2023,0,1),headers=[];
    for(let i=0;i<7;i++){const d=new Date(refSun);d.setDate(1+(startDow+i)%7);headers.push(new Intl.DateTimeFormat(locale,{weekday:'narrow'}).format(d));}
    const firstDow=new Date(year,month,1).getDay(),offset=(firstDow-startDow+7)%7,dim=new Date(year,month+1,0).getDate();
    const cells=[];for(let i=0;i<offset;i++)cells.push(null);for(let d=1;d<=dim;d++)cells.push(d);while(cells.length%7!==0)cells.push(null);
    const tl=this.getLocalDay(new Date().toISOString());
    const isT=d=>d&&tl&&tl.year===year&&tl.month===month+1&&tl.day===d;
    const isS=d=>{const f=this.calendarDayFilter;return d&&f&&f.year===year&&f.month===month+1&&f.day===d;};
    return`<div class="grid grid-cols-7 mb-1">${headers.map(h=>`<div class="text-center text-[10px] font-bold text-amber-700/60 dark:text-amber-400/60 py-0.5">${h}</div>`).join('')}</div><div class="grid grid-cols-7 gap-y-0.5">${cells.map(d=>{
      if(!d)return`<div></div>`;
      const info=dayMap.get(d),sel=isS(d),tod=isT(d),hasTasks=!!info;
      const cc=sel?'bg-blue-500 rounded-full cursor-pointer ring-2 ring-blue-300/50':tod?'bg-amber-400/80 dark:bg-amber-600/70 font-bold rounded-full cursor-pointer hover:bg-amber-500/80':hasTasks?'cursor-pointer hover:bg-amber-100/80 dark:hover:bg-zinc-700/60 rounded-md':'rounded-md opacity-60';
      const nc=sel?'text-white':tod?'text-amber-950 dark:text-amber-50':'text-amber-900 dark:text-amber-100';
      let dots='';if(info){if(info.hasOverdue)dots+=`<span class="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>`;if(info.hasUrgent)dots+=`<span class="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0 animate-pulse"></span>`;if(info.hasNormal)dots+=`<span class="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>`;}
      const tip=info?`title="${info.tasks.map(t=>t.text.slice(0,40)).join('\n')}"`:'' ;
      const clk=(hasTasks||tod)?`onclick="organizator.setCalendarDayFilter(${year},${month+1},${d})"`:'';
      return`<div class="flex flex-col items-center justify-center py-1 transition ${cc}" ${tip} ${clk}><span class="text-[11px] leading-none font-medium ${nc}">${d}</span><div class="flex gap-0.5 justify-center h-2 mt-0.5">${dots}</div></div>`;
    }).join('')}</div>`;
  }

  renderCalendar(){
    const raw=new Intl.DateTimeFormat(this.getUserLocale(),{month:'long',year:'numeric'}).format(new Date(this.calendarDate.getFullYear(),this.calendarDate.getMonth(),1));
    const title=raw.charAt(0).toUpperCase()+raw.slice(1);
    const html=this._buildCalendarHTML();
    // Desktop sidebar calendar
    ['calMonthTitle','calMonthTitleMobile'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=title;});
    ['miniCalendar','miniCalendarMobile'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML=html;});
    this.updateCalendarFilterBadge();
  }

  updateCalendarFilterBadge(){
    const badge=document.getElementById('calDayFilterBadge');if(!badge)return;
    if(this.calendarDayFilter){
      const f=this.calendarDayFilter;
      const str=new Date(f.year,f.month-1,f.day).toLocaleDateString(this.getUserLocale(),{weekday:'short',day:'numeric',month:'long'});
      badge.innerHTML=`<span class="font-semibold">📅 ${str}</span><button onclick="organizator.clearCalendarDayFilter()" class="ml-2 text-blue-700 dark:text-blue-300 hover:text-red-500 font-bold transition">${this.t('calClearFilter')}</button>`;
      badge.classList.remove('hidden');
    }else{badge.classList.add('hidden');}
  }

// ── Mobile drawer ─────────────────────────────────────────────────────────
toggleMobileDrawer() {
  this.mobileDrawerOpen = !this.mobileDrawerOpen;
  const drawer   = document.getElementById('mobileDrawer');
  const backdrop = document.getElementById('mobileDrawerBackdrop');
  const btn      = document.getElementById('mobileMenuBtn');

  if (drawer)   drawer.classList.toggle('-translate-x-full', !this.mobileDrawerOpen);
  if (backdrop) backdrop.classList.toggle('hidden', !this.mobileDrawerOpen);
  if (btn)      btn.classList.toggle('hidden', this.mobileDrawerOpen);

  document.body.style.overflow = this.mobileDrawerOpen ? 'hidden' : '';
}
closeMobileDrawer() {
  this.mobileDrawerOpen = false;
  const drawer   = document.getElementById('mobileDrawer');
  const backdrop = document.getElementById('mobileDrawerBackdrop');
  const btn      = document.getElementById('mobileMenuBtn');

  if (drawer)   drawer.classList.add('-translate-x-full');
  if (backdrop) backdrop.classList.add('hidden');
  if (btn)      btn.classList.remove('hidden');

  document.body.style.overflow = '';
}

  // ── Mobile inline calendar toggle ─────────────────────────────────────────
  toggleMobileCalendar(){
    this.mobileCalendarOpen=!this.mobileCalendarOpen;
    const panel=document.getElementById('mobileCalendarPanel');
    if(panel)panel.classList.toggle('hidden',!this.mobileCalendarOpen);
    const btn=document.getElementById('mobileCalToggleBtn');
    if(btn)btn.textContent=this.mobileCalendarOpen?this.t('calToggleHide'):this.t('calToggleShow');
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────
  setActiveTab(tab){
    this.activeTab=tab;storageManager.saveActiveTab(tab);
    document.getElementById('manualTasksPanel')?.classList.toggle('hidden',tab!=='manual');
    document.getElementById('smartTasksPanel')?.classList.toggle('hidden',tab!=='smart');
    ['manualTabBtn','smartTabBtn'].forEach(id=>{
      const btn=document.getElementById(id);if(!btn)return;
      const active=(id==='manualTabBtn'&&tab==='manual')||(id==='smartTabBtn'&&tab==='smart');
      btn.classList.toggle('active',active);
      btn.classList.toggle('text-amber-900',active);btn.classList.toggle('dark:text-amber-100',active);
      btn.classList.toggle('text-amber-700/70',!active);btn.classList.toggle('dark:text-amber-300/70',!active);
    });
  }

  // ── Smart Task ────────────────────────────────────────────────────────────
  executeSmartTask(){
    const promptInput=document.getElementById('smartTaskPrompt'),btn=document.getElementById('smartTaskActionBtn');
    if(!promptInput||!btn)return;
    const input=promptInput.value.trim();if(!input)return;
    btn.textContent=this.t('smartProcessing');btn.disabled=true;
    try{
      const parsed=SmartParser.parse(input,this.lang);
      this.smartPreviewTasks=parsed.map((p,i)=>({
        _id:`prev-${Date.now()}-${i}`,text:p.text,category:p.category,priority:p.priority,
        due_date:p.due_date,due_date_has_time:p.due_date_has_time,due_date_end:p.due_date_end,
        subtasks:(p.subtaskTexts||[]).map(s=>({id:Date.now().toString()+Math.random(),text:s,completed:false})),
        _dateStr:p.due_date?this.getLocalDateStr(p.due_date)||'':'',
        _timeStr:(p.due_date&&p.due_date_has_time)?this.getLocalTimeStr(p.due_date)||'':'',
        _endStr:p.due_date_end?this.getLocalTimeStr(p.due_date_end)||'':'',
      }));
      this.openSmartPreviewModal();
    }catch(err){console.error('[SmartTask]',err);alert(this.t('errorProcessing'));}
    finally{btn.textContent=this.t('smartGenerateBtn');btn.disabled=false;}
  }

  openSmartPreviewModal(){
    const overlay=document.getElementById('smartPreviewOverlay');
    if(!overlay||!this.smartPreviewTasks.length)return;
    const tasksHTML=this.smartPreviewTasks.map((t,idx)=>{
      const pc=this.getPriorityConfig(t.priority);
      const dateDisplay=t.due_date?new Date(t.due_date).toLocaleString(this.getUserLocale(),{dateStyle:'medium',...(t.due_date_has_time?{timeStyle:'short'}:{}),timeZone:this.getUserTimezone()}):this.t('previewNoDate');
      const endDisplay=t.due_date_end?new Date(t.due_date_end).toLocaleTimeString(this.getUserLocale(),{hour:'2-digit',minute:'2-digit',timeZone:this.getUserTimezone()}):'' ;
      const subHTML=t.subtasks.map((s,si)=>`<div class="flex items-center gap-2 py-1 px-2 rounded-lg bg-amber-50/60 dark:bg-zinc-800/60 group"><span class="text-[10px] text-amber-500/60">↳</span><span class="flex-1 text-xs text-amber-900/90 dark:text-amber-100/80">${this.escapeHTML(s.text)}</span><button onclick="organizator.removePreviewSubtask(${idx},${si})" class="text-red-400 hover:text-red-600 text-xs opacity-0 group-hover:opacity-100 transition">✕</button></div>`).join('');
      return`<div class="rounded-xl border border-blue-200/50 dark:border-blue-700/30 bg-white/60 dark:bg-zinc-800/60 overflow-hidden">
        <div class="flex items-center gap-2 px-4 py-2.5 bg-blue-50/70 dark:bg-blue-900/20 border-b border-blue-200/40 dark:border-blue-700/25">
          <span class="text-xs font-bold text-blue-800/70 dark:text-blue-300/70 flex-1">${this.t('previewTaskLabel')} ${idx+1}</span>
          <button onclick="organizator.removePreviewTask(${idx})" class="w-5 h-5 text-red-400/70 hover:text-red-600 text-xs font-bold">✕</button>
        </div>
        <div class="px-4 py-3 space-y-3">
          <input type="text" id="pt-text-${idx}" value="${this.escapeHTML(t.text)}" class="w-full rounded-lg border border-amber-900/20 dark:border-amber-600/30 bg-amber-50/60 dark:bg-zinc-900/70 px-3 py-2 text-sm text-amber-900 dark:text-amber-100 font-serif italic focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition">
          <div class="grid grid-cols-2 gap-2">
            <div class="space-y-1"><label class="text-[10px] font-bold uppercase tracking-wider text-blue-700/60 dark:text-blue-400/60">${this.t('previewCategoryLabel')}</label>
              <input type="text" id="pt-cat-${idx}" value="${this.escapeHTML(t.category)}" class="w-full rounded-lg border border-amber-900/20 dark:border-amber-600/30 bg-amber-50/60 dark:bg-zinc-900/70 px-2.5 py-1.5 text-xs text-[#6b7280] dark:text-amber-100 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition">
            </div>
            <div class="space-y-1"><label class="text-[10px] font-bold uppercase tracking-wider text-blue-700/60 dark:text-blue-400/60">${this.t('previewPriorityLabel')}</label>
              <select id="pt-prio-${idx}" class="w-full rounded-lg border border-amber-900/20 dark:border-amber-600/30 bg-amber-50/60 dark:bg-zinc-900/70 px-2.5 py-1.5 text-xs text-[#6b7280] dark:text-amber-100 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition cursor-pointer">
                <option value="high" ${t.priority==='high'?'selected':''}>${this.t('prioHigh')}</option>
                <option value="medium" ${t.priority==='medium'?'selected':''}>${this.t('prioMedium')}</option>
                <option value="low" ${t.priority==='low'?'selected':''}>${this.t('prioLow')}</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div class="space-y-1"><label class="text-[10px] font-bold uppercase tracking-wider text-blue-700/60 dark:text-blue-400/60">${this.t('previewDateLabel')}</label>
              <input type="date" id="pt-date-${idx}" value="${t._dateStr||''}" style="color-scheme:light dark" class="w-full rounded-lg border border-amber-900/20 dark:border-amber-600/30 bg-amber-50/60 dark:bg-zinc-900/70 px-2.5 py-1.5 text-xs text-[#6b7280] dark:text-amber-100 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition cursor-pointer">
            </div>
            <div class="space-y-1"><label class="text-[10px] font-bold uppercase tracking-wider text-blue-700/60 dark:text-blue-400/60">${this.t('previewTimeLabel')}</label>
              <input type="time" id="pt-time-${idx}" value="${t._timeStr||''}" style="color-scheme:light dark" class="w-full rounded-lg border border-amber-900/20 dark:border-amber-600/30 bg-amber-50/60 dark:bg-zinc-900/70 px-2.5 py-1.5 text-xs text-[#6b7280] dark:text-amber-100 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition cursor-pointer">
            </div>
            ${t.due_date_end?`<div class="space-y-1 col-span-2 sm:col-span-1"><label class="text-[10px] font-bold uppercase tracking-wider text-violet-700/60 dark:text-violet-400/60">${this.t('previewTimeEnd')}</label>
              <input type="time" id="pt-end-${idx}" value="${t._endStr||''}" style="color-scheme:light dark" class="w-full rounded-lg border border-violet-400/30 dark:border-violet-600/30 bg-violet-50/50 dark:bg-zinc-900/70 px-2.5 py-1.5 text-xs text-[#6b7280] dark:text-amber-100 focus:outline-none focus:ring-2 focus:ring-violet-400/50 transition cursor-pointer">
            </div>`:''}
          </div>
          ${t.due_date?`<div class="flex items-center gap-2 text-[10px] bg-blue-50/50 dark:bg-blue-900/20 rounded-lg px-2.5 py-1.5 text-blue-700/70 dark:text-blue-300/70"><span>📅</span><span>${dateDisplay}${endDisplay?` → ${endDisplay}`:''}</span>${!t.due_date_has_time?`<span class="ml-auto opacity-50 italic">→ 23:59</span>`:''}</div>`:''}
          <div class="space-y-1.5"><label class="text-[10px] font-bold uppercase tracking-wider text-blue-700/60 dark:text-blue-400/60">${this.t('previewSubtasksLabel')}</label>
            <div id="pt-subs-${idx}" class="space-y-1">${subHTML}</div>
            <div class="flex gap-2">
              <input type="text" id="pt-subinput-${idx}" placeholder="${this.t('addSubtaskPlaceholder')}" class="flex-1 rounded-lg border border-blue-200/40 dark:border-blue-700/30 bg-white/60 dark:bg-zinc-900/60 px-2.5 py-1.5 text-xs text-[#6b7280] dark:text-amber-100 focus:outline-none focus:ring-2 focus:ring-blue-400/40 transition" onkeypress="if(event.key==='Enter'){organizator.addPreviewSubtask(${idx});event.preventDefault();}">
              <button onclick="organizator.addPreviewSubtask(${idx})" class="shrink-0 px-2.5 py-1.5 rounded-lg bg-blue-500/70 hover:bg-blue-600/80 text-white text-xs font-bold transition">+</button>
            </div>
          </div>
        </div>
      </div>`;
    }).join('');

    overlay.innerHTML=`<div class="fixed inset-0 bg-black/65 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onclick="if(event.target===this)organizator.cancelSmartPreview()">
      <div class="relative w-full max-w-2xl bg-parchment/98 dark:bg-zinc-900/98 rounded-2xl shadow-2xl border-2 border-blue-400/40 dark:border-blue-500/35 flex flex-col max-h-[90vh]" onclick="event.stopPropagation()">
        <div class="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-600/90 via-violet-600/80 to-fuchsia-600/70 text-white rounded-t-2xl shrink-0">
          <span class="text-xl">🔍</span>
          <div class="flex-1"><h3 class="font-bold text-sm tracking-wide">${this.t('previewTitle')}</h3><p class="text-[11px] opacity-80 mt-0.5">${this.smartPreviewTasks.length} ${this.smartPreviewTasks.length===1?this.t('previewTaskLabel').toLowerCase():'tarefas'} detectada(s)</p></div>
          <button onclick="organizator.cancelSmartPreview()" class="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center font-bold text-sm transition">✕</button>
        </div>
        <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4">${tasksHTML}
          <button onclick="organizator.addEmptyPreviewTask()" class="w-full py-2 rounded-xl border-2 border-dashed border-blue-300/50 dark:border-blue-600/35 text-blue-600/60 dark:text-blue-400/50 text-xs font-semibold hover:border-blue-400/70 hover:text-blue-700/80 dark:hover:text-blue-300/70 transition">＋ ${this.t('previewAddTask')}</button>
        </div>
        <div class="flex gap-3 px-6 py-4 border-t border-blue-200/30 dark:border-blue-700/25 bg-blue-50/20 dark:bg-blue-950/15 rounded-b-2xl shrink-0">
          <button onclick="organizator.confirmSmartTask()" class="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition">${this.t('previewConfirmBtn')}</button>
          <button onclick="organizator.cancelSmartPreview()" class="px-4 py-2.5 rounded-xl border border-red-300/50 dark:border-red-600/35 text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20 font-bold text-sm transition">${this.t('previewCancelBtn')}</button>
        </div>
      </div>
    </div>`;
    overlay.classList.remove('hidden');
    document.body.style.overflow='hidden';
  }

  addPreviewSubtask(idx){const input=document.getElementById(`pt-subinput-${idx}`);if(!input)return;const text=input.value.trim();if(!text)return;if(this.smartPreviewTasks[idx])this.smartPreviewTasks[idx].subtasks.push({id:Date.now().toString(),text,completed:false});input.value='';this.openSmartPreviewModal();setTimeout(()=>document.getElementById(`pt-subinput-${idx}`)?.focus(),50);}
  removePreviewSubtask(ti,si){if(this.smartPreviewTasks[ti])this.smartPreviewTasks[ti].subtasks.splice(si,1);this.openSmartPreviewModal();}
  removePreviewTask(idx){this.smartPreviewTasks.splice(idx,1);if(!this.smartPreviewTasks.length){this.cancelSmartPreview();return;}this.openSmartPreviewModal();}
  addEmptyPreviewTask(){this.smartPreviewTasks.push({_id:`prev-${Date.now()}`,text:'',category:'General',priority:'medium',due_date:null,due_date_has_time:false,due_date_end:null,subtasks:[],_dateStr:'',_timeStr:'',_endStr:''});this.openSmartPreviewModal();setTimeout(()=>document.getElementById(`pt-text-${this.smartPreviewTasks.length-1}`)?.focus(),80);}

  confirmSmartTask(){
    const newTasks=[];
    this.smartPreviewTasks.forEach((t,idx)=>{
      const text=(document.getElementById(`pt-text-${idx}`)?.value||t.text).trim();if(!text)return;
      const rawCat=(document.getElementById(`pt-cat-${idx}`)?.value||t.category);
      const category=this.normalizeCategory(rawCat)||'General';
      const priority=document.getElementById(`pt-prio-${idx}`)?.value||t.priority;
      const dateVal=document.getElementById(`pt-date-${idx}`)?.value||t._dateStr;
      const timeVal=document.getElementById(`pt-time-${idx}`)?.value||t._timeStr;
      const endVal=document.getElementById(`pt-end-${idx}`)?.value||t._endStr;
      const newTask={id:Date.now().toString()+Math.random(),text,category,priority,completed:false,subtasks:t.subtasks.slice()};
      if(dateVal){const r=this.buildDueDate(dateVal,timeVal);if(r){newTask.due_date=r.iso;newTask.due_date_has_time=r.hasTime;}}
      if(t.due_date_end&&endVal&&dateVal)newTask.due_date_end=new Date(`${dateVal}T${endVal}:00`).toISOString();
      newTasks.push(newTask);
    });
    newTasks.reverse().forEach(t=>this.tasks.unshift(t));
    this.saveTasks();this.cancelSmartPreview();
    const first=newTasks.find(t=>t.due_date);
    if(first){const ld=this.getLocalDay(first.due_date);if(ld)this.calendarDate=new Date(ld.year,ld.month-1,1);}
    this.renderCalendar();this.render();
    const pi=document.getElementById('smartTaskPrompt');if(pi)pi.value='';
  }
  cancelSmartPreview(){
    this.smartPreviewTasks=[];
    const ov=document.getElementById('smartPreviewOverlay');
    if(ov){ov.innerHTML='';ov.classList.add('hidden');}
    document.body.style.overflow='';
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  init(){
    this.loadTheme();this.applyTranslations();this.renderStatusFilters();this.renderCalendar();
    this.bindEvents();this.render();this.setActiveTab('manual');
  }

  // ── Multi-subtask builder ─────────────────────────────────────────────────
  addPendingSubtask(){const input=document.getElementById('newSubtaskInput');if(!input)return;const text=input.value.trim();if(!text)return;this.pendingSubtasks.push(text);input.value='';input.focus();this.renderPendingSubtasks();}
  removePendingSubtask(idx){this.pendingSubtasks.splice(idx,1);this.renderPendingSubtasks();}
  renderPendingSubtasks(){
    const c=document.getElementById('pendingSubtasksContainer');if(!c)return;
    if(!this.pendingSubtasks.length){c.innerHTML='';return;}
    c.innerHTML=`<div class="flex flex-wrap gap-1.5 mt-2 px-1">${this.pendingSubtasks.map((s,i)=>`<span class="inline-flex items-center gap-1 text-xs bg-amber-200/80 dark:bg-zinc-700/80 text-amber-900 dark:text-amber-100 rounded-full px-2.5 py-1 border border-amber-400/40 dark:border-amber-600/30">${this.escapeHTML(s)}<button onclick="organizator.removePendingSubtask(${i})" class="ml-0.5 text-amber-600/70 hover:text-red-500 font-bold text-[10px] leading-none">✕</button></span>`).join('')}<span class="text-[10px] text-amber-600/60 dark:text-amber-400/50 self-center italic">${this.pendingSubtasks.length} ${this.t('subtasksAdded')}</span></div>`;
  }

  // ── Subtask methods ───────────────────────────────────────────────────────
  addSubtask(tid){const input=document.getElementById(`subtask-input-${tid}`);if(!input)return;const text=input.value.trim();if(!text)return;const task=this.tasks.find(t=>t.id===tid);if(!task)return;if(!task.subtasks)task.subtasks=[];task.subtasks.push({id:Date.now().toString(),text,completed:false});this.saveTasks();input.value='';this.openSubtaskPanels.add(tid);this.render();}
  toggleSubtask(tid,sid){const task=this.tasks.find(t=>t.id===tid);if(!task?.subtasks)return;const sub=task.subtasks.find(s=>s.id===sid);if(!sub)return;sub.completed=!sub.completed;task.completed=task.subtasks.length>0&&task.subtasks.every(s=>s.completed);this.saveTasks();this.openSubtaskPanels.add(tid);this.render();}
  toggleSubtaskPanel(tid){this.openSubtaskPanels.has(tid)?this.openSubtaskPanels.delete(tid):this.openSubtaskPanels.add(tid);document.getElementById(`subtasks-panel-${tid}`)?.classList.toggle('open',this.openSubtaskPanels.has(tid));const a=document.getElementById(`subtask-arrow-${tid}`);if(a)a.textContent=this.openSubtaskPanels.has(tid)?'▲':'▼';}
  editSubtask(tid,sid){const task=this.tasks.find(t=>t.id===tid);if(!task?.subtasks)return;const sub=task.subtasks.find(s=>s.id===sid);if(!sub)return;const v=prompt(this.t('editSubtaskPrompt'),sub.text);if(v===null)return;const c=v.trim();if(c){sub.text=c;this.saveTasks();this.openSubtaskPanels.add(tid);this.render();}}
  deleteSubtask(tid,sid){const task=this.tasks.find(t=>t.id===tid);if(!task?.subtasks)return;if(!confirm(this.t('confirmDeleteSubtask')))return;task.subtasks=task.subtasks.filter(s=>s.id!==sid);this.saveTasks();this.openSubtaskPanels.add(tid);this.render();}

  // ── HTML builders ─────────────────────────────────────────────────────────
  buildProgressHTML(prog){
    const c=prog.pct===100?'bg-emerald-500':prog.pct>=50?'bg-amber-500':'bg-red-400';
    return`<div class="flex items-center gap-2"><span class="text-[10px] uppercase tracking-wider text-amber-700/70 dark:text-amber-400/70 shrink-0 hidden sm:inline">${this.t('progressLabel')}</span><div class="flex-1 h-2 rounded-full bg-amber-200/60 dark:bg-zinc-700/60 overflow-hidden min-w-[50px]"><div class="progress-fill h-full rounded-full ${c}" style="width:${prog.pct}%"></div></div><span class="text-[10px] font-bold text-amber-800 dark:text-amber-300 shrink-0">${prog.done}/${prog.total}</span></div>`;
  }
  buildSubtaskListHTML(task){
    if(!task.subtasks?.length)return'';
    return task.subtasks.map(sub=>`<div class="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-amber-100/50 dark:hover:bg-zinc-700/40 group transition"><input type="checkbox" id="sub-${sub.id}" class="h-4 w-4 rounded accent-emerald-600 cursor-pointer shrink-0" ${sub.completed?'checked':''} onchange="organizator.toggleSubtask('${task.id}','${sub.id}')"><label for="sub-${sub.id}" class="flex-1 text-sm text-amber-900/90 dark:text-amber-100/80 cursor-pointer select-none ${sub.completed?'line-through opacity-55':''}" ondblclick="organizator.editSubtask('${task.id}','${sub.id}')" title="${this.t('dblClickHint')}">${this.escapeHTML(sub.text)}</label><button class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition text-xs shrink-0" onclick="organizator.deleteSubtask('${task.id}','${sub.id}')">✕</button></div>`).join('');
  }

  // ── Fixed: only date+time inputs, no duplicate badge row ──────────────────
  buildDeadlineHTML(task){
    const urgent=this.isUrgent(task),overdue=this.isOverdue(task),hasDate=!!task.due_date;
    const dateId=`due-date-${task.id}`,timeId=`due-time-${task.id}`;
    const dateVal=hasDate?(this.getLocalDateStr(task.due_date)||''):'';
    const timeVal=(hasDate&&task.due_date_has_time)?(this.getLocalTimeStr(task.due_date)||''):'';
    // Badge classes for urgent/overdue inline status (shown next to inputs)
    const statusBadge=overdue
      ?`<span class="text-[10px] font-black text-red-600 dark:text-red-400 uppercase whitespace-nowrap">❌ ${this.t('overdueBadge')}</span>`
      :urgent
      ?`<span class="text-[10px] font-black text-orange-500 dark:text-orange-400 uppercase whitespace-nowrap animate-pulse">⚠️ ${this.t('urgentBadge')}</span>`
      :'';
    return`<div class="mt-2 mb-1">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-[10px] text-amber-700/50 dark:text-amber-400/50 font-semibold select-none shrink-0">📅</span>
        <input type="date" id="${dateId}" value="${dateVal}" style="color-scheme:light dark"
          class="rounded-lg border ${overdue?'border-red-400/60':urgent?'border-orange-400/60':'border-amber-900/20 dark:border-amber-600/25'} bg-amber-50/40 dark:bg-zinc-900/50 px-2 py-1 text-xs text-[#6b7280] dark:text-amber-100/80 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition cursor-pointer"
          onchange="organizator.setTaskDueDate('${task.id}',this.value,document.getElementById('${timeId}')?.value||'')">
        <input type="time" id="${timeId}" value="${timeVal}" style="color-scheme:light dark"
          class="rounded-lg border border-amber-900/20 dark:border-amber-600/25 bg-amber-50/40 dark:bg-zinc-900/50 px-2 py-1 text-xs text-[#6b7280] dark:text-amber-100/80 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition cursor-pointer"
          onchange="organizator.setTaskDueDate('${task.id}',document.getElementById('${dateId}')?.value||'',this.value)">
        ${hasDate?`<button onclick="organizator.removeTaskDueDate('${task.id}')" class="text-[10px] text-red-400/60 hover:text-red-500 transition font-black shrink-0">✕</button>`:''}
        ${statusBadge}
        ${hasDate&&task.due_date_end?`<span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-200/70 dark:bg-violet-800/40 text-violet-700 dark:text-violet-300">⏱</span>`:''}
      </div>
    </div>`;
  }

  generateTaskHTML(task){
    const isSel=this.selectedTasks.has(task.id),isExp=this.expandedTasks.has(task.id),isOpen=this.openSubtaskPanels.has(task.id);
    const urgent=this.isUrgent(task),overdue=this.isOverdue(task),strike=task.completed?'line-through opacity-60':'';
    const pc=this.getPriorityConfig(task.priority),prog=this.getSubtaskProgress(task),sCount=(task.subtasks||[]).length;
    const ring=urgent?'ring-2 ring-orange-400/70':overdue?'ring-2 ring-red-500/60':'';
    return`<article data-id="${task.id}" draggable="${!this.sortedByDeadline}" class="task-item cursor-move relative bg-gradient-to-br from-amber-50/80 via-amber-100/60 to-amber-50/70 dark:from-zinc-800/70 dark:via-zinc-700/60 dark:to-zinc-800/50 border border-amber-800/30 dark:border-amber-400/40 border-l-8 border-amber-900/60 dark:border-amber-300/50 shadow-[8px_8px_16px_rgba(0,0,0,0.3)] rounded-2xl p-5 pt-8 pb-4 transition-all duration-200 ${ring} ${isSel?'ring-2 ring-blue-500/60 scale-[1.01]':''}">
      ${overdue&&!task.completed?`<div class="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none"><span class="bg-red-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md tracking-wide">❌ ${this.t('overdueBadge')}</span></div>`:urgent?`<div class="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none"><span class="bg-orange-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md animate-pulse tracking-wide">⚠️ ${this.t('urgentBadge')}</span></div>`:''}
      <div class="absolute -top-3 -left-4 z-10"><input type="checkbox" id="sel-${task.id}" class="peer sr-only" ${isSel?'checked':''} onchange="organizator.toggleSelection('${task.id}')"><label for="sel-${task.id}" class="flex items-center justify-center w-6 h-6 rounded-full border-2 border-amber-900/40 dark:border-amber-400/40 bg-amber-50/90 dark:bg-zinc-800/90 shadow-md cursor-pointer hover:scale-110 transition-all peer-checked:border-blue-500"><span class="w-3 h-3 rounded-full bg-blue-500 dark:bg-blue-400 scale-0 peer-checked:scale-100 transition-transform duration-200"></span></label></div>
      <button class="absolute -top-3 -right-4 w-7 h-7 rounded-full bg-red-700 text-amber-50 text-sm font-bold shadow-md hover:bg-red-800 transition" onclick="organizator.deleteTask('${task.id}')">✕</button>
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-amber-900/20 dark:border-amber-400/30 mb-3">
        <div class="flex-1 min-w-0 pr-2">
          <p id="text-${task.id}" data-id="${task.id}" class="task-text text-base sm:text-lg font-serif italic text-amber-900/95 dark:text-amber-100/90 break-words cursor-pointer select-none leading-snug ${isExp?'':'line-clamp-4 md:line-clamp-5'} ${strike}" ondblclick="organizator.editTask('${task.id}')" title="${this.t('dblClickHint')}">${this.escapeHTML(task.text.trim())}</p>
          <button id="expand-btn-${task.id}" class="text-xs font-sans font-bold text-blue-700 dark:text-blue-400 hover:underline mt-1 hidden" onclick="organizator.toggleExpand('${task.id}')">${isExp?this.t('expandLess'):this.t('expandMore')}</button>
        </div>
        <label class="self-start w-fit relative shrink-0 inline-flex items-center gap-2 text-xs sm:text-sm rounded-full border border-amber-900/50 dark:border-amber-400/60 bg-amber-50/80 dark:bg-zinc-900/80 px-4 py-2 cursor-pointer hover:bg-amber-100/50">
          ${this.t('priorityLabel')}: <span class="text-xs font-semibold px-2 py-1 rounded-full ml-1 text-white ${pc.color}">${this.t(pc.textKey)}</span>
          <select class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onchange="organizator.updatePriority('${task.id}',this.value)">
            <option value="high" ${task.priority==='high'?'selected':''}>${this.t('prioHigh')}</option>
            <option value="medium" ${task.priority==='medium'?'selected':''}>${this.t('prioMedium')}</option>
            <option value="low" ${task.priority==='low'?'selected':''}>${this.t('prioLow')}</option>
          </select>
        </label>
      </div>
      <div class="flex items-center justify-between flex-wrap gap-2 mb-1">
        <p class="text-xs sm:text-sm text-amber-700/80 dark:text-amber-300/70 font-serif italic flex items-center gap-1 cursor-pointer select-none" ondblclick="organizator.editCategory('${task.id}')" title="${this.t('dblClickHint')}">📓 <span>${this.escapeHTML(task.category)}</span></p>
        <button onclick="organizator.toggleSubtaskPanel('${task.id}')" class="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition ${isOpen?'bg-amber-200/80 dark:bg-amber-700/70 border-amber-700/50 text-amber-900 dark:text-amber-50':'bg-amber-50/60 dark:bg-zinc-800/60 border-amber-700/30 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100/70'}" aria-expanded="${isOpen}">☰ ${this.t('subtasksToggle')}${sCount>0?`<span class="bg-amber-600/80 text-white rounded-full px-1.5 py-0.5 text-[10px] leading-none">${sCount}</span>`:''}<span id="subtask-arrow-${task.id}" class="text-[10px]">${isOpen?'▲':'▼'}</span></button>
      </div>
      ${this.buildDeadlineHTML(task)}
      <div id="subtasks-panel-${task.id}" class="subtasks-panel ${isOpen?'open':''}"><div class="subtasks-inner"><div class="mt-2 pt-3 border-t border-amber-900/15 dark:border-amber-400/20 mb-3">
        <p class="text-xs uppercase tracking-wider text-amber-700/60 dark:text-amber-400/60 mb-2 px-1">${this.t('subtasksTitle')}</p>
        <div id="subtask-list-${task.id}" class="space-y-0.5 mb-3">${this.buildSubtaskListHTML(task)}</div>
        <div class="flex gap-2 items-center"><input type="text" id="subtask-input-${task.id}" placeholder="${this.t('addSubtaskPlaceholder')}" class="flex-1 rounded-md border border-amber-900/30 dark:border-amber-600/40 bg-amber-50/50 dark:bg-zinc-900/70 px-3 py-2 text-xs text-[#6b7280] dark:text-amber-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/60 transition" onkeypress="if(event.key==='Enter') organizator.addSubtask('${task.id}')"><button onclick="organizator.addSubtask('${task.id}')" class="shrink-0 px-3 py-2 rounded-md bg-amber-500/80 hover:bg-amber-600/90 text-amber-950 text-xs font-bold shadow transition active:scale-95">${this.t('addSubtaskBtn')}</button></div>
      </div></div></div>
      <div class="flex items-center gap-3 pt-3 mt-1 border-t border-amber-900/10 dark:border-amber-400/15">
        <div id="progress-wrap-${task.id}" class="min-w-0 max-w-[52%] flex-1">${prog?this.buildProgressHTML(prog):''}</div>
        <div class="flex-1"></div>
        <label class="flex items-center gap-2 cursor-pointer bg-amber-100/80 dark:bg-amber-700/70 px-3 py-1.5 rounded-md border-2 border-emerald-600/40 dark:border-emerald-400/40 shadow hover:bg-amber-200/90 dark:hover:bg-amber-600/80 transition shrink-0 select-none">
          <input type="checkbox" id="task-chk-${task.id}" class="h-4 w-4 cursor-pointer accent-emerald-600" ${task.completed?'checked':''} onchange="organizator.toggleTask('${task.id}')">
          <span class="text-xs font-semibold text-emerald-800 dark:text-emerald-200">${this.t('markDone')}</span>
        </label>
      </div>
    </article>`;
  }

  // ── Render ────────────────────────────────────────────────────────────────
  renderStatusFilters(){
    // Render to both desktop sidebar and mobile drawer
    const html=this.statusFilters.map(f=>{
      const on=this.currentFilter===f.id;
      return`<button class="filter-btn text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full border transition ${on?`border-${f.color}-900/40 bg-${f.color}-100/80 dark:bg-${f.color}-700/70 text-ink dark:text-${f.color}-50 shadow-sm`:`border-${f.color}-700/60 bg-transparent text-${f.color}-800 dark:text-${f.color}-200 hover:bg-${f.color}-100/30`}" data-filter="${f.id}">${this.t(f.labelKey)}</button>`;
    }).join('');
    ['statusFiltersContainer','statusFiltersContainerMobile'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML=html;});
  }

  renderCategoryFilters(){
    // Case-insensitive deduplication: track seen categories by lowercase key
    const seenLower=new Set(),cats=['all'],catMap=new Map(); // lowercase → display name
    catMap.set('all','all');
    this.tasks.forEach(t=>{
      const low=t.category.toLowerCase();
      if(!seenLower.has(low)){seenLower.add(low);cats.push(t.category);catMap.set(low,t.category);}
    });

    const currentLow=this.currentCategory==='all'?'all':this.currentCategory.toLowerCase();
    let btns='',sel='';
    cats.forEach(cat=>{
      const low=cat==='all'?'all':cat.toLowerCase();
      const on=low===currentLow;
      const label=cat==='all'?this.t('filterAll'):cat;
      const cls=cat==='all'?(on?'bg-amber-200/90 dark:bg-amber-700/80 border-amber-900/60 text-amber-900 dark:text-amber-50':'bg-amber-100/60 dark:bg-amber-800/40 border-amber-900/30 text-amber-800 dark:text-amber-200 hover:bg-amber-200/60'):(on?'bg-blue-200/90 dark:bg-blue-800/80 border-blue-600/60 text-blue-900 dark:text-blue-50':'bg-blue-50/70 dark:bg-blue-900/40 border-blue-400/50 text-blue-800 dark:text-blue-200 hover:bg-blue-100');
      btns+=`<button class="cat-filter-btn ${cls} text-xs font-semibold px-3 py-1.5 rounded-full border shadow-sm transition min-w-[55px]" data-category="${cat}">${label}</button>`;
      if(cat!=='all')sel+=`<option value="${cat}">${this.escapeHTML(cat)}</option>`;
    });
    sel+=`<option value="nueva">${this.t('writeNew')}</option>`;

    // Render to both locations
    ['categoryFilterContainer','categoryFilterContainerMobile'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML=btns;});

    const catSelect=document.getElementById('newCategorySelect');
    if(catSelect){
      const cur=catSelect.value;catSelect.innerHTML=sel;
      // Match current value case-insensitively
      const curLow=cur.toLowerCase();
      const match=cats.find(c=>c.toLowerCase()===curLow&&c!=='all');
      if(match&&match!=='nueva')catSelect.value=match;
      else catSelect.value=cats.length>1?cats[1]:'General';
    }
    const ti=document.getElementById('newCategoryText'),cb=document.getElementById('cancelNewCatBtn');
    if(ti&&cb&&catSelect){
      ti.addEventListener('input',()=>cb.classList.toggle('hidden',ti.classList.contains('hidden')));
      catSelect.addEventListener('change',()=>cb.classList.toggle('hidden',ti.classList.contains('hidden')));
    }
  }

  render(){
    const container=document.getElementById('tasksContainer');if(!container)return;
    this.updateStats();this.renderCategoryFilters();this.updateBulkActionUI();
    let filtered=this.tasks.filter(t=>this.matchesFilter(t));
    if(this.sortedByDeadline)filtered=[...filtered].sort((a,b)=>(a.due_date?new Date(a.due_date).getTime():Infinity)-(b.due_date?new Date(b.due_date).getTime():Infinity));
    if(!filtered.length){
      const msg=this.calendarDayFilter?`<div class="text-center py-6 text-[#6b7280] dark:text-amber-300">📅 Sin tareas este día.<br><button class="mt-2 text-xs text-blue-600 dark:text-blue-400 underline" onclick="organizator.clearCalendarDayFilter()">${this.t('calClearFilter')}</button></div>`:`<div class="text-center py-8 text-[#6b7280] dark:text-amber-300">${this.searchTerm?this.t('noTasksSearch'):this.t('noTasks')}</div>`;
      container.innerHTML=`<h2 class="text-xl font-semibold tracking-wide text-amber-900 dark:text-amber-100 mb-2">${this.t('taskListTitle')}</h2>${msg}`;return;
    }
    container.innerHTML=`<h2 class="text-xl font-semibold tracking-wide text-amber-900 dark:text-amber-100 mb-2">${this.t('taskListTitle')}</h2>`+filtered.map(t=>this.generateTaskHTML(t)).join('');
    setTimeout(()=>{container.querySelectorAll('.task-text').forEach(el=>{const btn=document.getElementById(`expand-btn-${el.dataset.id}`);if(btn&&(this.expandedTasks.has(el.dataset.id)||el.scrollHeight>el.clientHeight))btn.classList.remove('hidden');});},50);
  }

  // ── Events ────────────────────────────────────────────────────────────────
  bindEvents(){
    document.getElementById('manualTabBtn')?.addEventListener('click',()=>this.setActiveTab('manual'));
    document.getElementById('smartTabBtn')?.addEventListener('click',()=>this.setActiveTab('smart'));
    document.getElementById('themeToggleFixed')?.addEventListener('click',()=>this.toggleTheme());
    document.getElementById('addTaskBtn')?.addEventListener('click',()=>this.addTask());
    document.getElementById('newTaskInput')?.addEventListener('keypress',e=>{if(e.key==='Enter')this.addTask();});
    document.getElementById('smartTaskActionBtn')?.addEventListener('click',()=>this.executeSmartTask());
    document.getElementById('smartTaskPrompt')?.addEventListener('keypress',e=>{if(e.key==='Enter')this.executeSmartTask();});
    // Search — both desktop sidebar and mobile drawer
    ['searchInput','searchInputMobile'].forEach(id=>{
      document.getElementById(id)?.addEventListener('input',e=>{
        this.searchTerm=e.target.value.toLowerCase();
        // sync the other input
        const other=id==='searchInput'?'searchInputMobile':'searchInput';
        const otherEl=document.getElementById(other);if(otherEl)otherEl.value=e.target.value;
        this.render();
      });
    });
    document.getElementById('selectAllBtn')?.addEventListener('click',()=>this.toggleSelectAll());
    document.getElementById('completeActionBtn')?.addEventListener('click',()=>this.executeCompleteAction());
    document.getElementById('deleteActionBtn')?.addEventListener('click',()=>this.executeDeleteAction());
    document.getElementById('sortByDeadlineBtn')?.addEventListener('click',()=>this.toggleSortByDeadline());
    document.getElementById('calPrevBtn')?.addEventListener('click',()=>this.navigateCalendar(-1));
    document.getElementById('calNextBtn')?.addEventListener('click',()=>this.navigateCalendar(+1));
    // Mobile calendar controls
    document.getElementById('calPrevBtnMobile')?.addEventListener('click',()=>this.navigateCalendar(-1));
    document.getElementById('calNextBtnMobile')?.addEventListener('click',()=>this.navigateCalendar(+1));
    document.getElementById('mobileCalToggleBtn')?.addEventListener('click',()=>this.toggleMobileCalendar());
    // Mobile drawer
    document.getElementById('mobileMenuBtn')?.addEventListener('click',()=>this.toggleMobileDrawer());
    document.getElementById('mobileDrawerBackdrop')?.addEventListener('click',()=>this.closeMobileDrawer());
    document.getElementById('addSubtaskBtn')?.addEventListener('click',()=>this.addPendingSubtask());
    document.getElementById('newSubtaskInput')?.addEventListener('keypress',e=>{if(e.key==='Enter'){e.preventDefault();this.addPendingSubtask();}});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(this.smartPreviewTasks.length)this.cancelSmartPreview();else if(this.mobileDrawerOpen)this.closeMobileDrawer();}});
    document.addEventListener('click',e=>{
      if(e.target.classList.contains('filter-btn')){this.currentFilter=e.target.dataset.filter;this.selectedTasks.clear();this.renderStatusFilters();this.render();}
      if(e.target.classList.contains('cat-filter-btn')){this.currentCategory=e.target.dataset.category;this.selectedTasks.clear();this.render();}
    });
    const dnd=document.getElementById('tasksContainer');
    if(dnd){
      dnd.addEventListener('dragstart',e=>{if(this.sortedByDeadline)return;const it=e.target.closest('.task-item');if(!it)return;this.draggedId=it.dataset.id;setTimeout(()=>it.classList.add('opacity-40','scale-95'),0);});
      dnd.addEventListener('dragover',e=>e.preventDefault());
      dnd.addEventListener('drop',e=>{e.preventDefault();const it=e.target.closest('.task-item');if(it&&this.draggedId&&it.dataset.id!==this.draggedId)this.reorderTasks(this.draggedId,it.dataset.id);});
      dnd.addEventListener('dragend',e=>{e.target.closest('.task-item')?.classList.remove('opacity-40','scale-95');this.draggedId=null;});
    }
  }

  // ── Theme ─────────────────────────────────────────────────────────────────
loadTheme() {
  const isDark = storageManager.loadTheme('light') === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.classList.toggle('light', !isDark);
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';

  // Ícone do botão fixo (desktop)
  const ti = document.getElementById('themeIconFixed');
  if (ti) ti.textContent = isDark ? '☀️' : '🌙';

  // Ícone e label do botão no drawer mobile
  const icon = document.getElementById('drawerThemeIcon');
  const label = document.getElementById('drawerThemeLabel');
  if (icon) icon.textContent = isDark ? '☀️' : '🌙';
  if (label) label.textContent = isDark ? this.t('lightMode') : this.t('darkMode');
}

toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  storageManager.saveTheme(isDark ? 'light' : 'dark');
  this.loadTheme();
}

  // ── Task CRUD ─────────────────────────────────────────────────────────────
  addTask(){
    const titleEl=document.getElementById('newTaskInput'),prioEl=document.getElementById('newPriorityInput');
    const catSel=document.getElementById('newCategorySelect'),catText=document.getElementById('newCategoryText');
    const dateEl=document.getElementById('newTaskDate'),timeEl=document.getElementById('newTaskTime'),cancelBtn=document.getElementById('cancelNewCatBtn');
    const text=titleEl?.value.trim();if(!text){titleEl?.focus();return;}
    // Case-insensitive duplicate detection
    const isDuplicate=this.tasks.some(t=>t.text.toLowerCase().trim()===text.toLowerCase().trim());
    if(isDuplicate){alert(this.t('duplicateTask'));titleEl?.focus();return;}
    const priority=prioEl?.value||'medium';
    let rawCat='General';
    if(catText&&!catText.classList.contains('hidden')&&catText.value.trim())rawCat=catText.value.trim();
    else if(catSel?.value&&catSel.value!=='nueva')rawCat=catSel.value;
    // Normalize category: merge case-insensitive duplicates by finding existing match
    const existingCat=this.tasks.find(t=>t.category.toLowerCase()===rawCat.toLowerCase());
    const category=existingCat?existingCat.category:this.normalizeCategory(rawCat);
    const subtasks=this.pendingSubtasks.map(s=>({id:Date.now().toString()+Math.random(),text:s,completed:false}));this.pendingSubtasks=[];
    const newTask={id:Date.now().toString(),text,category,priority,completed:false,subtasks};
    if(dateEl?.value){const r=this.buildDueDate(dateEl.value,timeEl?.value||'');if(r){newTask.due_date=r.iso;newTask.due_date_has_time=r.hasTime;}}
    this.tasks.unshift(newTask);this.saveTasks();
    if(titleEl)titleEl.value='';if(prioEl)prioEl.value='medium';if(dateEl)dateEl.value='';if(timeEl)timeEl.value='';
    if(catText){catText.value='';catText.classList.add('hidden');}if(cancelBtn)cancelBtn.classList.add('hidden');if(catSel)catSel.classList.remove('hidden');
    this.renderPendingSubtasks();titleEl?.focus();this.renderCalendar();this.render();
  }
  editTask(id){const t=this.tasks.find(t=>t.id===id);if(!t)return;const v=prompt(this.t('editTaskPrompt'),t.text);if(v?.trim()){t.text=v.trim();this.saveTasks();this.render();}}
  editCategory(id){
    const t=this.tasks.find(t=>t.id===id);if(!t)return;
    const v=prompt(this.t('editCategoryPrompt'),t.category);if(!v?.trim())return;
    // Merge case-insensitively: reuse existing category name if match found
    const existing=this.tasks.find(other=>other.id!==id&&other.category.toLowerCase()===v.trim().toLowerCase());
    t.category=existing?existing.category:this.normalizeCategory(v);
    this.saveTasks();this.render();
  }
  toggleExpand(id){this.expandedTasks.has(id)?this.expandedTasks.delete(id):this.expandedTasks.add(id);this.render();}
  toggleTask(tid){const task=this.tasks.find(t=>t.id===tid);if(!task)return;task.completed=!task.completed;if(task.subtasks?.length)task.subtasks.forEach(s=>s.completed=task.completed);this.saveTasks();this.render();}
  updatePriority(id,p){const t=this.tasks.find(t=>t.id===id);if(t){t.priority=p;this.saveTasks();this.render();}}
  deleteTask(id){const t=this.tasks.find(t=>t.id===id);if(!t)return;if(confirm(`${this.t('confirmDelete')}${t.text}${this.t('confirmDeleteSuffix')}`)){this.tasks=this.tasks.filter(t=>t.id!==id);this.selectedTasks.delete(id);this.expandedTasks.delete(id);this.openSubtaskPanels.delete(id);this.saveTasks();this.renderCalendar();this.render();}}
  reorderTasks(dId,tId){const di=this.tasks.findIndex(t=>t.id===dId),ti=this.tasks.findIndex(t=>t.id===tId);if(di>-1&&ti>-1){const[dt]=this.tasks.splice(di,1);this.tasks.splice(ti,0,dt);this.saveTasks();this.render();}}
  toggleSelection(id){this.selectedTasks.has(id)?this.selectedTasks.delete(id):this.selectedTasks.add(id);this.updateBulkActionUI();this.render();}
  toggleSelectAll(){const f=this.tasks.filter(t=>this.matchesFilter(t));const all=f.length>0&&f.every(t=>this.selectedTasks.has(t.id));f.forEach(t=>all?this.selectedTasks.delete(t.id):this.selectedTasks.add(t.id));this.render();}
  executeCompleteAction(){const f=this.tasks.filter(t=>this.matchesFilter(t));const targets=this.selectedTasks.size>0?this.tasks.filter(t=>this.selectedTasks.has(t.id)):f;if(!targets.length)return;const ns=!targets.every(t=>t.completed);targets.forEach(t=>{t.completed=ns;if(t.subtasks?.length)t.subtasks.forEach(s=>s.completed=ns);});this.selectedTasks.clear();this.saveTasks();this.render();}
  executeDeleteAction(){if(this.selectedTasks.size>0){if(confirm(`${this.t('confirmDeleteMultiple')}${this.selectedTasks.size}${this.t('confirmDeleteMultipleSuffix')}`)){this.tasks=this.tasks.filter(t=>!this.selectedTasks.has(t.id));this.selectedTasks.clear();}else return;}else{const count=this.tasks.filter(t=>t.completed).length;if(!count){alert(this.t('noTasksDone'));return;}if(confirm(`${this.t('confirmDeleteDone')}${count}${this.t('confirmDeleteDoneSuffix')}`))this.tasks=this.tasks.filter(t=>!t.completed);else return;}this.saveTasks();this.renderCalendar();this.render();}
  updateBulkActionUI(){
    const sb=document.getElementById('selectAllBtn'),cb=document.getElementById('completeActionBtn'),db=document.getElementById('deleteActionBtn');if(!sb||!cb||!db)return;
    const f=this.tasks.filter(t=>this.matchesFilter(t));sb.innerHTML=f.length>0&&f.every(t=>this.selectedTasks.has(t.id))?this.t('deselectAll'):this.t('selectAll');
    const targets=this.selectedTasks.size>0?this.tasks.filter(t=>this.selectedTasks.has(t.id)):f;const allDone=targets.length>0&&targets.every(t=>t.completed);
    if(this.selectedTasks.size>0){cb.innerHTML=allDone?`${this.t('pendingSelected')} (${this.selectedTasks.size})`:`${this.t('completeSelected')} (${this.selectedTasks.size})`;db.innerHTML=`${this.t('deleteSel')} (${this.selectedTasks.size})`;}
    else{cb.innerHTML=(allDone&&f.length>0)?this.t('pendingAll'):this.t('completeAll');db.innerHTML=this.t('deleteDone');}
  }
  matchesFilter(t){
    const ms=t.text.toLowerCase().includes(this.searchTerm)||t.category.toLowerCase().includes(this.searchTerm);
    const mp=this.currentFilter==='all'||this.currentFilter===t.priority||(this.currentFilter==='completed'&&t.completed)||(this.currentFilter==='pending'&&!t.completed);
    // Case-insensitive category match
    const mc=this.currentCategory==='all'||t.category.toLowerCase()===this.currentCategory.toLowerCase();
    let md=true;if(this.calendarDayFilter){if(!t.due_date){md=false;}else{const ld=this.getLocalDay(t.due_date),f=this.calendarDayFilter;md=ld&&ld.year===f.year&&ld.month===f.month&&ld.day===f.day;}}
    return ms&&mp&&mc&&md;
  }
  updateStats(){
    const total=this.tasks.length,done=this.tasks.filter(t=>t.completed).length,pending=total-done;
    const vals=[total,done,pending];
    [['statTotal','statTotalMobile'],['statCompleted','statCompletedMobile'],['statPending','statPendingMobile']].forEach(([id,idM],i)=>{
      const el=document.getElementById(id);if(el)el.textContent=String(vals[i]);
      const em=document.getElementById(idM);if(em)em.textContent=String(vals[i]);
    });
  }
  saveTasks(){storageManager.saveTasks(this.tasks);}
}

const organizadorDeTareas=new OrganizadorDeTareas();
const organizator=organizadorDeTareas;
