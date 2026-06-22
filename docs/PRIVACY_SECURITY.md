# Privacidade, seguranca e LGPD

Este documento e um checklist tecnico-operacional e nao substitui revisao juridica.

## Antes de dados reais

- Identificar controlador, operador, encarregado e canal de contato.
- Documentar finalidade e base legal para cada categoria de dado.
- Assinar termos com escola, profissionais e fornecedores relevantes.
- Publicar politica de privacidade revisada juridicamente.
- Definir prazo de retencao para cadastro, registros, relatorios, logs e backups.
- Definir processo para acesso, correcao, portabilidade e eliminacao.
- Fazer avaliacao de impacto para dados de criancas, saude e apoio educacional.
- Confirmar termos de tratamento de dados com AWS, OpenAI e Sentry, quando usado.
- Proibir dados pessoais em issues, e-mail de suporte e capturas nao protegidas.

## Controles implementados

- Permissoes por vinculo profissional e funcoes administrativas.
- Cookies de sessao `HttpOnly`, `Secure` em producao e `SameSite=Strict`.
- Rotacao de sessao no refresh e invalidacao apos logout ou troca de senha.
- Rate limit de login e respostas genericas na recuperacao de senha.
- PDF privado em S3, criptografado e acessado somente pela API autenticada.
- Logs estruturados sem corpo de requisicao, com usuario, rota e request ID.
- Segredos fora da imagem e do repositorio.
- TLS, CSP, HSTS, limite de requisicao e validacao de host.
- Banco, cache e buckets sem acesso publico.

## Retencao sugerida para validacao juridica

- Logs operacionais e de acesso: 90 dias.
- Tokens de recuperacao expirados: remocao diaria apos sete dias.
- Backups de banco: sete dias no piloto.
- Versoes antigas de relatorios: 90 dias.
- Dados do aluno: conforme contrato, finalidade e obrigacao legal aplicavel.

## Incidentes

1. Conter acesso e preservar evidencias.
2. Revogar sessoes elevando `token_version` dos usuarios afetados.
3. Rotacionar segredos e credenciais comprometidos.
4. Identificar titulares, dados, periodo e impacto.
5. Acionar responsavel juridico/encarregado para avaliar comunicacao a ANPD e titulares.
6. Corrigir, validar, documentar causa raiz e acompanhar recorrencia.

Nunca inclua o conteudo clinico ou educacional do aluno no relatorio tecnico do incidente.
