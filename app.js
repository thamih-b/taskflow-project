// ─── SmartParser ─────────────────────────────────────────────────────────────
const SmartParser = {
  dividirTareas(input) {
    const text = input.replace(/\s{2,}/g,' ').trim();
    const listas=[];
    const prot=text.replace(/\b(\w[\wÀ-ú]*(?:\s*,\s*\w[\wÀ-ú]*)+(?:\s+(?:e|y|and|ou)\s+\w[\wÀ-ú]*)?)\b/gi,(m)=>{const i=listas.length;listas.push(m);return`__L${i}__`;});
    const av='(?:também|fazer|entregar|estudar|ligar|ir|comprar|reunião|revisar|terminar|enviar|ler|escrever|agendar|marcar|finalizar|completar|preparar|also|además|remember|lembrar|check|conferir)';
    const sep=new RegExp(`\\s*(?:;\\s*|\\s+(?:e\\s+)?(?:também|también|also|além\\s+disso|además)\\s+(?=${av}\\b)|\\s+e\\s+(?=${av}\\b))`,'gi');
    const raw=prot.split(sep).map(p=>p.trim()).filter(Boolean);
    return raw.map(p=>p.replace(/__L(\d+)__/g,(_,i)=>listas[Number(i)])).filter(p=>p.length>1);
  },
  extraerFechaHora(texto,idioma){
    if(typeof chrono==='undefined')return{fechaISO:null,tieneHora:false,finISO:null,textoLimpio:texto};
    let parser=chrono;
    try{if(idioma==='pt'&&chrono.pt)parser=chrono.pt;else if(idioma==='es'&&chrono.es)parser=chrono.es;}catch{}
    const resultados=parser.parse(texto,new Date(),{forwardDate:true});
    if(!resultados.length)return{fechaISO:null,tieneHora:false,finISO:null,textoLimpio:texto};
    const r=resultados[0],tieneHora=r.start.isCertain('hour'),fechaInicio=r.start.date();
    if(!tieneHora)fechaInicio.setHours(23,59,0,0);
    let finISO=null;if(r.end)finISO=r.end.date().toISOString();
    const limpio=(texto.slice(0,r.index)+texto.slice(r.index+r.text.length)).replace(/\s{2,}/g,' ').trim();
    return{fechaISO:fechaInicio.toISOString(),tieneHora,finISO,textoLimpio:limpio};
  },
  extraerPrioridad(texto){
    const A=/(urgente|muy\s+urgente|alta\s+prioridad|prioridade\s+alta|high\s+priority|asap|cr[ií]tico)/i;
    const B=/(sin\s+prisa|sem\s+pressa|baja\s+prioridad|prioridade\s+baixa|low\s+priority|quando\s+puder)/i;
    if(A.test(texto))return{prioridad:'high',textoLimpio:texto.replace(A,'').trim()};
    if(B.test(texto))return{prioridad:'low',textoLimpio:texto.replace(B,'').trim()};
    return{prioridad:'medium',textoLimpio:texto};
  },
  detectarCategoria(texto){
    const t=texto.toLowerCase();
    if(/(comprar|compra|mercado|supermercado|tienda|leite|pão|ovos|açúcar|café|manteiga|buy|groceries|shopping)/.test(t))return'Compras';
    if(/(trabalho|reunião|time|trabajo|work|meeting|reunión|equipo|relatório|report|cliente|projeto)/.test(t))return'Trabalho';
    if(/(estudar|estudo|tcc|curso|estudio|study|aula|classe|prova|exame|inglês|lesson|homework)/.test(t))return'Estudos';
    if(/(médico|doctor|consulta|farmácia|farmacia|salud|saúde|remedios|remédio|hospital)/.test(t))return'Saúde';
    if(/(casa|limpar|limpiar|cozinha|cocina|jardim|jardín|faxina|arrumar)/.test(t))return'Casa';
    return'General';
  },
  extraerSubtareas(texto){
    const m=texto.match(/^(?:comprar|compra|buy|obter|pegar|adquirir|buscar|hacer|llevar|traer|preparar|fazer)\s+(.+)$/i);
    if(!m)return[];
    const partes=m[1].split(/,\s*|\s+(?:e|y|and|ou)\s+/i).map(s=>s.replace(/[.,;!?]+$/,'').trim()).filter(s=>s.length>1&&s.split(' ').length<=6);
    if(partes.length<2)return[];
    return partes.map(p=>p.charAt(0).toUpperCase()+p.slice(1));
  },
  analizar(input,idioma){
    const segs=this.dividirTareas(input);
    const lista=segs.length?segs:[input.trim()];
    return lista.filter(s=>s.trim()).map(seg=>{
      const{fechaISO,tieneHora,finISO,textoLimpio:despuesFecha}=this.extraerFechaHora(seg,idioma);
      const{prioridad,textoLimpio:despuesPrio}=this.extraerPrioridad(despuesFecha);
      const subtareasTexto=this.extraerSubtareas(despuesPrio);
      let titulo=despuesPrio.replace(/^(também|también|also|além\s+disso|además|de|em|a|o|e|para)\s+/i,'').replace(/[.,;!?]+$/,'').replace(/\s{2,}/g,' ').trim();
      titulo=titulo.charAt(0).toUpperCase()+titulo.slice(1);
      if(!titulo||titulo.length<2)titulo=seg.trim();
      return{texto:titulo,categoria:this.detectarCategoria(seg),prioridad,fechaISO,tieneHora,finISO,subtareasTexto};
    });
  }
};

// ─── OrganizadorDeTareas ──────────────────────────────────────────────────────
class OrganizadorDeTareas {
  constructor(){
    this.tasks=[];
    this.filtroActual='all';
    this.categoriaActual='all';
    this.terminoBusqueda='';
    this.tareasSeleccionadas=new Set();
    this.tareasExpandidas=new Set();
    this.panelsSubtareasAbiertos=new Set();
    this.tabActiva=storageManager.cargarTabActiva('manual');
    this.idioma=storageManager.cargarIdioma('es');
    this.ordenadoPorFecha=false;
    this.fechaCalendario=new Date();
    this.filtroDiaCalendario=null;
    this.tareasVistaPreviaInteligente=[];
    this.idArrastrado=null;
    this.subtareasPendientes=[];
    this.drawerMobileAbierto=false;
    this.calendarioMobileAbierto=false;
    this.filtrosEstado=[
      {id:'all',claveLabel:'filterAll',color:'amber'},{id:'high',claveLabel:'filterHigh',color:'red'},
      {id:'medium',claveLabel:'filterMedium',color:'amber'},{id:'low',claveLabel:'filterLow',color:'emerald'},
      {id:'completed',claveLabel:'filterCompleted',color:'zinc'},{id:'pending',claveLabel:'filterPending',color:'blue'}
    ];
    this.inicializar();
  }

  // ── Inicialização ─────────────────────────────────────────────────────────
  async inicializar(){
    this.cargarTema();
    this.aplicarTraducciones();
    this.renderizarFiltrosEstado();
    this.renderizarCalendario();
    this.vincularEventos();
    this.establecerTabActiva('manual');
    this.renderizar();
    await this.cargarTareas();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  t(k){return(I18N[this.idioma]||I18N.es)[k]||k;}
  escaparHTML(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  obtenerConfigPrioridad(p){return({high:{claveTexto:'prioHigh',color:'bg-red-500/90'},medium:{claveTexto:'prioMedium',color:'bg-rose-400/80'},low:{claveTexto:'prioLow',color:'bg-emerald-500/90'}})[p]||{claveTexto:'prioMedium',color:'bg-rose-400/80'};}
  obtenerProgresoSubtareas(tarea){if(!tarea.subtasks?.length)return null;const hechas=tarea.subtasks.filter(s=>s.completed).length;return{hechas,total:tarea.subtasks.length,pct:Math.round(hechas/tarea.subtasks.length*100)};}

  normalizarCategoria(cat){
    const c=cat.trim();
    return c?c.charAt(0).toUpperCase()+c.slice(1):c;
  }

  // ── Backend ───────────────────────────────────────────────────────────────
  mostrarCargando(){
    const el=document.getElementById('tasksContainer');
    if(el)el.innerHTML='<div class="text-center py-8 text-amber-700 dark:text-amber-400 flex items-center justify-center gap-2"><span class="animate-spin text-xl">⏳</span><span>Cargando tareas...</span></div>';
  }

  mostrarError(mensaje){
    const el=document.getElementById('tasksContainer');
    if(el)el.innerHTML=`<div class="text-center py-8 text-red-600 dark:text-red-400">❌ ${mensaje}<br><button onclick="organizador.cargarTareas()" class="mt-3 inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 underline text-sm hover:text-blue-800 transition">↺ Intentar de nuevo</button></div>`;
  }

  // Estados visuais: 1.Carga → 2.Sucesso → 3.Erro
  async cargarTareas(){
    this.mostrarCargando();
    try {
      this.tasks = await clienteApi.listarTareas();
      this.renderizar();
    } catch(err) {
      console.error('Error al cargar tareas:', err.message);
      this.mostrarError('No se pudo conectar con el servidor.<br>Verifica que el backend está corriendo en <strong>http://localhost:3000</strong>');
    }
  }

  // ── i18n ──────────────────────────────────────────────────────────────────
  establecerIdioma(idioma){
    this.idioma=idioma;storageManager.guardarIdioma(idioma);
    this.aplicarTraducciones();this.renderizarFiltrosEstado();this.renderizarCalendario();this.renderizar();
  }

  aplicarTraducciones(){
    const l=this.idioma;
    document.documentElement.lang=l;
    document.querySelectorAll('[data-i18n]').forEach(el=>{const v=I18N[l][el.dataset.i18n];if(v!==undefined)el.textContent=v;});
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{const v=I18N[l][el.dataset.i18nPlaceholder];if(v)el.placeholder=v;});
    // Atualiza o data-prompt dos botões de exemplo ao trocar idioma
    document.querySelectorAll('[data-i18n-prompt]').forEach(el=>{
      const chave=el.dataset.i18nPrompt;
      const v=I18N[l][chave];
      if(v)el.dataset.prompt=v;
    });
    const prio=document.getElementById('nuevaPrioridadInput');
    if(prio){prio.options[0].text=this.t('priorityHigh');prio.options[1].text=this.t('priorityMedium');prio.options[2].text=this.t('priorityLow');}
    // Marca o idioma activo em todos os botões .lang-option (mobile drawer + desktop settings)
    document.querySelectorAll('.lang-option').forEach(b=>b.classList.toggle('active-lang',b.dataset.lang===l));
    // Ícone e label do tema no dropdown de settings (desktop)
    const oscuro=document.documentElement.classList.contains('dark');
    const ti=document.getElementById('themeIconFixed');if(ti)ti.textContent=oscuro?'☀️':'🌙';
    const desktopLabel=document.getElementById('desktopThemeLabel');
    if(desktopLabel)desktopLabel.textContent=oscuro?this.t('lightMode'):this.t('darkMode');
    // Sincroniza ambos os botões de ordenar (mobile e desktop)
    const textoOrden=this.ordenadoPorFecha?this.t('sortByDeadlineActive'):this.t('sortByDeadlineBtn');
    const sb=document.getElementById('btnOrdenarPorFecha');if(sb)sb.textContent=textoOrden;
    const sbD=document.getElementById('btnOrdenarPorFechaDesktop');if(sbD)sbD.textContent=textoOrden;
    const mct=document.getElementById('btnToggleCalendarioMobile');
    if(mct)mct.textContent=this.calendarioMobileAbierto?this.t('calToggleHide'):this.t('calToggleShow');
  }

  // ── Locale ────────────────────────────────────────────────────────────────
  obtenerLocaleUsuario(){return{es:'es-ES',pt:'pt-BR',en:'en-US'}[this.idioma]||navigator.language||'es-ES';}
  obtenerZonaHorariaUsuario(){try{return Intl.DateTimeFormat().resolvedOptions().timeZone;}catch{return'UTC';}}

  // ── Helpers de data ───────────────────────────────────────────────────────
  construirFechaLimite(fechaStr,horaStr){
    if(!fechaStr)return null;
    const hora=(horaStr&&horaStr.trim())?horaStr.trim():'23:59';
    const tieneHora=!!(horaStr&&horaStr.trim());
    return{iso:new Date(`${fechaStr}T${hora}:00`).toISOString(),tieneHora};
  }
  esUrgente(tarea){if(!tarea.due_date||tarea.completed)return false;const d=new Date(tarea.due_date).getTime()-Date.now();return d>0&&d<86400000;}
  estaVencida(tarea){if(!tarea.due_date||tarea.completed)return false;return new Date(tarea.due_date).getTime()<Date.now();}
  formatearFechaLimite(tarea){
    if(!tarea.due_date)return'';
    const l=this.obtenerLocaleUsuario(),tz=this.obtenerZonaHorariaUsuario(),d=new Date(tarea.due_date);
    let s=tarea.due_date_has_time?d.toLocaleString(l,{dateStyle:'short',timeStyle:'short',timeZone:tz}):d.toLocaleDateString(l,{dateStyle:'medium',timeZone:tz});
    if(tarea.due_date_end)s+=` → ${new Date(tarea.due_date_end).toLocaleTimeString(l,{hour:'2-digit',minute:'2-digit',timeZone:tz})}`;
    return s;
  }
  obtenerFechaLocalStr(iso){if(!iso)return null;try{return new Date(iso).toLocaleDateString('en-CA',{timeZone:this.obtenerZonaHorariaUsuario()});}catch{return null;}}
  obtenerHoraLocalStr(iso){if(!iso)return null;try{return new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:this.obtenerZonaHorariaUsuario()}).format(new Date(iso));}catch{return null;}}
  obtenerDiaLocal(iso){const s=this.obtenerFechaLocalStr(iso);if(!s)return null;const[y,mo,d]=s.split('-').map(Number);return{year:y,month:mo,day:d};}

  // ── CRUD de prazo ─────────────────────────────────────────────────────────
  establecerFechaLimiteTarea(idTarea,fechaStr,horaStr){
    const tarea=this.tasks.find(t=>t.id===idTarea);if(!tarea)return;
    if(!fechaStr){delete tarea.due_date;delete tarea.due_date_has_time;delete tarea.due_date_end;}
    else{const r=this.construirFechaLimite(fechaStr,horaStr);if(r){tarea.due_date=r.iso;tarea.due_date_has_time=r.tieneHora;}}
    this.renderizarCalendario();this.renderizar();
  }
  eliminarFechaLimiteTarea(idTarea){
    const tarea=this.tasks.find(t=>t.id===idTarea);if(!tarea)return;
    delete tarea.due_date;delete tarea.due_date_has_time;delete tarea.due_date_end;
    this.renderizarCalendario();this.renderizar();
  }

  // ── Ordenação ─────────────────────────────────────────────────────────────
  alternarOrdenPorFecha(){
    this.ordenadoPorFecha=!this.ordenadoPorFecha;
    const texto=this.ordenadoPorFecha?this.t('sortByDeadlineActive'):this.t('sortByDeadlineBtn');
    const activo=this.ordenadoPorFecha;
    [document.getElementById('btnOrdenarPorFecha'),document.getElementById('btnOrdenarPorFechaDesktop')].forEach(btn=>{
      if(!btn)return;
      btn.textContent=texto;
      btn.classList.toggle('bg-amber-400',activo);
      btn.classList.toggle('text-amber-950',activo);
      btn.classList.toggle('shadow-md',activo);
    });
    this.renderizar();
  }

  // ── Filtro por dia no calendário ──────────────────────────────────────────
  establecerFiltroDia(y,mo,d){
    const f=this.filtroDiaCalendario;
    this.filtroDiaCalendario=(f&&f.year===y&&f.month===mo&&f.day===d)?null:{year:y,month:mo,day:d};
    this.renderizarCalendario();this.renderizar();
  }
  limpiarFiltroDia(){this.filtroDiaCalendario=null;this.renderizarCalendario();this.renderizar();}

  // ── Renderização do calendário ────────────────────────────────────────────
  navegarCalendario(dir){this.fechaCalendario=new Date(this.fechaCalendario.getFullYear(),this.fechaCalendario.getMonth()+dir,1);this.renderizarCalendario();}

  _construirHTMLCalendario(){
    const year=this.fechaCalendario.getFullYear(),month=this.fechaCalendario.getMonth(),locale=this.obtenerLocaleUsuario();
    const mapaDias=new Map();
    this.tasks.forEach(tarea=>{
      if(!tarea.due_date)return;
      const ld=this.obtenerDiaLocal(tarea.due_date);
      if(!ld||ld.year!==year||ld.month!==month+1)return;
      if(!mapaDias.has(ld.day))mapaDias.set(ld.day,{tareas:[],tieneUrgente:false,tieneVencida:false,tieneNormal:false});
      const info=mapaDias.get(ld.day);info.tareas.push(tarea);
      if(this.estaVencida(tarea))info.tieneVencida=true;else if(this.esUrgente(tarea))info.tieneUrgente=true;else info.tieneNormal=true;
    });
    const inicioDow=this.idioma==='en'?0:1,refDom=new Date(2023,0,1),cabeceras=[];
    for(let i=0;i<7;i++){const d=new Date(refDom);d.setDate(1+(inicioDow+i)%7);cabeceras.push(new Intl.DateTimeFormat(locale,{weekday:'narrow'}).format(d));}
    const primerDow=new Date(year,month,1).getDay(),offset=(primerDow-inicioDow+7)%7,diasMes=new Date(year,month+1,0).getDate();
    const celdas=[];for(let i=0;i<offset;i++)celdas.push(null);for(let d=1;d<=diasMes;d++)celdas.push(d);while(celdas.length%7!==0)celdas.push(null);
    const hoy=this.obtenerDiaLocal(new Date().toISOString());
    const esHoy=d=>d&&hoy&&hoy.year===year&&hoy.month===month+1&&hoy.day===d;
    const esSel=d=>{const f=this.filtroDiaCalendario;return d&&f&&f.year===year&&f.month===month+1&&f.day===d;};
    return`<div class="grid grid-cols-7 mb-1">${cabeceras.map(h=>`<div class="text-center text-[10px] font-bold text-amber-700/60 dark:text-amber-400/60 py-0.5">${h}</div>`).join('')}</div><div class="grid grid-cols-7 gap-y-0.5">${celdas.map(d=>{
      if(!d)return`<div></div>`;
      const info=mapaDias.get(d),sel=esSel(d),hoyD=esHoy(d),tieneTareas=!!info;
      const cc=sel?'bg-blue-500 rounded-full cursor-pointer ring-2 ring-blue-300/50':hoyD?'bg-amber-400/80 dark:bg-amber-600/70 font-bold rounded-full cursor-pointer hover:bg-amber-500/80':tieneTareas?'cursor-pointer hover:bg-amber-100/80 dark:hover:bg-zinc-700/60 rounded-md':'rounded-md opacity-60';
      const nc=sel?'text-white':hoyD?'text-amber-950 dark:text-amber-50':'text-amber-900 dark:text-amber-100';
      let puntos='';if(info){if(info.tieneVencida)puntos+=`<span class="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>`;if(info.tieneUrgente)puntos+=`<span class="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0 animate-pulse"></span>`;if(info.tieneNormal)puntos+=`<span class="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>`;}
      const tip=info?`title="${info.tareas.map(t=>t.text.slice(0,40)).join('\n')}"`:'' ;
      const clk=(tieneTareas||hoyD)?`onclick="organizador.establecerFiltroDia(${year},${month+1},${d})"`:'' ;
      return`<div class="flex flex-col items-center justify-center py-1 transition ${cc}" ${tip} ${clk}><span class="text-[11px] leading-none font-medium ${nc}">${d}</span><div class="flex gap-0.5 justify-center h-2 mt-0.5">${puntos}</div></div>`;
    }).join('')}</div>`;
  }

  renderizarCalendario(){
    const raw=new Intl.DateTimeFormat(this.obtenerLocaleUsuario(),{month:'long',year:'numeric'}).format(new Date(this.fechaCalendario.getFullYear(),this.fechaCalendario.getMonth(),1));
    const titulo=raw.charAt(0).toUpperCase()+raw.slice(1);
    const html=this._construirHTMLCalendario();
    ['calMonthTitle','calMonthTitleMobile'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=titulo;});
    ['miniCalendar','miniCalendarMobile'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML=html;});
    this.actualizarInsigniaFiltro();
  }

  actualizarInsigniaFiltro(){
    const badge=document.getElementById('calDayFilterBadge');if(!badge)return;
    if(this.filtroDiaCalendario){
      const f=this.filtroDiaCalendario;
      const str=new Date(f.year,f.month-1,f.day).toLocaleDateString(this.obtenerLocaleUsuario(),{weekday:'short',day:'numeric',month:'long'});
      badge.innerHTML=`<span class="font-semibold">📅 ${str}</span><button onclick="organizador.limpiarFiltroDia()" class="ml-2 text-blue-700 dark:text-blue-300 hover:text-red-500 font-bold transition">${this.t('calClearFilter')}</button>`;
      badge.classList.remove('hidden');
    }else{badge.classList.add('hidden');}
  }

  // ── Drawer mobile ─────────────────────────────────────────────────────────
  alternarDrawerMobile(){
    this.drawerMobileAbierto=!this.drawerMobileAbierto;
    const drawer=document.getElementById('mobileDrawer');
    const fondo=document.getElementById('mobileDrawerBackdrop');
    const btn=document.getElementById('btnMenuMobile');
    if(drawer)drawer.classList.toggle('-translate-x-full',!this.drawerMobileAbierto);
    if(fondo)fondo.classList.toggle('hidden',!this.drawerMobileAbierto);
    if(btn)btn.classList.toggle('hidden',this.drawerMobileAbierto);
    document.body.style.overflow=this.drawerMobileAbierto?'hidden':'';
  }
  cerrarDrawerMobile(){
    this.drawerMobileAbierto=false;
    const drawer=document.getElementById('mobileDrawer');
    const fondo=document.getElementById('mobileDrawerBackdrop');
    const btn=document.getElementById('btnMenuMobile');
    if(drawer)drawer.classList.add('-translate-x-full');
    if(fondo)fondo.classList.add('hidden');
    if(btn)btn.classList.remove('hidden');
    document.body.style.overflow='';
  }

  // ── Calendário inline mobile ──────────────────────────────────────────────
  alternarCalendarioMobile(){
    this.calendarioMobileAbierto=!this.calendarioMobileAbierto;
    const panel=document.getElementById('mobileCalendarPanel');
    if(panel)panel.classList.toggle('hidden',!this.calendarioMobileAbierto);
    const btn=document.getElementById('btnToggleCalendarioMobile');
    if(btn)btn.textContent=this.calendarioMobileAbierto?this.t('calToggleHide'):this.t('calToggleShow');
  }

  // ── Abas ──────────────────────────────────────────────────────────────────
  establecerTabActiva(tab){
    this.tabActiva=tab;storageManager.guardarTabActiva(tab);
    document.getElementById('manualTasksPanel')?.classList.toggle('hidden',tab!=='manual');
    document.getElementById('smartTasksPanel')?.classList.toggle('hidden',tab!=='smart');
    ['btnTabManual','btnTabInteligente'].forEach(id=>{
      const btn=document.getElementById(id);if(!btn)return;
      const activo=(id==='btnTabManual'&&tab==='manual')||(id==='btnTabInteligente'&&tab==='smart');
      btn.classList.toggle('active',activo);
      btn.classList.toggle('text-amber-900',activo);btn.classList.toggle('dark:text-amber-100',activo);
      btn.classList.toggle('text-amber-700/70',!activo);btn.classList.toggle('dark:text-amber-300/70',!activo);
    });
  }

  // ── Tarea inteligente ─────────────────────────────────────────────────────
  ejecutarTareaInteligente(){
    const inputPrompt=document.getElementById('smartTaskPrompt'),btn=document.getElementById('btnAccionTareaInteligente');
    if(!inputPrompt||!btn)return;
    const input=inputPrompt.value.trim();if(!input)return;
    btn.textContent=this.t('smartProcessing');btn.disabled=true;
    try{
      const analizadas=SmartParser.analizar(input,this.idioma);
      this.tareasVistaPreviaInteligente=analizadas.map((p,i)=>({
        _id:`prev-${Date.now()}-${i}`,text:p.texto,category:p.categoria,priority:p.prioridad,
        due_date:p.fechaISO,due_date_has_time:p.tieneHora,due_date_end:p.finISO,
        subtasks:(p.subtareasTexto||[]).map(s=>({id:Date.now().toString()+Math.random(),text:s,completed:false})),
        _fechaStr:p.fechaISO?this.obtenerFechaLocalStr(p.fechaISO)||'':'',
        _horaStr:(p.fechaISO&&p.tieneHora)?this.obtenerHoraLocalStr(p.fechaISO)||'':'',
        _finStr:p.finISO?this.obtenerHoraLocalStr(p.finISO)||'':'',
      }));
      this.abrirModalVistaPrevia();
    }catch(err){console.error('[TareaInteligente]',err);alert(this.t('errorProcessing'));}
    finally{btn.textContent=this.t('smartGenerateBtn');btn.disabled=false;}
  }

  abrirModalVistaPrevia(){
    const overlay=document.getElementById('smartPreviewOverlay');
    if(!overlay||!this.tareasVistaPreviaInteligente.length)return;
    const tareasHTML=this.tareasVistaPreviaInteligente.map((t,idx)=>{
      const pc=this.obtenerConfigPrioridad(t.priority);
      const fechaDisplay=t.due_date?new Date(t.due_date).toLocaleString(this.obtenerLocaleUsuario(),{dateStyle:'medium',...(t.due_date_has_time?{timeStyle:'short'}:{}),timeZone:this.obtenerZonaHorariaUsuario()}):this.t('previewNoDate');
      const finDisplay=t.due_date_end?new Date(t.due_date_end).toLocaleTimeString(this.obtenerLocaleUsuario(),{hour:'2-digit',minute:'2-digit',timeZone:this.obtenerZonaHorariaUsuario()}):'' ;
      const subHTML=t.subtasks.map((s,si)=>`<div class="flex items-center gap-2 py-1 px-2 rounded-lg bg-amber-50/60 dark:bg-zinc-800/60 group"><span class="text-[10px] text-amber-500/60">↳</span><span class="flex-1 text-xs text-amber-900/90 dark:text-amber-100/80">${this.escaparHTML(s.text)}</span><button onclick="organizador.eliminarSubtareaVistaPrevia(${idx},${si})" class="text-red-400 hover:text-red-600 text-xs opacity-0 group-hover:opacity-100 transition">✕</button></div>`).join('');
      return`<div class="rounded-xl border border-blue-200/50 dark:border-blue-700/30 bg-white/60 dark:bg-zinc-800/60 overflow-hidden">
        <div class="flex items-center gap-2 px-4 py-2.5 bg-blue-50/70 dark:bg-blue-900/20 border-b border-blue-200/40 dark:border-blue-700/25">
          <span class="text-xs font-bold text-blue-800/70 dark:text-blue-300/70 flex-1">${this.t('previewTaskLabel')} ${idx+1}</span>
          <button onclick="organizador.eliminarTareaVistaPrevia(${idx})" class="w-5 h-5 text-red-400/70 hover:text-red-600 text-xs font-bold">✕</button>
        </div>
        <div class="px-4 py-3 space-y-3">
          <input type="text" id="pt-text-${idx}" value="${this.escaparHTML(t.text)}" class="w-full rounded-lg border border-amber-900/20 dark:border-amber-600/30 bg-amber-50/60 dark:bg-zinc-900/70 px-3 py-2 text-sm text-amber-900 dark:text-amber-100 font-serif italic focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition">
          <div class="grid grid-cols-2 gap-2">
            <div class="space-y-1"><label class="text-[10px] font-bold uppercase tracking-wider text-blue-700/60 dark:text-blue-400/60">${this.t('previewCategoryLabel')}</label>
              <input type="text" id="pt-cat-${idx}" value="${this.escaparHTML(t.category)}" class="w-full rounded-lg border border-amber-900/20 dark:border-amber-600/30 bg-amber-50/60 dark:bg-zinc-900/70 px-2.5 py-1.5 text-xs text-[#6b7280] dark:text-amber-100 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition">
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
              <input type="date" id="pt-date-${idx}" value="${t._fechaStr||''}" style="color-scheme:light dark" class="w-full rounded-lg border border-amber-900/20 dark:border-amber-600/30 bg-amber-50/60 dark:bg-zinc-900/70 px-2.5 py-1.5 text-xs text-[#6b7280] dark:text-amber-100 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition cursor-pointer">
            </div>
            <div class="space-y-1"><label class="text-[10px] font-bold uppercase tracking-wider text-blue-700/60 dark:text-blue-400/60">${this.t('previewTimeLabel')}</label>
              <input type="time" id="pt-time-${idx}" value="${t._horaStr||''}" style="color-scheme:light dark" class="w-full rounded-lg border border-amber-900/20 dark:border-amber-600/30 bg-amber-50/60 dark:bg-zinc-900/70 px-2.5 py-1.5 text-xs text-[#6b7280] dark:text-amber-100 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition cursor-pointer">
            </div>
            ${t.due_date_end?`<div class="space-y-1 col-span-2 sm:col-span-1"><label class="text-[10px] font-bold uppercase tracking-wider text-violet-700/60 dark:text-violet-400/60">${this.t('previewTimeEnd')}</label>
              <input type="time" id="pt-end-${idx}" value="${t._finStr||''}" style="color-scheme:light dark" class="w-full rounded-lg border border-violet-400/30 dark:border-violet-600/30 bg-violet-50/50 dark:bg-zinc-900/70 px-2.5 py-1.5 text-xs text-[#6b7280] dark:text-amber-100 focus:outline-none focus:ring-2 focus:ring-violet-400/50 transition cursor-pointer">
            </div>`:''}
          </div>
          ${t.due_date?`<div class="flex items-center gap-2 text-[10px] bg-blue-50/50 dark:bg-blue-900/20 rounded-lg px-2.5 py-1.5 text-blue-700/70 dark:text-blue-300/70"><span>📅</span><span>${fechaDisplay}${finDisplay?` → ${finDisplay}`:''}</span>${!t.due_date_has_time?`<span class="ml-auto opacity-50 italic">→ 23:59</span>`:''}</div>`:''}
          <div class="space-y-1.5"><label class="text-[10px] font-bold uppercase tracking-wider text-blue-700/60 dark:text-blue-400/60">${this.t('previewSubtasksLabel')}</label>
            <div id="pt-subs-${idx}" class="space-y-1">${subHTML}</div>
            <div class="flex gap-2">
              <input type="text" id="pt-subinput-${idx}" placeholder="${this.t('addSubtaskPlaceholder')}" class="flex-1 rounded-lg border border-blue-200/40 dark:border-blue-700/30 bg-white/60 dark:bg-zinc-900/60 px-2.5 py-1.5 text-xs text-[#6b7280] dark:text-amber-100 focus:outline-none focus:ring-2 focus:ring-blue-400/40 transition" onkeypress="if(event.key==='Enter'){organizador.agregarSubtareaVistaPrevia(${idx});event.preventDefault();}">
              <button onclick="organizador.agregarSubtareaVistaPrevia(${idx})" class="shrink-0 px-2.5 py-1.5 rounded-lg bg-blue-500/70 hover:bg-blue-600/80 text-white text-xs font-bold transition">+</button>
            </div>
          </div>
        </div>
      </div>`;
    }).join('');
    overlay.innerHTML=`<div class="fixed inset-0 bg-black/65 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onclick="if(event.target===this)organizador.cancelarVistaPrevia()">
      <div class="relative w-full max-w-2xl bg-parchment/98 dark:bg-zinc-900/98 rounded-2xl shadow-2xl border-2 border-blue-400/40 dark:border-blue-500/35 flex flex-col max-h-[90vh]" onclick="event.stopPropagation()">
        <div class="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-600/90 via-violet-600/80 to-fuchsia-600/70 text-white rounded-t-2xl shrink-0">
          <span class="text-xl">🔍</span>
          <div class="flex-1"><h3 class="font-bold text-sm tracking-wide">${this.t('previewTitle')}</h3><p class="text-[11px] opacity-80 mt-0.5">${this.tareasVistaPreviaInteligente.length} ${this.tareasVistaPreviaInteligente.length===1?this.t('previewTaskLabel').toLowerCase():'tarefas'} detectada(s)</p></div>
          <button onclick="organizador.cancelarVistaPrevia()" class="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center font-bold text-sm transition">✕</button>
        </div>
        <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4">${tareasHTML}
          <button onclick="organizador.agregarTareaVaciaVistaPrevia()" class="w-full py-2 rounded-xl border-2 border-dashed border-blue-300/50 dark:border-blue-600/35 text-blue-600/60 dark:text-blue-400/50 text-xs font-semibold hover:border-blue-400/70 hover:text-blue-700/80 dark:hover:text-blue-300/70 transition">＋ ${this.t('previewAddTask')}</button>
        </div>
        <div class="flex gap-3 px-6 py-4 border-t border-blue-200/30 dark:border-blue-700/25 bg-blue-50/20 dark:bg-blue-950/15 rounded-b-2xl shrink-0">
          <button onclick="organizador.confirmarTareaInteligente()" class="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition">${this.t('previewConfirmBtn')}</button>
          <button onclick="organizador.cancelarVistaPrevia()" class="px-4 py-2.5 rounded-xl border border-red-300/50 dark:border-red-600/35 text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20 font-bold text-sm transition">${this.t('previewCancelBtn')}</button>
        </div>
      </div>
    </div>`;
    overlay.classList.remove('hidden');
    document.body.style.overflow='hidden';
  }

  agregarSubtareaVistaPrevia(idx){const input=document.getElementById(`pt-subinput-${idx}`);if(!input)return;const texto=input.value.trim();if(!texto)return;if(this.tareasVistaPreviaInteligente[idx])this.tareasVistaPreviaInteligente[idx].subtasks.push({id:Date.now().toString(),text:texto,completed:false});input.value='';this.abrirModalVistaPrevia();setTimeout(()=>document.getElementById(`pt-subinput-${idx}`)?.focus(),50);}
  eliminarSubtareaVistaPrevia(ti,si){if(this.tareasVistaPreviaInteligente[ti])this.tareasVistaPreviaInteligente[ti].subtasks.splice(si,1);this.abrirModalVistaPrevia();}
  eliminarTareaVistaPrevia(idx){this.tareasVistaPreviaInteligente.splice(idx,1);if(!this.tareasVistaPreviaInteligente.length){this.cancelarVistaPrevia();return;}this.abrirModalVistaPrevia();}
  agregarTareaVaciaVistaPrevia(){this.tareasVistaPreviaInteligente.push({_id:`prev-${Date.now()}`,text:'',category:'General',priority:'medium',due_date:null,due_date_has_time:false,due_date_end:null,subtasks:[],_fechaStr:'',_horaStr:'',_finStr:''});this.abrirModalVistaPrevia();setTimeout(()=>document.getElementById(`pt-text-${this.tareasVistaPreviaInteligente.length-1}`)?.focus(),80);}

  confirmarTareaInteligente(){
    const nuevasTareas=[];
    this.tareasVistaPreviaInteligente.forEach((t,idx)=>{
      const texto=(document.getElementById(`pt-text-${idx}`)?.value||t.text).trim();if(!texto)return;
      const rawCat=(document.getElementById(`pt-cat-${idx}`)?.value||t.category);
      const categoria=this.normalizarCategoria(rawCat)||'General';
      const prioridad=document.getElementById(`pt-prio-${idx}`)?.value||t.priority;
      const fechaVal=document.getElementById(`pt-date-${idx}`)?.value||t._fechaStr;
      const horaVal=document.getElementById(`pt-time-${idx}`)?.value||t._horaStr;
      const finVal=document.getElementById(`pt-end-${idx}`)?.value||t._finStr;
      const nuevaTarea={id:Date.now().toString()+Math.random(),text:texto,category:categoria,priority:prioridad,completed:false,subtasks:t.subtasks.slice()};
      if(fechaVal){const r=this.construirFechaLimite(fechaVal,horaVal);if(r){nuevaTarea.due_date=r.iso;nuevaTarea.due_date_has_time=r.tieneHora;}}
      if(t.due_date_end&&finVal&&fechaVal)nuevaTarea.due_date_end=new Date(`${fechaVal}T${finVal}:00`).toISOString();
      nuevasTareas.push(nuevaTarea);
    });
    nuevasTareas.reverse().forEach(t=>this.tasks.unshift(t));
    this.cancelarVistaPrevia();
    const primera=nuevasTareas.find(t=>t.due_date);
    if(primera){const ld=this.obtenerDiaLocal(primera.due_date);if(ld)this.fechaCalendario=new Date(ld.year,ld.month-1,1);}
    this.renderizarCalendario();this.renderizar();
    const pi=document.getElementById('smartTaskPrompt');if(pi)pi.value='';
  }
  cancelarVistaPrevia(){
    this.tareasVistaPreviaInteligente=[];
    const ov=document.getElementById('smartPreviewOverlay');
    if(ov){ov.innerHTML='';ov.classList.add('hidden');}
    document.body.style.overflow='';
  }

  // ── Construtor de subtarefas pendentes ────────────────────────────────────
  agregarSubtareaPendiente(){const input=document.getElementById('nuevaSubtareaInput');if(!input)return;const texto=input.value.trim();if(!texto)return;this.subtareasPendientes.push(texto);input.value='';input.focus();this.renderizarSubtareasPendientes();}
  eliminarSubtareaPendiente(idx){this.subtareasPendientes.splice(idx,1);this.renderizarSubtareasPendientes();}
  renderizarSubtareasPendientes(){
    const c=document.getElementById('pendingSubtasksContainer');if(!c)return;
    if(!this.subtareasPendientes.length){c.innerHTML='';return;}
    c.innerHTML=`<div class="flex flex-wrap gap-1.5 mt-2 px-1">${this.subtareasPendientes.map((s,i)=>`<span class="inline-flex items-center gap-1 text-xs bg-amber-200/80 dark:bg-zinc-700/80 text-amber-900 dark:text-amber-100 rounded-full px-2.5 py-1 border border-amber-400/40 dark:border-amber-600/30">${this.escaparHTML(s)}<button onclick="organizador.eliminarSubtareaPendiente(${i})" class="ml-0.5 text-amber-600/70 hover:text-red-500 font-bold text-[10px] leading-none">✕</button></span>`).join('')}<span class="text-[10px] text-amber-600/60 dark:text-amber-400/50 self-center italic">${this.subtareasPendientes.length} ${this.t('subtasksAdded')}</span></div>`;
  }

  // ── Métodos de subtarefas ─────────────────────────────────────────────────
  agregarSubtarea(idTarea){const input=document.getElementById(`subtask-input-${idTarea}`);if(!input)return;const texto=input.value.trim();if(!texto)return;const tarea=this.tasks.find(t=>t.id===idTarea);if(!tarea)return;if(!tarea.subtasks)tarea.subtasks=[];tarea.subtasks.push({id:Date.now().toString(),text:texto,completed:false});input.value='';this.panelsSubtareasAbiertos.add(idTarea);this.renderizar();}
  alternarSubtarea(idTarea,idSub){const tarea=this.tasks.find(t=>t.id===idTarea);if(!tarea?.subtasks)return;const sub=tarea.subtasks.find(s=>s.id===idSub);if(!sub)return;sub.completed=!sub.completed;tarea.completed=tarea.subtasks.length>0&&tarea.subtasks.every(s=>s.completed);this.panelsSubtareasAbiertos.add(idTarea);this.renderizar();}
  alternarPanelSubtareas(idTarea){this.panelsSubtareasAbiertos.has(idTarea)?this.panelsSubtareasAbiertos.delete(idTarea):this.panelsSubtareasAbiertos.add(idTarea);document.getElementById(`subtasks-panel-${idTarea}`)?.classList.toggle('open',this.panelsSubtareasAbiertos.has(idTarea));const a=document.getElementById(`subtask-arrow-${idTarea}`);if(a)a.textContent=this.panelsSubtareasAbiertos.has(idTarea)?'▲':'▼';}
  editarSubtarea(idTarea,idSub){const tarea=this.tasks.find(t=>t.id===idTarea);if(!tarea?.subtasks)return;const sub=tarea.subtasks.find(s=>s.id===idSub);if(!sub)return;const v=prompt(this.t('editSubtaskPrompt'),sub.text);if(v===null)return;const c=v.trim();if(c){sub.text=c;this.panelsSubtareasAbiertos.add(idTarea);this.renderizar();}}
  eliminarSubtarea(idTarea,idSub){const tarea=this.tasks.find(t=>t.id===idTarea);if(!tarea?.subtasks)return;if(!confirm(this.t('confirmDeleteSubtask')))return;tarea.subtasks=tarea.subtasks.filter(s=>s.id!==idSub);this.panelsSubtareasAbiertos.add(idTarea);this.renderizar();}

  // ── Construtores de HTML ──────────────────────────────────────────────────
  construirHTMLProgreso(prog){
    const c=prog.pct===100?'bg-emerald-500':prog.pct>=50?'bg-amber-500':'bg-red-400';
    return`<div class="flex items-center gap-2"><span class="text-[10px] uppercase tracking-wider text-amber-700/70 dark:text-amber-400/70 shrink-0 hidden sm:inline">${this.t('progressLabel')}</span><div class="flex-1 h-2 rounded-full bg-amber-200/60 dark:bg-zinc-700/60 overflow-hidden min-w-[50px]"><div class="progress-fill h-full rounded-full ${c}" style="width:${prog.pct}%"></div></div><span class="text-[10px] font-bold text-amber-800 dark:text-amber-300 shrink-0">${prog.hechas}/${prog.total}</span></div>`;
  }
  construirHTMLListaSubtareas(tarea){
    if(!tarea.subtasks?.length)return'';
    return tarea.subtasks.map(sub=>`<div class="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-amber-100/50 dark:hover:bg-zinc-700/40 group transition"><input type="checkbox" id="sub-${sub.id}" class="h-4 w-4 rounded accent-emerald-600 cursor-pointer shrink-0" ${sub.completed?'checked':''} onchange="organizador.alternarSubtarea('${tarea.id}','${sub.id}')"><label for="sub-${sub.id}" class="flex-1 text-sm text-amber-900/90 dark:text-amber-100/80 cursor-pointer select-none ${sub.completed?'line-through opacity-55':''}" ondblclick="organizador.editarSubtarea('${tarea.id}','${sub.id}')" title="${this.t('dblClickHint')}">${this.escaparHTML(sub.text)}</label><button class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition text-xs shrink-0" onclick="organizador.eliminarSubtarea('${tarea.id}','${sub.id}')">✕</button></div>`).join('');
  }

  construirHTMLFechaLimite(tarea){
    const urgente=this.esUrgente(tarea),vencida=this.estaVencida(tarea),tieneFecha=!!tarea.due_date;
    const idFecha=`due-date-${tarea.id}`,idHora=`due-time-${tarea.id}`;
    const valFecha=tieneFecha?(this.obtenerFechaLocalStr(tarea.due_date)||''):'';
    const valHora=(tieneFecha&&tarea.due_date_has_time)?(this.obtenerHoraLocalStr(tarea.due_date)||''):'';
    const badgeEstado=vencida
      ?`<span class="text-[10px] font-black text-red-600 dark:text-red-400 uppercase whitespace-nowrap">❌ ${this.t('overdueBadge')}</span>`
      :urgente
      ?`<span class="text-[10px] font-black text-orange-500 dark:text-orange-400 uppercase whitespace-nowrap animate-pulse">⚠️ ${this.t('urgentBadge')}</span>`
      :'';
    return`<div class="mt-2 mb-1">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-[10px] text-amber-700/50 dark:text-amber-400/50 font-semibold select-none shrink-0">📅</span>
        <input type="date" id="${idFecha}" value="${valFecha}" style="color-scheme:light dark"
          class="rounded-lg border ${vencida?'border-red-400/60':urgente?'border-orange-400/60':'border-amber-900/20 dark:border-amber-600/25'} bg-amber-50/40 dark:bg-zinc-900/50 px-2 py-1 text-xs text-[#6b7280] dark:text-amber-100/80 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition cursor-pointer"
          onchange="organizador.establecerFechaLimiteTarea('${tarea.id}',this.value,document.getElementById('${idHora}')?.value||'')">
        <input type="time" id="${idHora}" value="${valHora}" style="color-scheme:light dark"
          class="rounded-lg border border-amber-900/20 dark:border-amber-600/25 bg-amber-50/40 dark:bg-zinc-900/50 px-2 py-1 text-xs text-[#6b7280] dark:text-amber-100/80 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition cursor-pointer"
          onchange="organizador.establecerFechaLimiteTarea('${tarea.id}',document.getElementById('${idFecha}')?.value||'',this.value)">
        ${tieneFecha?`<button onclick="organizador.eliminarFechaLimiteTarea('${tarea.id}')" class="text-[10px] text-red-400/60 hover:text-red-500 transition font-black shrink-0">✕</button>`:''}
        ${badgeEstado}
        ${tieneFecha&&tarea.due_date_end?`<span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-200/70 dark:bg-violet-800/40 text-violet-700 dark:text-violet-300">⏱</span>`:''}
      </div>
    </div>`;
  }

  generarHTMLTarea(tarea){
    const estaSel=this.tareasSeleccionadas.has(tarea.id),estaExp=this.tareasExpandidas.has(tarea.id),estaAbierto=this.panelsSubtareasAbiertos.has(tarea.id);
    const urgente=this.esUrgente(tarea),vencida=this.estaVencida(tarea),tachado=tarea.completed?'line-through opacity-60':'';
    const pc=this.obtenerConfigPrioridad(tarea.priority),prog=this.obtenerProgresoSubtareas(tarea),cantSubs=(tarea.subtasks||[]).length;
    const anillo=urgente?'ring-2 ring-orange-400/70':vencida?'ring-2 ring-red-500/60':'';
    return`<article data-id="${tarea.id}" draggable="${!this.ordenadoPorFecha}" class="task-item cursor-move relative bg-gradient-to-br from-amber-50/80 via-amber-100/60 to-amber-50/70 dark:from-zinc-800/70 dark:via-zinc-700/60 dark:to-zinc-800/50 border border-amber-800/30 dark:border-amber-400/40 border-l-8 border-amber-900/60 dark:border-amber-300/50 shadow-[8px_8px_16px_rgba(0,0,0,0.3)] rounded-2xl p-5 pt-8 pb-4 transition-all duration-200 ${anillo} ${estaSel?'ring-2 ring-blue-500/60 scale-[1.01]':''}">
      ${vencida&&!tarea.completed?`<div class="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none"><span class="bg-red-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md tracking-wide">❌ ${this.t('overdueBadge')}</span></div>`:urgente?`<div class="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none"><span class="bg-orange-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md animate-pulse tracking-wide">⚠️ ${this.t('urgentBadge')}</span></div>`:''}
      <div class="absolute -top-3 -left-4 z-10"><input type="checkbox" id="sel-${tarea.id}" class="peer sr-only" ${estaSel?'checked':''} onchange="organizador.alternarSeleccion('${tarea.id}')"><label for="sel-${tarea.id}" class="flex items-center justify-center w-6 h-6 rounded-full border-2 border-amber-900/40 dark:border-amber-400/40 bg-amber-50/90 dark:bg-zinc-800/90 shadow-md cursor-pointer hover:scale-110 transition-all peer-checked:border-blue-500"><span class="w-3 h-3 rounded-full bg-blue-500 dark:bg-blue-400 scale-0 peer-checked:scale-100 transition-transform duration-200"></span></label></div>
      <button class="absolute -top-3 -right-4 w-7 h-7 rounded-full bg-red-700 text-amber-50 text-sm font-bold shadow-md hover:bg-red-800 transition" onclick="organizador.eliminarTarea('${tarea.id}')">✕</button>
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-amber-900/20 dark:border-amber-400/30 mb-3">
        <div class="flex-1 min-w-0 pr-2">
          <p id="text-${tarea.id}" data-id="${tarea.id}" class="task-text text-base sm:text-lg font-serif italic text-amber-900/95 dark:text-amber-100/90 break-words cursor-pointer select-none leading-snug ${estaExp?'':'line-clamp-4 md:line-clamp-5'} ${tachado}" ondblclick="organizador.editarTarea('${tarea.id}')" title="${this.t('dblClickHint')}">${this.escaparHTML(tarea.text.trim())}</p>
          <button id="expand-btn-${tarea.id}" class="text-xs font-sans font-bold text-blue-700 dark:text-blue-400 hover:underline mt-1 hidden" onclick="organizador.alternarExpansion('${tarea.id}')">${estaExp?this.t('expandLess'):this.t('expandMore')}</button>
        </div>
        <label class="self-start w-fit relative shrink-0 inline-flex items-center gap-2 text-xs sm:text-sm rounded-full border border-amber-900/50 dark:border-amber-400/60 bg-amber-50/80 dark:bg-zinc-900/80 px-4 py-2 cursor-pointer hover:bg-amber-100/50">
          ${this.t('priorityLabel')}: <span class="text-xs font-semibold px-2 py-1 rounded-full ml-1 text-white ${pc.color}">${this.t(pc.claveTexto)}</span>
          <select class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onchange="organizador.actualizarPrioridad('${tarea.id}',this.value)">
            <option value="high" ${tarea.priority==='high'?'selected':''}>${this.t('prioHigh')}</option>
            <option value="medium" ${tarea.priority==='medium'?'selected':''}>${this.t('prioMedium')}</option>
            <option value="low" ${tarea.priority==='low'?'selected':''}>${this.t('prioLow')}</option>
          </select>
        </label>
      </div>
      <div class="flex items-center justify-between flex-wrap gap-2 mb-1">
        <p class="text-xs sm:text-sm text-amber-700/80 dark:text-amber-300/70 font-serif italic flex items-center gap-1 cursor-pointer select-none" ondblclick="organizador.editarCategoria('${tarea.id}')" title="${this.t('dblClickHint')}">📓 <span>${this.escaparHTML(tarea.category)}</span></p>
        <button onclick="organizador.alternarPanelSubtareas('${tarea.id}')" class="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition ${estaAbierto?'bg-amber-200/80 dark:bg-amber-700/70 border-amber-700/50 text-amber-900 dark:text-amber-50':'bg-amber-50/60 dark:bg-zinc-800/60 border-amber-700/30 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100/70'}" aria-expanded="${estaAbierto}">☰ ${this.t('subtasksToggle')}${cantSubs>0?`<span class="bg-amber-600/80 text-white rounded-full px-1.5 py-0.5 text-[10px] leading-none">${cantSubs}</span>`:''}<span id="subtask-arrow-${tarea.id}" class="text-[10px]">${estaAbierto?'▲':'▼'}</span></button>
      </div>
      ${this.construirHTMLFechaLimite(tarea)}
      <div id="subtasks-panel-${tarea.id}" class="subtasks-panel ${estaAbierto?'open':''}"><div class="subtasks-inner"><div class="mt-2 pt-3 border-t border-amber-900/15 dark:border-amber-400/20 mb-3">
        <p class="text-xs uppercase tracking-wider text-amber-700/60 dark:text-amber-400/60 mb-2 px-1">${this.t('subtasksTitle')}</p>
        <div id="subtask-list-${tarea.id}" class="space-y-0.5 mb-3">${this.construirHTMLListaSubtareas(tarea)}</div>
        <div class="flex gap-2 items-center"><input type="text" id="subtask-input-${tarea.id}" placeholder="${this.t('addSubtaskPlaceholder')}" class="flex-1 rounded-md border border-amber-900/30 dark:border-amber-600/40 bg-amber-50/50 dark:bg-zinc-900/70 px-3 py-2 text-xs text-[#6b7280] dark:text-amber-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/60 transition" onkeypress="if(event.key==='Enter') organizador.agregarSubtarea('${tarea.id}')"><button onclick="organizador.agregarSubtarea('${tarea.id}')" class="shrink-0 px-3 py-2 rounded-md bg-amber-500/80 hover:bg-amber-600/90 text-amber-950 text-xs font-bold shadow transition active:scale-95">${this.t('addSubtaskBtn')}</button></div>
      </div></div></div>
      <div class="flex items-center gap-3 pt-3 mt-1 border-t border-amber-900/10 dark:border-amber-400/15">
        <div id="progress-wrap-${tarea.id}" class="min-w-0 max-w-[52%] flex-1">${prog?this.construirHTMLProgreso(prog):''}</div>
        <div class="flex-1"></div>
        <label class="flex items-center gap-2 cursor-pointer bg-amber-100/80 dark:bg-amber-700/70 px-3 py-1.5 rounded-md border-2 border-emerald-600/40 dark:border-emerald-400/40 shadow hover:bg-amber-200/90 dark:hover:bg-amber-600/80 transition shrink-0 select-none">
          <input type="checkbox" id="task-chk-${tarea.id}" class="h-4 w-4 cursor-pointer accent-emerald-600" ${tarea.completed?'checked':''} onchange="organizador.alternarTarea('${tarea.id}')">
          <span class="text-xs font-semibold text-emerald-800 dark:text-emerald-200">${this.t('markDone')}</span>
        </label>
      </div>
    </article>`;
  }

  // ── Renderização ──────────────────────────────────────────────────────────
  renderizarFiltrosEstado(){
    const html=this.filtrosEstado.map(f=>{
      const activo=this.filtroActual===f.id;
      return`<button class="filter-btn text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full border transition ${activo?`border-${f.color}-900/40 bg-${f.color}-100/80 dark:bg-${f.color}-700/70 text-ink dark:text-${f.color}-50 shadow-sm`:`border-${f.color}-700/60 bg-transparent text-${f.color}-800 dark:text-${f.color}-200 hover:bg-${f.color}-100/30`}" data-filter="${f.id}">${this.t(f.claveLabel)}</button>`;
    }).join('');
    ['statusFiltersContainer','statusFiltersContainerMobile'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML=html;});
  }

  renderizarFiltrosCategorias(){
    const vistos=new Set(),cats=['all'];
    this.tasks.forEach(t=>{
      const low=t.category.toLowerCase();
      if(!vistos.has(low)){vistos.add(low);cats.push(t.category);}
    });
    const actualLow=this.categoriaActual==='all'?'all':this.categoriaActual.toLowerCase();
    let btns='',sel='';
    cats.forEach(cat=>{
      const low=cat==='all'?'all':cat.toLowerCase();
      const activo=low===actualLow;
      const label=cat==='all'?this.t('filterAll'):cat;
      const cls=cat==='all'?(activo?'bg-amber-200/90 dark:bg-amber-700/80 border-amber-900/60 text-amber-900 dark:text-amber-50':'bg-amber-100/60 dark:bg-amber-800/40 border-amber-900/30 text-amber-800 dark:text-amber-200 hover:bg-amber-200/60'):(activo?'bg-blue-200/90 dark:bg-blue-800/80 border-blue-600/60 text-blue-900 dark:text-blue-50':'bg-blue-50/70 dark:bg-blue-900/40 border-blue-400/50 text-blue-800 dark:text-blue-200 hover:bg-blue-100');
      btns+=`<button class="cat-filter-btn ${cls} text-xs font-semibold px-3 py-1.5 rounded-full border shadow-sm transition min-w-[55px]" data-category="${cat}">${label}</button>`;
      if(cat!=='all')sel+=`<option value="${cat}">${this.escaparHTML(cat)}</option>`;
    });
    sel+=`<option value="nueva">${this.t('writeNew')}</option>`;
    ['categoryFilterContainer','categoryFilterContainerMobile'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML=btns;});
    const catSelect=document.getElementById('nuevaCategoriaSelect');
    if(catSelect){
      const cur=catSelect.value;catSelect.innerHTML=sel;
      const curLow=cur.toLowerCase();
      const match=cats.find(c=>c.toLowerCase()===curLow&&c!=='all');
      if(match&&match!=='nueva')catSelect.value=match;
      else catSelect.value=cats.length>1?cats[1]:'General';
    }
    const ti=document.getElementById('nuevaCategoriaTexto'),cb=document.getElementById('btnCancelarNuevaCat');
    if(ti&&cb&&catSelect){
      ti.addEventListener('input',()=>cb.classList.toggle('hidden',ti.classList.contains('hidden')));
      catSelect.addEventListener('change',()=>cb.classList.toggle('hidden',ti.classList.contains('hidden')));
    }
  }

  renderizar(){
    const contenedor=document.getElementById('tasksContainer');if(!contenedor)return;
    this.actualizarEstadisticas();this.renderizarFiltrosCategorias();this.actualizarUIAccionesMasivas();
    let filtradas=this.tasks.filter(t=>this.coincideConFiltro(t));
    if(this.ordenadoPorFecha)filtradas=[...filtradas].sort((a,b)=>(a.due_date?new Date(a.due_date).getTime():Infinity)-(b.due_date?new Date(b.due_date).getTime():Infinity));
    if(!filtradas.length){
      const msg=this.filtroDiaCalendario?`<div class="text-center py-6 text-[#6b7280] dark:text-amber-300">📅 Sin tareas este día.<br><button class="mt-2 text-xs text-blue-600 dark:text-blue-400 underline" onclick="organizador.limpiarFiltroDia()">${this.t('calClearFilter')}</button></div>`:`<div class="text-center py-8 text-[#6b7280] dark:text-amber-300">${this.terminoBusqueda?this.t('noTasksSearch'):this.t('noTasks')}</div>`;
      contenedor.innerHTML=`<h2 class="text-xl font-semibold tracking-wide text-amber-900 dark:text-amber-100 mb-2">${this.t('taskListTitle')}</h2>${msg}`;return;
    }
    contenedor.innerHTML=`<h2 class="text-xl font-semibold tracking-wide text-amber-900 dark:text-amber-100 mb-2">${this.t('taskListTitle')}</h2>`+filtradas.map(t=>this.generarHTMLTarea(t)).join('');
    setTimeout(()=>{contenedor.querySelectorAll('.task-text').forEach(el=>{const btn=document.getElementById(`expand-btn-${el.dataset.id}`);if(btn&&(this.tareasExpandidas.has(el.dataset.id)||el.scrollHeight>el.clientHeight))btn.classList.remove('hidden');});},50);
  }

  // ── Vinculação de eventos ─────────────────────────────────────────────────
  vincularEventos(){
    document.getElementById('btnTabManual')?.addEventListener('click',()=>this.establecerTabActiva('manual'));
    document.getElementById('btnTabInteligente')?.addEventListener('click',()=>this.establecerTabActiva('smart'));

    // Tema — fecha o dropdown de settings após alternar
    document.getElementById('themeToggleFixed')?.addEventListener('click',()=>{
      this.alternarTema();
      document.getElementById('settingsDropdown')?.classList.remove('open');
    });

    document.getElementById('btnAgregarTarea')?.addEventListener('click',()=>this.agregarTarea());
    document.getElementById('nuevaTareaInput')?.addEventListener('keypress',e=>{if(e.key==='Enter')this.agregarTarea();});

    // Oculta o aviso de tarea vacía ao digitar
    document.getElementById('nuevaTareaInput')?.addEventListener('input',()=>{
      document.getElementById('msgErrorTitulo')?.classList.add('hidden');
    });

    document.getElementById('btnAccionTareaInteligente')?.addEventListener('click',()=>this.ejecutarTareaInteligente());
    document.getElementById('smartTaskPrompt')?.addEventListener('keypress',e=>{if(e.key==='Enter')this.ejecutarTareaInteligente();});
    ['searchInput','searchInputMobile'].forEach(id=>{
      document.getElementById(id)?.addEventListener('input',e=>{
        this.terminoBusqueda=e.target.value.toLowerCase();
        const otro=id==='searchInput'?'searchInputMobile':'searchInput';
        const otroEl=document.getElementById(otro);if(otroEl)otroEl.value=e.target.value;
        this.renderizar();
      });
    });
    document.getElementById('btnSeleccionarTodo')?.addEventListener('click',()=>this.alternarSeleccionarTodo());
    document.getElementById('btnAccionCompletar')?.addEventListener('click',()=>this.ejecutarAccionCompletar());
    document.getElementById('btnAccionEliminar')?.addEventListener('click',()=>this.ejecutarAccionEliminar());
    // Ambos os botões de ordenar (mobile drawer + desktop sidebar)
    document.getElementById('btnOrdenarPorFecha')?.addEventListener('click',()=>this.alternarOrdenPorFecha());
    document.getElementById('btnOrdenarPorFechaDesktop')?.addEventListener('click',()=>this.alternarOrdenPorFecha());
    document.getElementById('calPrevBtn')?.addEventListener('click',()=>this.navegarCalendario(-1));
    document.getElementById('calNextBtn')?.addEventListener('click',()=>this.navegarCalendario(+1));
    document.getElementById('calPrevBtnMobile')?.addEventListener('click',()=>this.navegarCalendario(-1));
    document.getElementById('calNextBtnMobile')?.addEventListener('click',()=>this.navegarCalendario(+1));
    document.getElementById('btnToggleCalendarioMobile')?.addEventListener('click',()=>this.alternarCalendarioMobile());
    document.getElementById('btnMenuMobile')?.addEventListener('click',()=>this.alternarDrawerMobile());
    document.getElementById('mobileDrawerBackdrop')?.addEventListener('click',()=>this.cerrarDrawerMobile());
    document.getElementById('btnAgregarSubtarea')?.addEventListener('click',()=>this.agregarSubtareaPendiente());
    document.getElementById('nuevaSubtareaInput')?.addEventListener('keypress',e=>{if(e.key==='Enter'){e.preventDefault();this.agregarSubtareaPendiente();}});
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'){
        if(this.tareasVistaPreviaInteligente.length)this.cancelarVistaPrevia();
        else if(this.drawerMobileAbierto)this.cerrarDrawerMobile();
        // Fecha o dropdown de settings com Escape
        document.getElementById('settingsDropdown')?.classList.remove('open');
      }
    });
    document.addEventListener('click',e=>{
      if(e.target.classList.contains('filter-btn')){this.filtroActual=e.target.dataset.filter;this.tareasSeleccionadas.clear();this.renderizarFiltrosEstado();this.renderizar();}
      if(e.target.classList.contains('cat-filter-btn')){this.categoriaActual=e.target.dataset.category;this.tareasSeleccionadas.clear();this.renderizar();}
    });
    const dnd=document.getElementById('tasksContainer');
    if(dnd){
      dnd.addEventListener('dragstart',e=>{if(this.ordenadoPorFecha)return;const it=e.target.closest('.task-item');if(!it)return;this.idArrastrado=it.dataset.id;setTimeout(()=>it.classList.add('opacity-40','scale-95'),0);});
      dnd.addEventListener('dragover',e=>e.preventDefault());
      dnd.addEventListener('drop',e=>{e.preventDefault();const it=e.target.closest('.task-item');if(it&&this.idArrastrado&&it.dataset.id!==this.idArrastrado)this.reordenarTareas(this.idArrastrado,it.dataset.id);});
      dnd.addEventListener('dragend',e=>{e.target.closest('.task-item')?.classList.remove('opacity-40','scale-95');this.idArrastrado=null;});
    }
  }

  // ── Tema ──────────────────────────────────────────────────────────────────
  cargarTema(){
    const oscuro=storageManager.cargarTema('light')==='dark';
    document.documentElement.classList.toggle('dark',oscuro);
    document.documentElement.classList.toggle('light',!oscuro);
    document.documentElement.style.colorScheme=oscuro?'dark':'light';
    // Ícone do botão de tema fixo (dentro do settings dropdown desktop)
    const ti=document.getElementById('themeIconFixed');if(ti)ti.textContent=oscuro?'☀️':'🌙';
    // Label do settings dropdown desktop (mostra para qual modo vai ao clicar)
    const desktopLabel=document.getElementById('desktopThemeLabel');
    if(desktopLabel)desktopLabel.textContent=oscuro?this.t('lightMode'):this.t('darkMode');
    // Ícone e label do drawer mobile
    const icono=document.getElementById('drawerThemeIcon');if(icono)icono.textContent=oscuro?'☀️':'🌙';
    const label=document.getElementById('drawerThemeLabel');if(label)label.textContent=oscuro?this.t('lightMode'):this.t('darkMode');
  }
  alternarTema(){
    const oscuro=document.documentElement.classList.contains('dark');
    storageManager.guardarTema(oscuro?'light':'dark');
    this.cargarTema();
  }

  // ── CRUD de tareas ────────────────────────────────────────────────────────
  async agregarTarea(){
    const inputTitulo=document.getElementById('nuevaTareaInput');
    const btnAgregar=document.getElementById('btnAgregarTarea');
    const selectPrio=document.getElementById('nuevaPrioridadInput');
    const selectCat=document.getElementById('nuevaCategoriaSelect');
    const inputCat=document.getElementById('nuevaCategoriaTexto');
    const inputFecha=document.getElementById('nuevaTareaFecha');
    const inputHora=document.getElementById('nuevaTareaHora');
    const btnCancelar=document.getElementById('btnCancelarNuevaCat');
    const msgError=document.getElementById('msgErrorTitulo');

    const texto=inputTitulo?.value.trim();

    // Aviso inline quando o título está vazio
    if(!texto){
      if(msgError){
        msgError.textContent=`⚠️ ${this.t('emptyTaskWarning')}`;
        msgError.classList.remove('hidden');
        // Auto-oculta após 3 s
        clearTimeout(msgError._timer);
        msgError._timer=setTimeout(()=>msgError.classList.add('hidden'),3000);
      }
      inputTitulo?.focus();
      return;
    }
    // Oculta o aviso se o título for válido
    if(msgError)msgError.classList.add('hidden');

    const esDuplicada=this.tasks.some(t=>t.text.toLowerCase().trim()===texto.toLowerCase().trim());
    if(esDuplicada){alert(this.t('duplicateTask'));inputTitulo?.focus();return;}

    const prioridad=selectPrio?.value||'medium';
    let rawCat='General';
    if(inputCat&&!inputCat.classList.contains('hidden')&&inputCat.value.trim())rawCat=inputCat.value.trim();
    else if(selectCat?.value&&selectCat.value!=='nueva')rawCat=selectCat.value;

    const catExistente=this.tasks.find(t=>t.category.toLowerCase()===rawCat.toLowerCase());
    const categoria=catExistente?catExistente.category:this.normalizarCategoria(rawCat);
    const subtareas=this.subtareasPendientes.map(s=>({id:Date.now().toString()+Math.random(),text:s,completed:false}));
    this.subtareasPendientes=[];

    const valFecha=inputFecha?.value||'';
    const valHora=inputHora?.value||'';

    // Limpa o formulário imediatamente para UX responsiva
    if(inputTitulo)inputTitulo.value='';
    if(selectPrio)selectPrio.value='medium';
    if(inputFecha)inputFecha.value='';
    if(inputHora)inputHora.value='';
    if(inputCat){inputCat.value='';inputCat.classList.add('hidden');}
    if(btnCancelar)btnCancelar.classList.add('hidden');
    if(selectCat)selectCat.classList.remove('hidden');
    this.renderizarSubtareasPendientes();

    // Estado de carga no botão enquanto o fetch viaja ao servidor
    if(btnAgregar){btnAgregar.disabled=true;btnAgregar.innerHTML=`<span class="animate-pulse">⏳</span>`;}

    try{
      const tareaCreada=await clienteApi.crearTarea({titulo:texto,prioridad});
      tareaCreada.subtasks=subtareas;
      tareaCreada.category=categoria;
      if(valFecha){
        const r=this.construirFechaLimite(valFecha,valHora);
        if(r){tareaCreada.due_date=r.iso;tareaCreada.due_date_has_time=r.tieneHora;}
      }
      this.tasks.unshift(tareaCreada);
      this.renderizarCalendario();
      this.renderizar();
    }catch(err){
      alert('Error al crear la tarea: '+err.message);
    }finally{
      // Restaura o botão independentemente do resultado
      if(btnAgregar){btnAgregar.disabled=false;btnAgregar.textContent=this.t('addBtn');}
      inputTitulo?.focus();
    }
  }

  editarTarea(id){const t=this.tasks.find(t=>t.id===id);if(!t)return;const v=prompt(this.t('editTaskPrompt'),t.text);if(v?.trim()){t.text=v.trim();this.renderizar();}}
  editarCategoria(id){
    const t=this.tasks.find(t=>t.id===id);if(!t)return;
    const v=prompt(this.t('editCategoryPrompt'),t.category);if(!v?.trim())return;
    const existente=this.tasks.find(otro=>otro.id!==id&&otro.category.toLowerCase()===v.trim().toLowerCase());
    t.category=existente?existente.category:this.normalizarCategoria(v);
    this.renderizar();
  }
  alternarExpansion(id){this.tareasExpandidas.has(id)?this.tareasExpandidas.delete(id):this.tareasExpandidas.add(id);this.renderizar();}
  alternarTarea(idTarea){const tarea=this.tasks.find(t=>t.id===idTarea);if(!tarea)return;tarea.completed=!tarea.completed;if(tarea.subtasks?.length)tarea.subtasks.forEach(s=>s.completed=tarea.completed);this.renderizar();}
  actualizarPrioridad(id,p){const t=this.tasks.find(t=>t.id===id);if(t){t.priority=p;this.renderizar();}}

  async eliminarTarea(id){
    const t=this.tasks.find(t=>t.id===id);if(!t)return;
    if(!confirm(`${this.t('confirmDelete')}${t.text}${this.t('confirmDeleteSuffix')}`))return;

    // Estado de carga: escurece o card e bloqueia interações
    const cardEl=document.querySelector(`article[data-id="${id}"]`);
    if(cardEl){cardEl.classList.add('opacity-40','pointer-events-none','scale-[0.98]');}

    try{
      await clienteApi.eliminarTarea(id);
      this.tasks=this.tasks.filter(t=>t.id!==id);
      this.tareasSeleccionadas.delete(id);
      this.tareasExpandidas.delete(id);
      this.panelsSubtareasAbiertos.delete(id);
      this.renderizarCalendario();
      this.renderizar();
    }catch(err){
      // Restaura o card se a eliminação falhar
      if(cardEl){cardEl.classList.remove('opacity-40','pointer-events-none','scale-[0.98]');}
      alert('Error al eliminar: '+err.message);
    }
  }

  reordenarTareas(idOrigen,idDestino){const io=this.tasks.findIndex(t=>t.id===idOrigen),id=this.tasks.findIndex(t=>t.id===idDestino);if(io>-1&&id>-1){const[dt]=this.tasks.splice(io,1);this.tasks.splice(id,0,dt);this.renderizar();}}
  alternarSeleccion(id){this.tareasSeleccionadas.has(id)?this.tareasSeleccionadas.delete(id):this.tareasSeleccionadas.add(id);this.actualizarUIAccionesMasivas();this.renderizar();}
  alternarSeleccionarTodo(){const f=this.tasks.filter(t=>this.coincideConFiltro(t));const todas=f.length>0&&f.every(t=>this.tareasSeleccionadas.has(t.id));f.forEach(t=>todas?this.tareasSeleccionadas.delete(t.id):this.tareasSeleccionadas.add(t.id));this.renderizar();}
  ejecutarAccionCompletar(){const f=this.tasks.filter(t=>this.coincideConFiltro(t));const objetivos=this.tareasSeleccionadas.size>0?this.tasks.filter(t=>this.tareasSeleccionadas.has(t.id)):f;if(!objetivos.length)return;const nuevoEstado=!objetivos.every(t=>t.completed);objetivos.forEach(t=>{t.completed=nuevoEstado;if(t.subtasks?.length)t.subtasks.forEach(s=>s.completed=nuevoEstado);});this.tareasSeleccionadas.clear();this.renderizar();}
  ejecutarAccionEliminar(){if(this.tareasSeleccionadas.size>0){if(confirm(`${this.t('confirmDeleteMultiple')}${this.tareasSeleccionadas.size}${this.t('confirmDeleteMultipleSuffix')}`)){this.tasks=this.tasks.filter(t=>!this.tareasSeleccionadas.has(t.id));this.tareasSeleccionadas.clear();}else return;}else{const cant=this.tasks.filter(t=>t.completed).length;if(!cant){alert(this.t('noTasksDone'));return;}if(confirm(`${this.t('confirmDeleteDone')}${cant}${this.t('confirmDeleteDoneSuffix')}`))this.tasks=this.tasks.filter(t=>!t.completed);else return;}this.renderizarCalendario();this.renderizar();}
  actualizarUIAccionesMasivas(){
    const sb=document.getElementById('btnSeleccionarTodo'),cb=document.getElementById('btnAccionCompletar'),db=document.getElementById('btnAccionEliminar');if(!sb||!cb||!db)return;
    const f=this.tasks.filter(t=>this.coincideConFiltro(t));sb.innerHTML=f.length>0&&f.every(t=>this.tareasSeleccionadas.has(t.id))?this.t('deselectAll'):this.t('selectAll');
    const objetivos=this.tareasSeleccionadas.size>0?this.tasks.filter(t=>this.tareasSeleccionadas.has(t.id)):f;const todasHechas=objetivos.length>0&&objetivos.every(t=>t.completed);
    if(this.tareasSeleccionadas.size>0){cb.innerHTML=todasHechas?`${this.t('pendingSelected')} (${this.tareasSeleccionadas.size})`:`${this.t('completeSelected')} (${this.tareasSeleccionadas.size})`;db.innerHTML=`${this.t('deleteSel')} (${this.tareasSeleccionadas.size})`;}
    else{cb.innerHTML=(todasHechas&&f.length>0)?this.t('pendingAll'):this.t('completeAll');db.innerHTML=this.t('deleteDone');}
  }
  coincideConFiltro(t){
    const ms=t.text.toLowerCase().includes(this.terminoBusqueda)||t.category.toLowerCase().includes(this.terminoBusqueda);
    const mp=this.filtroActual==='all'||this.filtroActual===t.priority||(this.filtroActual==='completed'&&t.completed)||(this.filtroActual==='pending'&&!t.completed);
    const mc=this.categoriaActual==='all'||t.category.toLowerCase()===this.categoriaActual.toLowerCase();
    let md=true;if(this.filtroDiaCalendario){if(!t.due_date){md=false;}else{const ld=this.obtenerDiaLocal(t.due_date),f=this.filtroDiaCalendario;md=ld&&ld.year===f.year&&ld.month===f.month&&ld.day===f.day;}}
    return ms&&mp&&mc&&md;
  }
  actualizarEstadisticas(){
    const total=this.tasks.length,hechas=this.tasks.filter(t=>t.completed).length,pendientes=total-hechas;
    const vals=[total,hechas,pendientes];
    [['statTotal','statTotalMobile'],['statCompleted','statCompletedMobile'],['statPending','statPendingMobile']].forEach(([id,idM],i)=>{
      const el=document.getElementById(id);if(el)el.textContent=String(vals[i]);
      const em=document.getElementById(idM);if(em)em.textContent=String(vals[i]);
    });
  }
}

// Instância global
const organizadorDeTareas = new OrganizadorDeTareas();
const organizador = organizadorDeTareas;