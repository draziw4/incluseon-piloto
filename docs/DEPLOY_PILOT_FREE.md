# Piloto gratuito para validação profissional

Este ambiente serve exclusivamente para apresentação, teste funcional e coleta de feedback. Ele não é produção e não deve receber dados pessoais, clínicos ou educacionais reais.

## Arquitetura gratuita

- Um Render Web Service gratuito executa o frontend React e a API FastAPI na mesma origem.
- Um Render Postgres gratuito armazena somente dados sintéticos e feedbacks.
- Um Render Key Value gratuito mantém rate limit e rotação de sessão.
- O worker Celery, o MinIO e a OpenAI ficam desativados no piloto.
- Relatórios demonstrativos são gerados localmente, sem envio de dados a IA externa.
- O PDF é regenerado a partir do conteúdo salvo no banco, portanto não depende do filesystem efêmero.

O Blueprint está em `render.pilot-free.yaml` e usa `infra/render/pilot/Dockerfile`.

## Limitações esperadas

- O serviço pode adormecer após 15 minutos sem acesso e levar aproximadamente um minuto para despertar.
- O banco gratuito do Render expira após 30 dias e não possui backup.
- O Key Value gratuito pode perder dados em reinicializações.
- A plataforma pode suspender os serviços se os limites mensais gratuitos forem excedidos.
- O ambiente fica nos Estados Unidos; por isso, somente dados sintéticos são permitidos.

## Credenciais

O deploy exige cinco variáveis não versionadas:

- `PILOT_ADMIN_EMAIL`
- `PILOT_ADMIN_PASSWORD`, com no mínimo 12 caracteres
- `PILOT_PROFESSIONAL_NAME`
- `PILOT_PROFESSIONAL_EMAIL`
- `PILOT_PROFESSIONAL_PASSWORD`, com no mínimo 12 caracteres

O script `backend/script/seed_pilot.py` é idempotente. A cada inicialização, garante os dois usuários, restaura as senhas definidas no ambiente e mantém um cenário sintético mínimo para teste.

Nunca envie essas credenciais para issues públicas nem as grave no repositório.

## Fluxo do avaliador

1. Entrar com o usuário profissional fornecido.
2. Navegar pelos módulos usando somente o `Aluno Demonstração 01`.
3. Clicar em `Enviar feedback` na tela em que encontrou o problema ou melhoria.
4. Informar tipo, resumo, relato e resultado esperado sem dados pessoais.
5. Acompanhar o retorno em `Feedback do piloto`.
6. Quando o item estiver `Aguardando validação`, testar novamente e confirmar o aceite.

## Fluxo do administrador

1. Entrar com a conta administrativa.
2. Abrir `Feedback do piloto`.
3. Classificar cada item como recebido, em análise, implementado, aguardando validação ou aprovado.
4. Registrar uma resposta curta para o avaliador.
5. Implementar alterações em branch curta e repetir a validação antes de publicar.

## Checklist após o deploy

1. `GET /api/ready` retorna `{"status":"ready"}`.
2. O frontend abre em `/` e redireciona para `/login` sem sessão.
3. O login profissional mostra o aviso de ambiente de validação.
4. Existe somente o aluno sintético esperado.
5. O feedback pode ser criado, listado e respondido pelo administrador.
6. O relatório demonstra claramente `sem IA externa`.
7. O PDF começa com a assinatura `%PDF` e abre corretamente.
8. A criação pública em `POST /api/users` continua protegida.

## Encerramento do piloto

Antes dos 30 dias, exporte apenas os feedbacks que não contenham dados pessoais. Depois, exclua o Blueprint e confirme a remoção do banco e do Key Value no painel do Render.
