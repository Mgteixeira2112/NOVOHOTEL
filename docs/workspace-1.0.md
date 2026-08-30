# Workspace 1.0 — baseline operacional

Esta baseline encerra a primeira fase da Fábrica de Workspaces sem criar motores de negócio paralelos.

## Princípios

- A Fábrica compõe apresentação, permissões e acesso a capacidades existentes.
- Widgets não devem implementar uma segunda versão de regras de check-in, checkout, Kanban, financeiro, frigobar, manutenção ou persistência.
- Trocar o setor de um Workspace aplica o template oficial do setor de destino.
- Alterar o board dentro do mesmo setor preserva a composição personalizada.
- Widgets `planned` não entram em templates nem podem ser adicionados como funcionalidade pronta.

## Templates oficiais

| Setor | Composição inicial |
| --- | --- |
| Operação Geral | Ações rápidas, Resumo, Dashboard, Fluxo operacional, Alertas, Frigobar, Equipe |
| Recepção | Ações rápidas, Resumo, Chegadas, Saídas, Alertas, Mapa de quartos, Kanban, Equipe |
| Governança | Ações rápidas, Resumo, Mapa de quartos, Detalhes do quarto, Tarefas, Frigobar, Alertas, Equipe |
| Manutenção | Ações rápidas, Resumo, Ordens de manutenção, Mapa técnico, Detalhes do quarto, Alertas técnicos, Equipe |
| Cozinha & Room Service | Ações rápidas, Resumo, Fila operacional, Dashboard, Alertas, Equipe |

## Runtime

A baseline possui 17 renderers operacionais registrados. `orders` e `shortcuts` permanecem fora do runtime e são explicitamente `planned`.

### Pedidos

Não existe renderer operacional consolidado no Workspace 1.0. O contrato permanece reservado até que um fluxo de pedidos oficial já existente possa ser conectado sem criar um motor paralelo.

### Atalhos

Não existe contrato de configuração próprio na Fábrica para links arbitrários. O Workspace 1.0 utiliza `quick-actions` para navegação entre widgets existentes e permitidos, evitando duas arquiteturas de atalhos concorrentes.

## Equipe

O widget `team` é somente leitura. Ele usa os usuários ativos do `HotelContext` e os vínculos oficiais de setor fornecidos por `userSectorService`. Não cria persistência, não altera vínculos e não acessa o Supabase diretamente.

## Freeze

Os testes de regressão devem garantir que:

- cada setor tenha um template compatível;
- nenhum template contenha widget `planned`;
- cada template tenha uma instância de Ações rápidas e Equipe;
- widgets baseados em board usem o board oficial do setor;
- Pedidos e Atalhos continuem indisponíveis até uma decisão explícita de evolução;
- a matriz de renderers não cresça sem atualização deliberada desta baseline.
