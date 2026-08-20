# IncluseON

Plataforma de acompanhamento educacional inclusivo e colaborativo para registro, análise e organização de informações de alunos acompanhados por equipes escolares, profissionais de apoio, AEE e supervisores.

---

## 1. Problema

Em muitas escolas, o acompanhamento de alunos neurodivergentes ou com necessidades educacionais específicas ainda é feito de forma fragmentada.

As informações costumam ficar espalhadas em:

- cadernos;
- planilhas;
- mensagens de WhatsApp;
- relatórios isolados;
- registros feitos por profissionais diferentes sem integração.

Essa fragmentação dificulta:

- o acompanhamento da evolução do aluno;
- a comunicação entre profissionais;
- a tomada de decisão baseada em dados;
- a construção de estratégias pedagógicas individualizadas;
- a continuidade do trabalho entre escola, família e equipe multiprofissional.

---

## 2. Solução

O **IncluseON** é uma solução tecnológica que centraliza o acompanhamento educacional inclusivo do aluno em uma plataforma única.

A aplicação permite que diferentes profissionais registrem, acompanhem e analisem informações importantes do aluno, respeitando permissões específicas por função.

A proposta é oferecer uma ferramenta para apoiar:

- registros comportamentais;
- entrevistas e avaliações;
- acompanhamento da linha do tempo do aluno;
- análise de padrões;
- geração de relatórios com apoio de inteligência artificial;
- gestão de equipe e permissões;
- fortalecimento de práticas pedagógicas inclusivas.

---

## 3. Funcionalidades do MVP

O Produto Mínimo Viável desenvolvido apresenta as seguintes funcionalidades:

### Autenticação

- Login de usuários;
- Proteção de rotas;
- Identificação do usuário autenticado;
- Controle de acesso por token JWT.

### Dashboard

- Tela inicial após login;
- Acesso aos principais módulos do sistema;
- Navegação para alunos, relatórios, equipe e futuras funcionalidades.

### Alunos

- Cadastro de alunos;
- Listagem de alunos;
- Busca de alunos;
- Perfil individual do aluno;
- Visualização de dados escolares, familiares, sensoriais e comunicacionais.

### Registros ABA

- Cadastro de registros comportamentais no modelo ABA;
- Registro de antecedente, comportamento e consequência;
- Registro de intensidade;
- Registro de ambiente;
- Registro de estratégia utilizada;
- Registro de eficácia da estratégia;
- Listagem dos registros do aluno.

### Entrevistas e Avaliações

- Cadastro de entrevistas e avaliações;
- Organização de dados qualitativos do aluno;
- Listagem das avaliações vinculadas ao aluno.

### Timeline

- Linha do tempo integrada com registros ABA e avaliações;
- Organização cronológica dos eventos importantes do aluno;
- Apoio à visualização da evolução do acompanhamento.

### Analytics

- Cálculo de indicadores comportamentais;
- Total de registros ABA;
- Intensidade média;
- Ambiente mais recorrente;
- Estratégia mais eficaz;
- Gráficos de evolução e padrões comportamentais.

### Relatórios com IA

- Geração de estudo de caso com apoio de inteligência artificial;
- Uso dos dados do aluno, registros, avaliações e analytics;
- Histórico de relatórios gerados;
- Controle mensal de uso da IA;
- Geração assíncrona com Celery e Redis.

### Equipe e Permissões

- Vinculação de profissionais ao aluno;
- Definição de permissões por profissional;
- Diferenciação entre profissional de apoio, AEE, supervisor e visualizador;
- Controle de ações como registrar ABA, criar avaliações, gerar relatórios e visualizar relatórios;
- Feedback visual quando o usuário não possui permissão para realizar uma ação.

### Notificações internas

- Central persistente de notificações com contador de itens não lidos;
- Aviso ao profissional quando um aluno é vinculado ou suas permissões mudam;
- Aviso ao AEE quando um relatório diário do PA aguarda avaliação ou é reenviado;
- Devolutiva ao PA quando o AEE aprova o relatório ou solicita ajustes;
- Avisos administrativos para cadastros profissionais aguardando autorização;
- Marcação individual ou coletiva de leitura e atalho para o contexto da ação.

---

## 4. Público-alvo

A solução é voltada para:

- escolas;
- profissionais de Atendimento Educacional Especializado;
- profissionais de apoio escolar;
- alunos neurodivergentes do ensino médio;
- supervisores pedagógicos;
- equipes multiprofissionais;
- projetos educacionais voltados à inclusão.

---

## 5. Tecnologias Utilizadas

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- TanStack React Query
- React Hook Form
- Zod
- Axios
- Lucide React
- Recharts

### Backend

- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic
- Pydantic
- JWT para autenticação
- Celery
- Redis
- OpenAI API
- ReportLab para geração de PDF

### Versionamento

- Git
- GitHub

---

## 6. Arquitetura da Solução

A aplicação está organizada em duas partes principais:

```txt
frontend/
  Aplicação React responsável pela interface do usuário.

backend/
  API FastAPI responsável pelas regras de negócio, autenticação,
  banco de dados, permissões, relatórios e integração com IA.
```

### Fluxo geral

```txt
Usuário
  ↓
Frontend React
  ↓
API FastAPI
  ↓
Banco PostgreSQL
  ↓
Serviços internos
  ↓
Celery + Redis para tarefas assíncronas
  ↓
OpenAI API para geração de relatórios
```

### Estrutura simplificada

```txt
INCLUSEON/
├── backend/
│   ├── routes/
│   ├── schemas/
│   ├── models/
│   ├── services/
│   ├── workers/
│   ├── alembic/
│   ├── requirements.txt
│   ├── .env.example
│   └── main.py
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── features/
│   │   ├── components/
│   │   ├── utils/
│   │   └── App.tsx
│   ├── package.json
│   └── .env.example
│
├── .gitignore
└── README.md
```

---

## 7. Como Executar o Projeto

### Pré-requisitos

Antes de iniciar, é necessário ter instalado:

- Python 3.11 ou superior;
- Node.js;
- PostgreSQL;
- Redis;
- Git.

---

## 7.1. Configuração do Backend

Acesse a pasta do backend:

```bash
cd backend
```

Crie o ambiente virtual:

```bash
python -m venv .venv
```

Ative o ambiente virtual:

No macOS/Linux:

```bash
source .venv/bin/activate
```

No Windows:

```bash
.venv\Scripts\activate
```

Instale as dependências:

```bash
pip install -r requirements.txt
```

Crie um arquivo `.env` com base no arquivo `.env.example`.

Exemplo de `.env` do backend:

```env
DATABASE_URL=postgresql+asyncpg://usuario:senha@localhost:5432/incluseon
SECRET_KEY=sua_chave_secreta
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
OPENAI_API_KEY=sua_chave_openai
```

Execute as migrações do banco de dados:

```bash
alembic upgrade head
```

Inicie a API:

```bash
uvicorn main:app --reload
```

A API ficará disponível em:

```txt
http://127.0.0.1:8000
```

A documentação automática pode ser acessada em:

```txt
http://127.0.0.1:8000/docs
```

---

## 7.2. Configuração do Redis e Celery

O Redis é utilizado como broker para o Celery, responsável por tarefas assíncronas, como a geração de relatórios com IA.

No macOS com Homebrew:

```bash
brew services start redis
```

Depois, em outro terminal, execute o worker do Celery:

```bash
cd backend
source .venv/bin/activate
celery -A workers.celery_app:celery worker --loglevel=info --pool=solo
```

Observação: durante o desenvolvimento local, o parâmetro `--pool=solo` ajuda a evitar conflitos entre Celery, SQLAlchemy assíncrono e asyncpg.

---

## 7.3. Configuração do Frontend

Acesse a pasta do frontend:

```bash
cd frontend
```

Instale as dependências:

```bash
npm install
```

Crie um arquivo `.env` com base no arquivo `.env.example`.

Exemplo de `.env` do frontend:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Inicie a aplicação:

```bash
npm run dev
```

O frontend ficará disponível em:

```txt
http://localhost:5173
```

---

## 8. Arquivos de Configuração Necessários

### Backend

O backend precisa ter um arquivo:

```txt
backend/requirements.txt
```

Exemplo de dependências:

```txt
fastapi
uvicorn[standard]
sqlalchemy
asyncpg
alembic
pydantic
pydantic-settings
email-validator
python-jose[cryptography]
passlib[bcrypt]
bcrypt
python-multipart
python-dotenv
celery
redis
openai
reportlab
```

Também deve existir um arquivo de exemplo:

```txt
backend/.env.example
```

Com o seguinte conteúdo:

```env
DATABASE_URL=postgresql+asyncpg://usuario:senha@localhost:5432/incluseon
SECRET_KEY=sua_chave_secreta
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
OPENAI_API_KEY=sua_chave_openai
```

### Frontend

O frontend deve conter:

```txt
frontend/package.json
```

E um arquivo de exemplo:

```txt
frontend/.env.example
```

Com o seguinte conteúdo:

```env
VITE_API_URL=http://127.0.0.1:8000
```

---

## 9. Cuidados com Segurança

O projeto não deve enviar arquivos sensíveis para o GitHub.

Não devem ser versionados:

- `.env`;
- chaves secretas;
- tokens;
- senhas;
- ambiente virtual `.venv`;
- pasta `node_modules`;
- arquivos gerados automaticamente;
- PDFs gerados em tempo de execução.

Exemplo recomendado de `.gitignore`:

```gitignore
.env
*.env
!.env.example

.venv
__pycache__
*.pyc

node_modules
dist

.DS_Store

generated_reports
```

---

## 10. Demonstração do MVP

Fluxo sugerido para demonstração:

1. Realizar login no sistema;
2. Acessar o dashboard;
3. Abrir o perfil de um aluno;
4. Registrar um comportamento ABA;
5. Criar uma avaliação ou entrevista;
6. Visualizar a timeline do aluno;
7. Visualizar analytics comportamental;
8. Gerar ou visualizar relatório com IA;
9. Acessar a aba de equipe e permissões;
10. Demonstrar diferentes permissões entre profissional de apoio e AEE.

---

## 11. Dados Sugeridos para Demonstração

Para apresentar o MVP, recomenda-se deixar previamente cadastrados:

- 1 usuário administrador;
- 1 usuário psicólogo;
- 1 usuário profissional AEE;
- 1 usuário profissional de apoio;
- 1 aluno fictício;
- 3 registros ABA;
- 1 avaliação ou entrevista;
- 1 relatório IA salvo;
- 1 vínculo de equipe com permissões diferentes.

Exemplo de cenário:

```txt
Aluno: João Silva

Profissional de apoio:
- Pode visualizar aluno;
- Pode registrar ABA;
- Não pode gerar relatório IA.

Profissional AEE:
- Pode visualizar aluno;
- Pode criar avaliação;
- Pode gerar relatório IA;
- Pode visualizar relatórios.
```

---

## 12. Diferencial da Solução

O **IncluseON** se diferencia por unir em um só ambiente:

- registros comportamentais;
- dados educacionais;
- acompanhamento por equipe;
- permissões por profissional;
- analytics;
- relatórios com apoio de IA;
- organização cronológica da evolução do aluno;
- apoio à educação inclusiva baseada em dados.

A proposta não substitui profissionais, mas apoia a organização, análise e tomada de decisão da equipe.

---

## 13. Impacto Esperado

A solução pode contribuir para:

- melhorar a comunicação entre profissionais;
- reduzir perda de informações importantes;
- apoiar decisões pedagógicas individualizadas;
- facilitar a construção de estratégias para alunos neurodivergentes;
- fortalecer a atuação do AEE e da equipe escolar;
- gerar registros mais organizados e acessíveis;
- apoiar práticas de inclusão escolar com maior continuidade.

---

## 14. Próximos Passos

Funcionalidades planejadas para evolução do projeto:

- módulo de atendimentos;
- módulo de PEI;
- exportação avançada de relatórios;
- notificações;
- painel administrativo;
- deploy em nuvem;
- permissões mais granulares;
- anexos e documentos por aluno;
- integração com calendário;
- histórico de evolução por metas.

---

## 15. Equipe

Projeto desenvolvido por estudantes participantes do Hackathon.

### Integrantes

| Integrante | Função no desenvolvimento | Contribuições |
|---|---|---|
| Ana Cecília dos Santos Martins - Gestão do projeto e pesquisa do problema | Organização da proposta, identificação do problema, apoio na escrita do README e estruturação do pitch. |

| Gabriel de Jesus Alves Sousa - Frontend | Desenvolvimento das interfaces em React, estilização com Tailwind CSS e organização das telas do sistema. |

| Gabriel Silva Santos - Backend | Desenvolvimento da API em FastAPI, autenticação, banco de dados, rotas principais e regras de permissão. |

| João Allef Duarte de Vasconcelos - Dados, analytics e IA | Apoio no módulo de analytics, timeline, relatórios com IA e organização das informações do aluno. |

| Marcela Victória da Silva Oliveira - Testes, documentação e GitHub | Testes do fluxo do MVP, revisão da documentação, organização do GitHub e preparação da demonstração. |


## 16. Versionamento

O projeto utiliza Git e GitHub para controle de versão.

Comandos principais utilizados:

```bash
git status
git add .
git commit -m "mensagem do commit"
git push
```

Padrão sugerido de commits:

```txt
feat: nova funcionalidade
fix: correção de erro
docs: alteração de documentação
style: ajuste visual
refactor: melhoria interna no código
```

Exemplos:

```bash
git commit -m "feat: adiciona módulo de registros ABA"
git commit -m "fix: corrige permissões de relatórios IA"
git commit -m "docs: atualiza README do projeto"
```

---

## 17. Status do Projeto

```txt
MVP funcional em desenvolvimento.
```

O sistema apresenta execução mínima demonstrável, com funcionalidades principais implementadas para apresentação no Hackathon.

---

## 18. Licença

Este projeto foi desenvolvido para fins educacionais e de participação em Hackathon.
