# Freeze de persistência da Fábrica de Workspaces

Esta baseline certifica somente o caminho persistente já aprovado para a Fábrica de Workspaces, sem criar nova fonte de verdade, schema ou engine.

## Comportamento certificado

- `workspace_engine_configs` no Supabase permanece a única fonte persistente das definições de Workspace.
- O navegador mantém apenas cache efêmero em memória durante a sessão; `localStorage` e `sessionStorage` não persistem definições da Fábrica.
- A hidratação do runtime parte do Supabase e substitui integralmente o snapshot em memória confirmado para o hotel atual.
- Uma alteração salva só entra no cache do runtime e dispara o evento de atualização depois de `upsert` bem-sucedido.
- Reset só remove o snapshot em memória e atualiza o runtime depois de exclusão bem-sucedida no Supabase.
- Nenhuma engine operacional, matriz RBAC, regra financeira ou fonte financeira é alterada por esta etapa.

## Fora de escopo até o encerramento

- novo schema ou migration;
- persistência paralela no navegador;
- nova fonte financeira;
- alterações em reservas, recepção, governança, manutenção, Kanban ou financeiro;
- novos widgets ou funcionalidades visuais;
- refatoração ampla.

Após CI verde e merge, a persistência da Fábrica fica congelada nesta baseline e o roteiro segue somente para testes finais, homologação e encerramento.