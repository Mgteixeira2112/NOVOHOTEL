# HOTEL OS — Status de Execução

## Concluído nesta linha de desenvolvimento

- Branch isolada para o plano mestre.
- Fundação multi-hotel/organização adicionada.
- Estrutura de camas por quarto adicionada.
- Índices de hotel/reserva/quarto adicionados.
- Modelo inicial de PDV criado.
- Modelo inicial de tablet/dispositivo/sessão criado.
- Busca de disponibilidade por período, capacidade e tipo de cama criada.
- Critérios de Go-Live documentados.

## Em andamento / obrigatório antes do Go-Live

- Migração completa para Supabase Auth.
- RBAC server-side.
- RLS definitivo por organização/hotel.
- Migração segura dos usuários existentes.
- Remoção das políticas permissivas legadas após validação.
- Integração das telas existentes com os novos modelos.
- Transação/concorrência para confirmação de reservas.
- Fluxo operacional completo do PDV.
- Fluxo do tablet do quarto.
- Cozinha/KDS integrado.
- Estoque e financeiro integrados ao PDV.
- Realtime e notificações.
- Testes automatizados e E2E.
- Build/typecheck e homologação.

## Regra

Não marcar a fase como concluída somente porque a tabela ou tela existe. A fase exige integração funcional, segurança e teste.
