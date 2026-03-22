6. Experimentos con IA en programación

    Elige tres pequeños problemas de programación
    Resuélvelos primero sin usar IA
    Resuélvelos después con ayuda de IA
    Compara tiempo invertido, calidad del código y comprensión del problema
    Repite el experimento con tres tareas relacionadas con tu proyecto
    Documenta todo el proceso en docs/ai/experiments.md

7.    Ampliar TaskFlow con ayuda de IA

    Añade al menos cuatro nuevas funcionalidades al proyecto
    Posibles ejemplos: filtro de tareas, búsqueda por texto, ordenación, edición de tareas
    Utiliza IA para generar ideas de mejora
    Implementa las funcionalidades revisando siempre el código generado
    Haz commits separados para cada funcionalidad

8. Documentación asistida por IA

    Pide a la IA que genere una primera versión mejorada del README
    Pide ayuda para documentar funciones del proyecto
    Revisa y corrige manualmente la documentación generada
    Añade ejemplos de uso del proyecto en el README




####-----------------------------   EXPERIMENTOS CON IA   -----------------------------####
####-----------------------------   PROBLEMAS   -----------------------------####

Durante o desenvolvimento da funcionalidade de abas no Organizador de Tareas, o objetivo era criar dois painéis distintos: um para tarefas manuais (já existente) e um novo para tarefas processadas por linguagem natural com Regex + Chrono.js. A aba "Tareas manuales" deveria abrir automaticamente ao carregar a página, e a aba "Tareas inteligentes" deveria funcionar como um painel independente que, ao receber um texto informal, o converte em uma tarefa estruturada. Ao longo da implementação, foram identificados e corrigidos múltiplos erros em sequência, descritos abaixo.
setActiveTab(tab) {
  const manualPanel = document.getElementById('manualTasksPanel');
  const smartPanel  = document.getElementById('smartTasksPanel');
  manualPanel.classList.toggle('hidden', tab !== 'manual');
  smartPanel.classList.toggle('hidden', tab !== 'smart');
}
Ao clicar nos botões, nada mudava visualmente na tela. O console do navegador apresentava o erro:
Uncaught TypeError: Cannot read properties of null (reading 'classList')
O elemento com id="manualTasksPanel" simplesmente não existia no HTML. O formulário de tarefas manuais estava solto dentro do <main>, sem nenhuma <div> envolvendo-o com esse identificador. O JavaScript encontrava null ao chamar getElementById('manualTasksPanel') e quebrava ao tentar acessar .classList em null.
Solução aplicada
Foi necessário envolver todo o bloco do painel manual (formulário, lista de tarefas e botões de ação em massa) com uma <div id="manualTasksPanel">, garantindo que o JavaScript tivesse um elemento concreto para manipular:
ANTES: solto no HTML, sem ID:
<section class="mb-8">
  <div class="flex flex-col lg:flex-row gap-3...">
    <!-- formulário -->
  </div>
</section>
<section id="tasksContainer" class="space-y-4"></section>

DEPOIS: envolvido pelo painel:
<div id="manualTasksPanel">
  <section class="mb-8">
    <!-- formulário -->
  </section>
  <section id="tasksContainer" class="space-y-4"></section>
  <div class="mt-8 pt-6 border-t...">
    <!-- botões de ação em massa... -->
  </div>
</div>
Ao reorganizar o bindEvents() para adicionar os listeners das novas abas, durante uma edição rápida o método foi declarado com um ponto e vírgula entre os parênteses e a chave de abertura:
bindEvents() ;{
    document.getElementById('manualTabBtn')?.addEventListener('click', () => this.setActiveTab('manual'));
    document.getElementById('smartTabBtn')?.addEventListener('click', () => this.setActiveTab('smart'));

(...)
O VS Code sublinhava de vermelho a chave { de abertura do bindEvents(). A página carregava em branco no navegador, sem nenhum erro visível para o utilizador. Ao abrir o console do DevTools, o erro era:
Uncaught SyntaxError: Unexpected token '{'
Toda a classe OrganizadorDeTareas parava de ser interpretada a partir desse ponto, tornando todos os botões da aplicação não funcionais — não apenas as abas.
Em JavaScript, ao declarar um método dentro de uma classe, a sintaxe correta é nomeDoMetodo() {. Ao inserir ; antes de {, o interpretador entende que a linha terminou ali e que o bloco { ... } a seguir é um bloco de código avulso e inválido nesse contexto, gerando um erro fatal de sintaxe.
Remoção do ponto e vírgula, restaurando a declaração correta:
bindEvents() {
    document.getElementById('manualTabBtn')?.addEventListener('click', () => this.setActiveTab('manual'));
(...)

Após corrigir o ponto e vírgula, o sublinhado vermelho continuou aparecendo — desta vez no { de abertura do bindEvents(). A tentativa foi adicionar e remover chaves em diferentes posições ao redor do bindEvents(), mover a função para antes do render(), e até adicionar chaves extras no final do arquivo para "equilibrar" a contagem.
movendo o bindEvents para cima
bindEvents() {
(...)

render() {
  filteredTasks.forEach(task => container.appendChild(this.createTaskElement(task)));
(...)

Depois, tentei adicionar chave extra no final
  }
}
const organizadorDeTareas = new OrganizadorDeTareas();

Nenhuma das tentativas resolveu o sublinhado vermelho. Ao adicionar chaves em posições aleatórias, o erro mudava de lugar mas não desaparecia. Em alguns casos, a aplicação chegava a carregar mas sem nenhuma tarefa sendo renderizada, ou com o console mostrando:
Uncaught SyntaxError: Unexpected token '}'
A função render() estava com a sua chave de fechamento } faltando ao final. Como o JavaScript analisa o código de forma sequencial, ao chegar no bindEvents() sem a função anterior ter sido fechada, ele interpreta que bindEvents() está sendo declarado dentro de render() — o que é inválido para a sintaxe de classe. Isso explica por que mover o bindEvents() para antes do render() "parecia" corrigir o erro visualmente, mas na realidade só deslocava o problema para outra função.
estava assim :
render() {
    const container = document.getElementById('tasksContainer');
(...)
    filteredTasks.forEach(task => {
        container.appendChild(this.createTaskElement(task));
    });
    FALTAVA UMA CHAVE DE FECHAMENTO

bindEvents() {   // ← O editor sublinhava AQUI de vermelho
(...)
Adição da chave de fechamento } no lugar correto, imediatamente após o forEach final do render():
    filteredTasks.forEach(task => {
        container.appendChild(this.createTaskElement(task));
    });
  }

  O que foi tentado

Com a sintaxe corrigida e a aplicação a carregar sem erros no console, os botões das abas continuavam sem resposta ao clique. Ao inspecionar o bindEvents(), as linhas dos listeners das abas tinham sido escritas sem as arrow functions de envoltura:
Tentativa:
document.getElementById('manualTabBtn')?.addEventListener('click', this.setActiveTab('manual'));
document.getElementById('smartTabBtn')?.addEventListener('click', this.setActiveTab('smart'));

Para tentar corrigir, foram feitas algumas variações como:
document.getElementById('manualTabBtn')?.addEventListener('click', this.setActiveTab.bind(this, 'manual'));
document.getElementById('manualTabBtn')?.addEventListener('click', 'manual');

A variação sem arrow function e sem .bind() executava setActiveTab('manual') uma única vez durante o carregamento da página (na linha do bindEvents), e depois não fazia nada ao clicar, pois o listener recebido era o valor de retorno da função (que é undefined). A variação com string simplesmente era ignorada pelo navegador (strings não são funções válidas como listeners). A aba parecia "funcionar" uma vez ao carregar mas travava depois.
O método addEventListener espera receber como segundo argumento uma referência a uma função (ou seja, algo que possa ser chamado futuramente). Ao escrever this.setActiveTab('manual') sem a envoltura () =>, o JavaScript executa a função imediatamente durante a leitura do código e passa o seu valor de retorno (undefined) como listener — comportamento chamado de Immediately Invoked Function. O evento de clique ficava registrado, mas com um listener nulo.
Como solução, envolvi a chamada em uma arrow function, criando uma nova função que serve de ponte e só executa setActiveTab quando o clique ocorrer de facto:
document.getElementById('manualTabBtn')?.addEventListener('click', () => this.setActiveTab('manual'));
document.getElementById('smartTabBtn')?.addEventListener('click', () => this.setActiveTab('smart'));

CORREÇÃO DA IA:
O erro está na primeira linha do seu trecho de código, especificamente em como a função bindEvents() foi declarada.

Você adicionou um ponto e vírgula (;) logo após os parênteses, antes da abertura das chaves {. Em JavaScript, ao declarar um método dentro de uma classe, não se deve colocar ponto e vírgula entre os parênteses e a chave.
Como está no seu código (Errado):
bindEvents() ;{ // <-- ESSE PONTO E VÍRGULA ESTÁ CAUSANDO O ERRO
    document.getElementById('manualTabBtn')?.addEventListener('click', () => this.setActiveTab('manual'));
// ...
Como deve ficar (Correto):
bindEvents() { // <-- Sem ponto e vírgula
    document.getElementById('manualTabBtn')?.addEventListener('click', () => this.setActiveTab('manual'));
    document.getElementById('smartTabBtn')?.addEventListener('click', () => this.setActiveTab('smart'));
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
    
    document.getElementById('smartTaskActionBtn')?.addEventListener('click', () => this.executeSmartTask());
    document.getElementById('smartTaskPrompt')?.addEventListener('keypress', (e) => { 
      if(e.key === 'Enter') this.executeSmartTask(); 
    });
}
Por que esse erro acontece?

Ao colocar o ;, o JavaScript interpreta que a declaração da função acabou ali e que o bloco { ... } seguinte é apenas um bloco de código solto, o que causa um erro de sintaxe fatal (SyntaxError) que impede que todo o resto do seu aplicativo carregue (botões parando de funcionar, abas não abrindo, etc).

Remova esse ; e o seu código vai voltar a rodar perfeitamente!
-> ja removi, mas nao muda nada e o primeiro { esta surraiado de vermelho
Entendi! Se a linha do erro está sublinhada de vermelho no seu editor (como o VS Code), isso significa que há um erro de sintaxe na linha exata ou na linha imediatamente anterior a ela.

Analisando o seu arquivo JavaScript na íntegra, há um erro na função render() que está "vazando" para o bindEvents() e quebrando a estrutura da classe.​
O problema real

Se olharmos como a função anterior (no caso, a função render()) termina no seu arquivo, ela está faltando uma chave de fechamento }. Em JavaScript, se você não fecha a função anterior, o editor acha que o bindEvents() está sendo declarado dentro da função anterior, o que é ilegal.

Procure a função render() no seu código. O final dela provavelmente está assim:
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
    // O ERRO ESTÁ AQUI: FALTA A CHAVE DE FECHAMENTO DO RENDER!

  bindEvents() {
    // ...
A Solução

Adicione a chave de fechamento } antes do bindEvents() e certifique-se de que o bindEvents inicie limpo.

O trecho de transição entre o render e o bindEvents deve ficar exatamente assim:
    filteredTasks.forEach(task => {
      container.appendChild(this.createTaskElement(task));
    });
  } // <--- ESTA CHAVE ESTAVA FALTANDO!

  bindEvents() {
    document.getElementById('manualTabBtn')?.addEventListener('click', () => this.setActiveTab('manual'));
    document.getElementById('smartTabBtn')?.addEventListener('click', () => this.setActiveTab('smart'));
    document.getElementById('themeToggle')?.addEventListener('click',()=>this.toggleTheme());
    document.getElementById('themeToggleMobile')?.addEventListener('click',()=>this.toggleTheme());
Isso fará o sublinhado vermelho desaparecer imediatamente do seu editor, pois agora as funções da classe OrganizadorDeTareas estão devidamente separadas!

RESULTADO:
Nenhuma das soluções aplicadas por mim ou pelo chatGPT foi capaz de resolver o problema. Tive que ir a outra IA, Claude, para isso.
Na primeira tentativa, a IA não foi capaz de terminar a execução do prompt.
Em segunda tentativa:
🐛 Bugs corrigidos em app.js
BugProblemaCorreçãoeditSubtask + executeSmartTaskexecuteSmartTask estava aninhado dentro de editSubtask com chaves mal fechadas — ambas quebravamSeparados em métodos independentes com estrutura corretatoggleSubtaskPanelUsava task.id (variável inexistente naquele escopo)Corrigido para taskId (o parâmetro)Código de API órfãoHavia um bloco const data = await response.json() flutuando sem try/awaitRemovido — toda a lógica usa Regex + Chrono.js como especificado
✅ O que foi implementado/ajustado

Aba manual abre por padrão — init() sempre chama setActiveTab('manual')
Aba inteligente é estruturalmente separada mas compartilha a mesma lista de tarefas (#tasksContainer fica fora dos dois painéis, sempre visível)
executeSmartTask usa Chrono.js (com locale por idioma) + Regex para extrair: data/hora, prioridade (alta/baixa) e categoria (Compras, Trabalho, Estudos, Saúde, Casa)
Após criar a tarefa inteligente, volta automaticamente para a aba manual para o usuário ver a tarefa criada
Chips de exemplo na aba inteligente para o usuário testar rapidamente
i18n.js — chaves faltantes (manualTasksTab, smartTasksTab, editSubtaskPrompt, etc.) adicionadas nos 3 idiomas
index.html agora carrega os 3 scripts externos em vez de duplicar a classe inline

Agora o código roda perfeitamente!

Tempo invertido em tentativa manual direta: aproximadamente 50 minutos, qualidade baixa
Tempo invertido com chatGPT: 2 horas, qualidade média em explicações e compreensão do assunto, mas sem resultado que funcionasse para esse problema em questão.
Tempo invertido com Claude: 15 minutos, baixa compreensão do problema, mas rápida solução correta encontrada para o item em questão e outros bugs do código!
