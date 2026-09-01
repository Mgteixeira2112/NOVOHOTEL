# Homologação final — matriz técnica

Esta fase homologa tecnicamente o roteiro fechado. Não adiciona módulos, engines, estados, automações ou fontes de dados.

## Superfícies

| Superfície | Evidência automatizada | Resultado técnico |
| --- | --- | --- |
| Desktop | composição, posições, sidebar e RBAC | Aprovado |
| Notebook | composição Desktop responsiva | Aprovado |
| Tablet | herança e apresentação Tablet | Aprovado |
| Mobile | fluxo vertical, resumos e ações | Aprovado |
| TV/KDS | orientação, densidade, distância, tela cheia e tempo real | Aprovado |

## Perfis

| Perfil | Escopo homologado |
| --- | --- |
| Admin / Gerente | administração e ações gerenciais |
| Recepção | hóspedes, reservas, quartos e operação de estadia |
| Governança | limpeza, vistoria, enxoval e projeção fixa |
| Manutenção | chamados, reparos e projeção fixa |
| Cozinha / PDV | KDS e permissões restritas por função |
| Financeiro | superfície financeira e restrição de acesso |
| Tablet de quarto | isolamento ao quarto vinculado |

## Evidências de saída

- PR #169: `Hotel OS validation #901` e `Preview build #289` verdes no mesmo SHA;
- banco live: 8 quartos, 16 projeções fixas, zero duplicidades, zero projeções órfãs e zero faltantes;
- reservas: zero referências órfãs de quarto ou hóspede e zero check-ins sem quarto;
- Workspaces: 8 documentos, 8 chaves únicas e zero documentos inválidos;
- RLS: zero políticas públicas abertas nas tabelas de usuários e Workspaces.

## Limite operacional registrado

A aprovação acima é técnica e reproduzível em CI e no banco live. A aceitação manual em hardware físico e com credenciais individuais não é simulada: cinco usuários ainda precisam concluir o primeiro login verificado pelo frontend Supabase antes de o gate global `readyForRls` poder ser habilitado. O sistema permanece seguro com o gate fechado; esse marco não deve ser falsificado por alteração direta no banco.
