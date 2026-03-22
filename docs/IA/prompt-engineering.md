5. Prompt engineering aplicado al desarrollo

    Experimenta con prompts donde definas un rol (por ejemplo 'actúa como un desarrollador senior')
    Experimenta con prompts con ejemplos (few-shot prompting)
    Experimenta pidiendo razonamiento paso a paso
    Experimenta usando restricciones claras en la respuesta
    Utiliza estos prompts para generar código, refactorizar funciones y documentar el proyecto
    Guarda al menos diez prompts útiles en docs/ai/prompt-engineering.md
    Explica por qué cada prompt funciona bien

####-----------------------------   PROMPTS ÚTILES   -----------------------------####

-> Crie caminhos para: - A aba que abre como principal e automaticamente, deve ser a correspondente a "tareas manuales" que está no inicio do código. - A segunda aba, "tareas inteligentes" deve ser uma réplica da primeira, e a seguir vamos aplicar as alterações apenas nessa aba. Depois das novas mudanças, a partir disso, apenas para a aba, que será como uma nova janela, execute esse system prompt: Você é um assistente de produtividade. Sua tarefa é converter frases informais em dados estruturados no formato JSON. Exemplos: User: Preciso comprar pão amanhã as 08h com prioridade alta. AI: {"task": "Comprar pão", "due_date": "2024-05-11T08:00:00", "priority": 3, "category": "Compras"} User: Marcar reunião de feedback com o time para quarta que vem. AI: {"task": "Reunião de feedback com o time", "due_date": "2024-05-15T10:00:00", "priority": 2, "category": "Trabalho"} User: {{input_do_usuario}} AI:

-> como passo meu projeto do github para o cursor no pc

-> Tenho a tarefa ainda ali para: "Prueba Composer para generar cambios que afecten a varios archivos"
como posso usar isso da maneira mais produtiva possivel?

-> me envie el codigo SOLAMENTE CON LAS ALTERACIONES PERTINENTES A ESO Y NINGUNA MÁS!
todavia el la opcion de escribir una nueva categoria no me deja escribirla de hecho, hay que corregirlo
hacer la caja lateral de "categorias" flote debajo de la caja de "controles" cuando la pantalla se mueva para bajo

-> para editar esta bien con abrir ese pequeño pop up, pero quiero poder digitar la nueva categoria directamente donde esta el menu desplegable

-> Correçãos: Após inserir uma tarefa inteligente, não mudar de volta sozinho para a aba de tarefas manuais.

Criar o sistema de abas: Pedi para estruturar duas abas no meu projeto: a primeira abrindo automaticamente com as tarefas manuais já existentes, e a segunda sendo uma cópia visual da primeira, mas com um comportamento diferente — ao digitar uma frase informal nela, um assistente (com as regras que eu defini no system prompt) converte o texto automaticamente num objeto JSON estruturado com tarefa, data, prioridade e categoria.
Passar o projeto do GitHub para o Cursor: Queria trazer o meu repositório já existente no GitHub para dentro do Cursor no meu computador, sem perder o histórico de commits nem precisar reconfigurar o projeto do zero.
Usar a tarefa do Composer de forma produtiva: Tinha uma tarefa pendente sobre o Composer do Cursor, que serve para editar vários ficheiros ao mesmo tempo com uma só instrução. Quis entender como tirar o máximo proveito dessa funcionalidade no meu fluxo de trabalho diário.
Correções pontuais sem mexer no resto: Pedi que me enviassem apenas o código das alterações necessárias, sem tocar em nada que já funcionava. Os dois problemas eram: o campo de nova categoria não deixava escrever de facto, e a caixa lateral de categorias precisava de flutuar por baixo da caixa de controles quando a página fosse rolada para baixo.
Digitar a categoria diretamente no lugar do dropdown: Em vez de abrir um pop-up separado para editar o nome de uma categoria, quis que o próprio campo select fosse substituído por um input de texto diretamente no lugar, para a edição acontecer de forma inline sem interromper o fluxo visual.
Não mudar de aba automaticamente após inserir tarefa inteligente: Depois de processar uma frase na aba inteligente e criar a tarefa, o sistema estava a redirecionar automaticamente para a aba manual. Pedi para remover esse comportamento e deixar o utilizador na aba inteligente para poder continuar a adicionar mais tarefas sem precisar voltar manualmente.
Fechar edições com a tecla Escape: Quis adicionar um atalho de teclado global: ao pressionar Escape, qualquer campo de edição ativo (como editar o nome de uma tarefa ou categoria) seria cancelado e fechado imediatamente, sem precisar clicar fora ou procurar um botão de fechar.
