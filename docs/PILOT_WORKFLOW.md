# Ciclo do piloto

## Ambientes

- Desenvolvimento: maquina do time, dados sinteticos.
- Staging: copia da infraestrutura com dados sinteticos, usada para aceite.
- Producao: somente dados autorizados; acesso minimo necessario.

Staging e producao devem usar bancos, buckets, segredos e chaves OpenAI separados.

## Do feedback ao deploy

1. O profissional usa o botão `Enviar feedback` na própria tela, sem nomes, telefones, diagnósticos ou dados pessoais.
2. O time classifica: incidente, defeito, melhoria ou duvida.
3. Incidentes de seguranca interrompem o fluxo normal.
4. A alteracao e implementada em branch curta com issue vinculada.
5. A pull request recebe teste automatizado e revisao.
6. A versao e validada em staging pelo responsavel funcional.
7. O merge em `main` publica automaticamente apos aprovacao do environment.
8. O time acompanha erros e indicadores por pelo menos 30 minutos.

## Cadencia

- Correcao critica: imediatamente, com rollback pronto.
- Correcao comum: janela curta combinada com o piloto.
- Melhoria: lote semanal com aceite em staging.
- Mudanca de modelo de dados: sempre com plano de compatibilidade e restauracao.

## Criterios de aceite

- Nao amplia acesso a dados sem permissao explicita.
- Possui teste para a regressao corrigida.
- Migra sem indisponibilidade destrutiva.
- Logs nao contem dados pessoais.
- Tem caminho de rollback.
- Documentacao do usuario foi atualizada quando necessario.

## Piloto gratuito

Para a apresentação externa temporária, use o Blueprint `render.pilot-free.yaml` e siga `docs/DEPLOY_PILOT_FREE.md`. Esse modo reúne frontend e API em um único serviço, utiliza somente dados sintéticos e substitui a geração externa de IA por um relatório demonstrativo identificado.
