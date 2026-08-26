# FASE 17 — Correções Executadas Após a Publicação

## Objetivo
Registrar somente correções comprovadas durante a estabilização da publicação acumulada. Este documento não considera o sistema pronto para produção.

## Correções executadas

### 1. Vite em ESM
O `vite.config.ts` utilizava `__dirname` diretamente enquanto o projeto declara `type: module`. A configuração foi ajustada para obter o diretório via `fileURLToPath(import.meta.url)`, evitando dependência de variável CommonJS durante o carregamento da configuração.

### 2. Validação CI sem lockfile Bun
O workflow não deve usar `bun install --frozen-lockfile` enquanto não existir um `bun.lock` validado e versionado. O workflow da branch de publicação foi ajustado para instalar dependências com `bun install`.

### 3. Auditoria estática alinhada ao CI
O `phase17-production-audit.mjs` foi ajustado para validar a existência de uma etapa de instalação de dependências, sem exigir artificialmente `--frozen-lockfile` enquanto o lockfile não existe.

### 4. Configuração explícita do Netlify
Foi criado `netlify.toml` definindo:

- build command: `npm install --no-audit --no-fund && npm run build`;
- publish directory: `dist`;
- Node 20;
- comando de desenvolvimento local.

## Estado após as correções

A PR #2 continua aberta, Draft e não mergeável. O último commit da branch é `bba5753101ef1f4981a0aea696ea68ff93345338`.

O Netlify já reportou falha para o commit anterior da configuração explícita (`c5dd31cceb8d8d0bc77b758eb769f19bf5b3216b`). Ainda não há evidência suficiente para afirmar que a causa raiz do deploy foi corrigida.

## Bloqueadores ainda não resolvidos

- diagnóstico do erro real do Netlify;
- autenticação legada/senha local;
- validação definitiva de RLS no ambiente Supabase;
- testes E2E completos;
- testes de concorrência/idempotência;
- backup e restore reais;
- load/stress test;
- homologação em staging;
- validação completa de segurança;
- validação final de permissões multi-hotel.

## Regra

Nenhuma dessas pendências deve ser marcada como concluída sem evidência de execução e resultado verificável.
