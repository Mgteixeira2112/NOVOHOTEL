# Freeze de persistência da Fábrica de Workspaces

Esta baseline certifica o caminho de persistência já existente e aprovado para a Fábrica de Workspaces, sem alterar schema, engines operacionais ou fontes de dados.

## Comportamento certificado

- `workspace_engine_configs` no Supabase permanece a persistência remota das definições de Workspace.
- O `localStorage` mantém o snapshot local necessário para leitura síncrona do runtime e continuidade da composição visual entre recargas.
- `PENDING_SYNC_KEY` identifica Workspaces com alteração local ainda não confirmada pelo Supabase.
- Durante a hidratação, uma composição local marcada como pendente prevalece temporariamente sobre a cópia remota conhecida, evitando que um F5 ressuscite widgets removidos antes da confirmação.
- O salvamento normaliza a definição, grava o snapshot local, marca a sincronização como pendente e executa `upsert` em `workspace_engine_configs`.
- A sincronização só é considerada concluída depois de reler a definição no Supabase e confirmar equivalência com `workspaceDefinitionsEqual`; divergência permanece como falha de persistência.
- O reset só remove a configuração local depois de a exclusão no Supabase ser confirmada.
- Nenhuma engine operacional, matriz RBAC, regra financeira ou fonte financeira é alterada por esta certificação.

## Guardrails preservados

- não criar novo schema ou migration;
- não criar uma segunda fonte remota de configuração;
- não alterar reservas, recepção, governança, manutenção, Kanban ou financeiro;
- não introduzir novas fontes financeiras;
- não adicionar widgets ou funcionalidades visuais nesta etapa;
- não ampliar o escopo para refatorações arquiteturais.

Após CI verde e merge, este contrato de persistência fica congelado como baseline para testes finais, homologação e encerramento.