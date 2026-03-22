# Ferramentas e Tecnologias do Backend TaskFlow

## Axios
Biblioteca HTTP para JavaScript (browser e Node.js). Alternativa ao `fetch` nativo com vantagens: interceptores de requisições/respostas, cancelamento automático, transformação automática de JSON e melhor tratamento de erros (lança exceções para status 4xx/5xx automaticamente, ao contrário do fetch).

**Quando usar:** projetos maiores onde precisas de interceptores globais, por exemplo, para adicionar automaticamente um token de autenticação a TODAS as requisições.

## Postman / Thunder Client
Ferramentas de cliente HTTP para testar APIs REST sem precisar de código. Permitem:
- Enviar GET, POST, PUT, DELETE com headers e body personalizados
- Criar coleções organizadas de requests
- Documentar a API com exemplos de request/response
- Automatizar testes (verificar se a resposta tem status 201, etc.)

**Thunder Client** é uma extensão do VS Code — mais conveniente para desenvolvimento.
**Postman** é uma aplicação standalone mais completa para equipas.

## Sentry
Plataforma de monitorização de erros em produção. Captura automaticamente exceções não tratadas, regista o stack trace, contexto do utilizador e dados da requisição.

**Por que se usa:** Em produção, `console.error()` só aparece nos logs do servidor.  O Sentry envia alertas em tempo real (email, Slack) quando algo falha, com toda a  informação necessária para reproduzir e corrigir o bug.

## Swagger (OpenAPI)
Ferramenta de documentação interativa para APIs REST. Gera automaticamente uma página web onde qualquer developer pode ver todos os endpoints, os parâmetros esperados, os códigos de resposta possíveis — e testar a API diretamente no browser.

**Por que se usa:** Uma API sem documentação é inutilizável por outros developers (ou por ti mesmo daqui a 3 meses). O Swagger é o padrão da indústria.

