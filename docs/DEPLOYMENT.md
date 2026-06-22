# Deploy de producao

## Arquitetura

- Frontend React: S3 privado e CloudFront.
- API FastAPI e worker Celery: ECS Fargate.
- PostgreSQL: RDS com criptografia, backup e recuperacao point-in-time.
- Redis: ElastiCache privado.
- Relatorios: S3 privado, versionado e criptografado.
- E-mail transacional: AWS SES.
- Segredos: Secrets Manager.
- Logs e trilha de acesso: CloudWatch; Sentry e opcional.
- DNS e TLS: Route 53 e ACM.

Todos os recursos ficam em `sa-east-1`, exceto o certificado do CloudFront, que por exigencia da AWS fica em `us-east-1`.

## Pre-requisitos externos

1. Conta AWS com MFA no usuario administrador.
2. Dominio hospedado no Route 53.
3. Identidade/remetente validado no SES e conta SES fora do sandbox para usuarios reais.
4. Backend de estado remoto do Terraform, com S3 versionado, criptografado e lock.
5. OIDC do GitHub cadastrado na conta AWS.
6. E-mail de alertas capaz de confirmar a assinatura SNS.

Nunca use chaves AWS permanentes no GitHub.

## Segredo da aplicacao

Crie um segredo JSON no Secrets Manager:

```json
{
  "SECRET_KEY": "valor-aleatorio-com-no-minimo-32-caracteres",
  "OPENAI_API_KEY": "chave-da-api"
}
```

Gere `SECRET_KEY` com um gerador criptografico. Nao reutilize senhas pessoais.

## Provisionamento

Antes do primeiro `init`, crie uma vez um bucket S3 exclusivo para o estado do Terraform. Ative bloqueio de acesso publico, criptografia e versionamento. Depois:

```bash
cd infra/aws
cp terraform.tfvars.example terraform.tfvars
cp backend.hcl.example backend.hcl
terraform init -backend-config=backend.hcl
terraform fmt -check
terraform validate
terraform plan -out production.tfplan
terraform apply production.tfplan
```

O arquivo `backend.hcl` pode ser versionado apenas se nao contiver identificadores que sua organizacao considere privados. Nunca coloque credenciais nele. O lock usa `use_lockfile = true` no proprio S3; nao crie uma tabela DynamoDB nova para isso.

O primeiro `apply` deixa API e worker com zero tarefas. Isso e intencional: a primeira imagem ainda nao existe no ECR. O primeiro workflow de deploy publica a imagem, executa as migracoes e sobe ambos os servicos.

Depois do `apply`, confirme no e-mail a assinatura do topico SNS. O Terraform tambem cria alertas de indisponibilidade, erros 5xx, CPU/armazenamento do banco e um orcamento mensal com avisos em 80% previsto e 100% realizado.

## Variaveis do GitHub

No environment protegido `production`, cadastre os outputs do Terraform:

- `AWS_REGION`
- `AWS_DEPLOY_ROLE_ARN`
- `ECR_REPOSITORY`
- `ECS_CLUSTER`
- `ECS_API_SERVICE`
- `ECS_WORKER_SERVICE`
- `ECS_API_TASK_FAMILY`
- `ECS_WORKER_TASK_FAMILY`
- `ECS_SUBNETS`
- `ECS_SECURITY_GROUP`
- `FRONTEND_BUCKET`
- `CLOUDFRONT_DISTRIBUTION_ID`
- `FRONTEND_DOMAIN`
- `API_DOMAIN`

Ative revisores obrigatorios no environment `production` e proteja `main`: pull request, CI verde e pelo menos uma aprovacao.

## Fluxo de entrega

1. Pull request executa testes, lint, build, auditoria, migracoes em PostgreSQL real e build dos containers.
2. Merge em `main` inicia `.github/workflows/deploy.yml` somente depois do CI verde.
3. A imagem recebe a tag imutavel do commit.
4. Uma tarefa isolada executa `alembic upgrade head`.
5. API e worker recebem a nova task definition com circuit breaker e rollback automatico.
6. O frontend e sincronizado no S3 e o CloudFront e invalidado.
7. Smoke tests validam API e frontend.

## Rollback

Aplicacao: selecione a task definition anterior no ECS e atualize os dois servicos. Imagens sao imutaveis e as 30 mais recentes ficam no ECR.

Banco: migracoes devem ser retrocompativeis. Nao execute downgrade destrutivo durante incidente. Para perda de dados, restaure o RDS para uma nova instancia por point-in-time recovery, valide e troque a configuracao apenas depois da conferencia.

## Backup e restauracao

- RDS: retencao de sete dias e snapshot final obrigatorio.
- S3 de relatorios: versionamento e retencao de versoes antigas por 90 dias.
- Execute um teste trimestral de restauracao em ambiente isolado.
- Registre tempo de recuperacao, perda maxima de dados e responsavel pela aprovacao.

## Primeiro acesso

Nao execute `seed_demo.py` em producao. Depois do primeiro deploy, execute uma tarefa ECS isolada usando a mesma task definition da API e substitua o comando por:

```bash
python script/create_admin.py --name "Nome do administrador" --email "admin@seu-dominio.com.br"
```

O comando nao recebe nem imprime senha: ele cria uma credencial aleatoria impossivel de conhecer. Em seguida, use `Esqueci minha senha` no login para definir a primeira senha pelo e-mail validado no SES. O comando e idempotente e tambem pode promover uma conta existente.
