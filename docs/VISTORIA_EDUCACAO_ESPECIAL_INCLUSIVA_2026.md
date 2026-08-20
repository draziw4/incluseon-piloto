# Vistoria de adequação à Educação Especial Inclusiva

Data da vistoria: 20 de agosto de 2026.

## 1. Conclusão executiva

O IncluseON já possui uma base coerente com a atuação colaborativa: perfis distintos, vínculo por estudante, instrumentos de estudo de caso, relatórios separados de AEE e PA, parecer do AEE, histórico profissional e orientações internas. A adequação, porém, ainda é parcial.

As maiores lacunas são:

1. o módulo chamado “PAEE e Metas” ainda é uma lista de metas, não o documento individualizado e continuamente atualizado exigido para PAEE/PEI;
2. não existe PEI colaborativo nem perfil específico do professor da sala comum;
3. vínculos com `can_view=false` ainda podem expor nomes e contagens em duas consultas agregadas;
4. o PA consegue preencher “hipótese funcional” em observação comportamental, embora sua atribuição principal seja o registro objetivo e a atuação conforme PAEE/PEI;
5. não existe parecer/autorização pedagógica para dispositivo digital portátil usado como tecnologia assistiva;
6. participação do estudante e da família, base legal, retenção e rastreabilidade de acesso ainda estão mais documentadas como intenção do que implementadas como fluxo verificável.

Esta vistoria técnica não substitui validação pedagógica da rede nem parecer jurídico/LGPD.

## 2. Referências usadas

- Conteúdo do guia profissional já incorporado ao sistema, declarado na própria tela como baseado no Documento Orientador de Educação Especial Inclusiva de 2026.
- [Decreto nº 12.686/2025, texto consolidado](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/decreto/d12686.htm), com alterações do Decreto nº 12.773/2025.
- [Decreto nº 12.773/2025](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/decreto/d12773.htm).
- [Lei Brasileira de Inclusão, Lei nº 13.146/2015](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13146.htm).
- [Normativos do MEC sobre Educação Especial](https://www.gov.br/mec/pt-br/cne/normas-classificadas-por-assunto/normativos-sobre-educacao-especial), incluindo a Resolução CNE/CEB nº 4/2009.
- [Enunciado da ANPD sobre dados de crianças e adolescentes](https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-divulga-enunciado-sobre-o-tratamento-de-dados-pessoais-de-criancas-e-adolescentes).

Não foram encontrados, no diretório do projeto, os arquivos originais dos documentos enviados; a análise documental local considerou o conteúdo já transposto para a tela de orientações e os documentos técnicos do repositório.

## 3. Adequações já presentes

### Perfis e limites de atuação

- PA não recebe acesso global a avaliações, PAEE/metas, IA ou gestão da equipe.
- AEE pode avaliar relatórios do PA, mas não recebe permissão de registrar observação ABA.
- Permissões por estudante complementam, sem ampliar, os limites globais do perfil.
- O diagnóstico é opcional no cadastro.
- A oferta de acompanhamento pode ser organizada por barreiras, autonomia, comunicação, estratégias e recursos, não apenas por diagnóstico.

### Estudo de caso e acompanhamento

- Há entrevista com família, entrevista com escola e instrumento do estudante.
- Os instrumentos cobrem barreiras pedagógicas, comunicacionais, atitudinais, físicas e sensoriais, potencialidades, estratégias já testadas e recursos necessários.
- Relatórios do PA são diários e separados dos relatórios pedagógicos do AEE.
- O AEE pode aprovar, registrar observação ou solicitar ajuste no relatório do PA.
- A edição feita pelo PA depois de um parecer retorna o relatório ao estado pendente.

### Segurança e privacidade

- Sessão em cookie protegido, controle por perfil e vínculo, armazenamento privado de PDF e histórico de versões de estudo gerado por IA.
- Logs HTTP não registram o corpo clínico/pedagógico.
- As novas notificações evitam mostrar diagnóstico ou o conteúdo completo do parecer no cabeçalho global.

## 4. Melhorias prioritárias

### P0 — corrigir antes de usar dados reais em escala

#### 4.1 Fechar exposição em consultas de alunos e painel

As consultas de listagem de alunos e de IDs visíveis do painel consideram a existência do vínculo, mas não exigem `StudentProfessional.can_view == true`. Assim, um vínculo mantido com visualização revogada pode continuar expondo nome do estudante, contagens ou lembretes, embora a abertura do perfil seja bloqueada.

Adequação proposta:

- centralizar uma única consulta de escopo visível;
- exigir `can_view=true` em listagem, dashboard, analytics, agenda e qualquer agregado;
- criar teste de regressão para vínculo ativo, vínculo revogado, responsável principal e administrador.

#### 4.2 Transformar “PAEE e Metas” em documento PAEE/PEI versionado

O Decreto nº 12.686/2025, com redação do Decreto nº 12.773/2025, estabelece documento pedagógico individualizado, de atualização contínua, derivado do estudo de caso. O sistema atual persiste metas isoladas com título, área, prazo, progresso e evidência. Isso não representa sozinho o PAEE nem o PEI.

O documento deve registrar, no mínimo:

- estudo de caso de origem e versão considerada;
- barreiras, potencialidades e demandas de apoio;
- objetivos do AEE e da sala comum;
- recursos de acessibilidade, tecnologia assistiva e adaptações razoáveis;
- organização, frequência e duração do AEE;
- estratégias para sala comum, AEE, PA e atividades colaborativas;
- responsáveis, prazos, critérios de acompanhamento e datas de reavaliação;
- participação do estudante e da família;
- versões, autores, aprovações/cientes e justificativas de alteração;
- relação explícita entre PAEE e PEI, respeitando o instrumento equivalente adotado pela rede.

#### 4.3 Governança do envio de dados sensíveis à IA

O estudo de caso pode reunir saúde, medicação, família, comportamento e dados educacionais de criança ou adolescente antes do envio ao provedor de IA. A revisão humana e o histórico já existem, mas isso não resolve finalidade, necessidade e transparência do tratamento.

Antes de dados reais:

- documentar controlador, operador, finalidade e hipótese legal por categoria de dado;
- concluir RIPD/avaliação de impacto e teste de necessidade/minimização;
- validar contrato e retenção do provedor de IA;
- oferecer informação clara sobre quais dados serão enviados;
- permitir excluir campos não necessários antes da geração;
- manter IA desativada quando a governança ou o contrato da rede não autorizarem o uso;
- registrar provedor, modelo, finalidade, versão do contexto e decisão de revisão humana, sem gravar o prompt sensível em logs operacionais.

### P1 — adequação funcional necessária

#### 4.4 Criar PEI colaborativo e perfis escolares específicos

O perfil genérico “equipe escolar” é essencialmente de consulta. Não há perfil distinto para professor da sala comum ou coordenação, nem fluxo de autoria colaborativa do PEI. O decreto determina que PAEE/PEI orientem sala comum, AEE, colaboração escolar e articulação intersetorial.

Criar:

- perfis de professor da sala comum e coordenação pedagógica;
- permissões separadas para propor, comentar, pactuar e revisar PEI;
- responsabilidade final claramente definida conforme a rede;
- notificações de pendência, devolutiva e nova versão.

#### 4.5 Restringir “hipótese funcional” no registro do PA

O PA pode atualmente preencher o mesmo formulário de observação comportamental com hipótese funcional. Isso pode confundir registro objetivo com análise especializada.

Adequação proposta:

- PA registra antecedente/contexto, fato observável, resposta da equipe, apoio utilizado e resultado;
- hipótese funcional fica restrita a profissional habilitado definido pela rede e deve ser apresentada como hipótese educacional revisável, nunca diagnóstico;
- substituir linguagem de “gatilho” e categorias fechadas por descrições observáveis e campo de barreiras/contexto;
- manter o relatório diário do PA como instrumento principal de comunicação ao AEE.

#### 4.6 Implementar participação verificável do estudante e da família

Há campos de entrevista, mas não há registro de convite, participação, contribuição, ciência, discordância ou formato acessível usado com estudante/família. O estudo de caso deve garantir esse envolvimento.

Adicionar eventos de participação, contribuição em linguagem acessível, registro de ciência sem transformar ciência em consentimento obrigatório quando outra hipótese legal for aplicável, e justificativa quando a participação não ocorrer.

#### 4.7 Parecer para tecnologia assistiva digital

O art. 12, § 4º, do Decreto nº 12.686/2025 prevê parecer pedagógico que autorize dispositivo digital portátil como tecnologia assistiva para aprendizagem, comunicação ou socialização. Não existe esse artefato no sistema.

Criar solicitação e parecer contendo dispositivo/recurso, finalidade pedagógica, contexto de uso, salvaguardas, vigência, responsáveis e revisão. O AEE e a equipe pedagógica devem receber notificações conforme o fluxo da rede; o PA deve receber a orientação aprovada aplicável ao estudante.

#### 4.8 Vincular a atuação do PA ao PAEE e ao PEI vigentes

Hoje o vínculo do PA concede acesso, mas não obriga leitura/ciente das orientações vigentes. O decreto determina atuação em consonância com PAEE e PEI.

Adicionar:

- cartão “orientações vigentes para o PA” com versão e data;
- ciência de nova versão;
- aviso de orientação alterada;
- acesso somente ao mínimo necessário para sua atuação;
- histórico que preserve qual versão orientava cada relatório diário.

#### 4.9 Estruturar validação de formação profissional

O cadastro guarda apenas uma referência textual de matrícula/registro. O texto federal consolidado passou a prever formação inicial e continuada para AEE e PA.

Registrar tipo de documento, instituição, carga horária, conclusão, validade quando houver, verificador e data da análise. Os requisitos finais devem ser parametrizáveis por rede, pois atos complementares podem detalhar transição e comprovação.

#### 4.10 Criar trilha de auditoria de domínio

O log HTTP atual registra usuário, rota, status e duração, mas não oferece histórico consultável de quem visualizou/exportou dados nem antes/depois de mudanças críticas.

Registrar eventos de acesso e domínio para: abertura de prontuário educacional, download de PDF, mudança de vínculo/permissão, revisão de PAEE/PEI, parecer, exportação, uso de IA e exclusão. Evitar copiar conteúdo sensível para o log.

### P2 — evolução de qualidade e governança

#### 4.11 Reduzir centralidade do diagnóstico na interface

O cadastro marca o campo apenas como “Diagnóstico”, e o painel usa “Sem diagnóstico” como resumo visual. Embora opcional, essa apresentação reforça o laudo como referência principal.

Preferir “Informação de saúde declarada (opcional e não condicionante)” e destacar no cartão barreiras, formas de comunicação, recursos e apoios vigentes. A oferta de AEE e PA não pode depender de laudo.

#### 4.12 Acessibilidade digital verificável

Há rótulos, estados de foco e controles semânticos em várias telas, mas não existe suíte automatizada de acessibilidade nem evidência de testes com teclado, leitor de tela, zoom ou usuários com deficiência.

Adicionar testes com axe, navegação completa por teclado, foco preso e restaurado em modais, link “pular para conteúdo”, mensagens anunciadas por `aria-live`, contraste documentado, zoom a 200/400% e revisão de gráficos com alternativa textual.

#### 4.13 Ciclo de vida e direitos dos titulares

Prazos de retenção estão sugeridos na documentação, mas não automatizados. Também não há fluxo de acesso, correção, exportação, restrição e eliminação com avaliação de obrigação legal e preservação de histórico.

Criar política parametrizável, filas de revisão/expurgo, legal hold, exportação segura e protocolo de atendimento ao titular/responsável. Para crianças e adolescentes, registrar avaliação do melhor interesse em cada finalidade relevante.

#### 4.14 Evoluir a central de notificações

A entrega atual é interna e consultada a cada 30 segundos. Próximas etapas possíveis:

- preferências por categoria e resumo diário;
- e-mail sem conteúdo sensível para pendências urgentes;
- escalonamento por prazo e substituto responsável;
- expiração/arquivamento conforme retenção;
- página completa com filtros e histórico;
- WebSocket ou Server-Sent Events quando houver necessidade real de tempo quase instantâneo.

## 5. Ordem recomendada de implementação

1. Fechar `can_view` em todas as consultas e adicionar testes de isolamento.
2. Modelar PAEE/PEI versionado e participação de estudante/família.
3. Criar perfil de sala comum/coordenação e fluxo colaborativo.
4. Vincular PA às orientações vigentes e restringir hipótese funcional.
5. Implementar parecer de tecnologia assistiva e notificações de autorização.
6. Completar governança de IA/LGPD antes de dados reais.
7. Adicionar auditoria de domínio, retenção e direitos dos titulares.
8. Executar auditoria formal de acessibilidade com usuários e tecnologia assistiva.

## 6. Critérios de aceite para a próxima fase

- Nenhum usuário com `can_view=false` recebe nomes, contagens ou eventos do estudante.
- Todo PAEE/PEI aponta para um estudo de caso e mantém versões anteriores.
- A versão vigente mostra responsáveis, estratégias, recursos, critérios e reavaliação.
- Estudante e família têm contribuição e ciência registráveis em formato acessível.
- O PA visualiza apenas orientações necessárias e não emite hipótese funcional especializada.
- Autorizações e pareceres têm solicitante, responsável, decisão, justificativa, vigência e trilha de auditoria.
- Toda pendência gera notificação ao perfil responsável, sem conteúdo sensível no cabeçalho.
- Uso de IA fica bloqueável por organização e possui revisão humana registrada.
- Fluxos principais passam em testes de teclado, leitor de tela e contraste.
