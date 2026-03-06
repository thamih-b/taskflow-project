Terminator Task Manager

Task management interface with authentic T-800 HUD styling
🚀 Visão Geral

Uma aplicação de gerenciamento de tarefas moderna com interface inspirada no Terminator T-800. Combina funcionalidade intuitiva com estética cyberpunk: HUD verde fosforescente, amarelo do cyberpunk, scans vermelhos, metais cromados e animações de interface futurista.

Status: ✅ Production Ready | Tech Stack: HTML5, CSS3, Vanilla JS
✨ Funcionalidades

    ✅ Adicionar/editar tarefas com prioridade (Alta/Média/Baixa)

    ✅ Marcar tarefas como concluídas

    🔍 Busca em tempo real

    🧭 Filtros por status e prioridade

    📱 Totalmente responsivo (Mobile-first)

    🌙 Dark mode automático (prefers-color-scheme)

    ⚡ Animações HUD suaves e glow effects

    🎨 Tema Terminator cyberpunk completo

🎨 Design System
Cores Principais (Tema Terminator)

Verde HUD:     #00ff41
Amarelo cyber: #e5ff00c7
Vermelho Scan: #ff1744  
Amarelo Alert: #ffaa00
Metal Chrome:  #c0c0c0
Preto Profundo:#0a0a0a

Elementos Visuais

    Cards: Bordas coloridas por prioridade + scan line animado

    Botões: Steampunk metálicos com engrenagens giratórias

    Inputs: Glow verde no focus + scanner effect

📱 Demonstração
Desktop: Layout lateral (Aside + Main)
Mobile:  Stack vertical automático

🚀 Instalação Rápida
# 1. Clone ou baixe os arquivos
git clone [<https://github.com/thamih-b/Organizator>] - Gerenciador de tareas
cd organizator

# 2. Adicione as imagens obrigatórias:
#   - img/sidebarEsq.png (header)
#   - cyberdyne-logo.png (opcional)

# 3. Abra index.html no navegador
# Funciona offline - Zero dependências externas!

📂 Estrutura de Arquivos

terminator-tasks/
├── index.html          # Interface principal
├── style.css           # Tema Terminator completo
├── script.js          # Lógica das tarefas
├── img/
│   ├── sidebarEsq.png      # Header background
│   └── terminator-skull-bg.jpg # Body/aside
└── README.md         # Este arquivo

🎯 Como Usar

    Adicionar Tarefa: Digite e clique no botão "ADD"

    Definir Prioridade: Use o selector (Alta=🔴, Média=🟡, Baixa=🔵)

    Marcar Concluída: Clique no checkbox verde

    Buscar: Digite no campo de busca

    Filtrar: Clique nos botões de filtro

🔧 Personalização

Mudar Imagens
/* No CSS, substitua os paths: */
body { background-image: url('SUA-IMAGEM.jpg'); }
header { background-image: url('SEU-HEADER.png'); }

Ajustar Cores
:root {
  --primary-color: #e5ff00c7;  /* Amarelo Cyber */
  --secondary-color: #ff1744; /* Vermelho scan */
}

📱 Breakpoints Responsivos

| Tela    | Layout     | Componentes              |
| ------- | ---------- | ------------------------ |
| > 768px | Horizontal | Aside + Main lado a lado |
| ≤ 768px | Vertical   | Stack (Main → Aside)     |


🎨 Assets Necessários

Imagens obrigatórias para melhor visual:

    img/sidebarEsq.png - Qualquer tamanho (header)

    cyberdyne-logo.png - Opcional (overlay header)

🛠 Desenvolvimento
# Estrutura recomendada para devs
npm init -y                    # Opcional
npm install --save-dev live-server  # Hot reload
npx live-server                # 🚀 http://localhost:8080

📄 Licença
Proprietário / All Rights Reserved
© 2026 Organizator - Gerenciador de tareas
Todos os direitos reservados. Proibida a reprodução, distribuição, modificação ou uso comercial sem autorização expressa por escrito do autor.
Uso pessoal e educacional permitido apenas para estudo e portfólio individual.

🤝 Contribuições

    Fork o projeto

    Crie uma branch feature/nova-funcionalidade

    Commit suas mudanças

    Push para a branch

    Abra um Pull Request

🐛 Problemas?

    Mobile quebrado? Verifique overflow-x: hidden no html/body

    Cores erradas? Limpe cache do navegador (Ctrl+F5)

    Imagens não carregam? Paths relativos corretos na pasta img/

<div align="center"><br> <strong>I'll be back... with your tasks organized! 💀🤖</strong> </div>
