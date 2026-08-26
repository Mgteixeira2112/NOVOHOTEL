# Fase 17 — Correções do último ciclo

## Correções verificadas

- Removida a duplicidade de `vite` em `package.json`, que fazia o `bun install --frozen-lockfile` falhar.
- Ajustada a auditoria de produção para reconhecer o diretório de migrations efetivamente utilizado pelo repositório (`supabase-migrations`), mantendo compatibilidade com `supabase/migrations`.
- O `.env.example` permanece sem credenciais reais; utiliza placeholders e continua sendo o único arquivo `.env` explicitamente permitido pelo `.gitignore`.

## Validação

O workflow anterior falhou antes de lint, testes e build, durante `bun install --frozen-lockfile`. Portanto, nenhum resultado desses está sendo considerado aprovado até uma nova execução.

A branch de trabalho continua separada da `main` para permitir homologação antes da publicação.
