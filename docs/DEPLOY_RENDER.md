# Deploy temporario sem dominio

Este caminho publica o piloto em `https://incluseon-pilot.onrender.com`. O frontend e o unico servico publico; ele encaminha `/api` para a API na rede privada do Render. PostgreSQL, cache, worker e armazenamento de relatorios nao ficam expostos diretamente.

## Limite de uso

O Render nao oferece regiao no Brasil. Ate a revisao juridica da transferencia internacional e dos contratos com os fornecedores, use somente dados sinteticos ou anonimizados neste ambiente.

## Antes de criar o Blueprint

1. Envie todas as alteracoes para uma branch e abra pull request.
2. Confirme que o CI do GitHub passou.
3. Tenha uma chave OpenAI exclusiva para o piloto.
4. Tenha uma conta SMTP com TLS para recuperacao de senha.
5. Verifique no painel do Render o custo total dos planos antes de confirmar.

## Criacao

1. Acesse `https://dashboard.render.com/blueprints`.
2. Clique em `New Blueprint Instance`.
3. Conecte `IncluseON/incluseon-hackaton-mvp`.
4. Selecione a branch que contem `render.yaml`.
5. Preencha os valores solicitados:
   - `OPENAI_API_KEY` na API e no worker: use a mesma chave.
   - `SMTP_HOST`, `SMTP_USERNAME`, `SMTP_PASSWORD` e `SMTP_FROM_EMAIL`: use os mesmos valores na API e no worker.
6. Revise os cinco servicos e o banco antes de aplicar.

O Blueprint cria:

- `incluseon-pilot`: frontend publico e HTTPS.
- `incluseon-pilot-api`: API privada.
- `incluseon-pilot-worker`: Celery.
- `incluseon-pilot-db`: PostgreSQL privado.
- `incluseon-pilot-cache`: fila e sessoes.
- `incluseon-pilot-minio`: PDFs privados em disco com snapshot.

## Primeiro administrador

No Shell da API, execute:

```bash
python script/create_admin.py --name "Administrador" --email "seu-email@exemplo.com"
```

Depois abra `https://incluseon-pilot.onrender.com/forgot-password` e defina a primeira senha pelo e-mail.

## Aceite

1. `/api/ready` responde `{"status":"ready"}`.
2. Login e logout funcionam e nenhum token aparece no Local Storage.
3. Um aluno sintetico pode ser criado, alterado e excluido.
4. Um relatorio pode ser gerado, baixado e aberto.
5. Reiniciar API e worker nao remove banco nem PDFs.
6. A criacao publica em `POST /api/users` responde `401`.

## Atualizacoes

`autoDeployTrigger: checksPass` faz o Render publicar somente depois que o CI do GitHub passa. Use pull requests, valide a mudanca e faca merge em `main`; nao edite o codigo diretamente no painel do Render.

Quando o dominio estiver disponivel, migre para a infraestrutura AWS em `infra/aws` ou adicione o dominio ao frontend do Render e atualize `CORS_ORIGINS`, `ALLOWED_HOSTS` e `FRONTEND_URL`.
