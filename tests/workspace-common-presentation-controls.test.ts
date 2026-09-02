import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const controls = readFileSync('src/components/admin/WorkspaceWidgetPresentationControls.tsx', 'utf8');
const presentation = readFileSync('src/workspace-engine/presentation.ts', 'utf8');

test('Fábrica expõe somente a exibição como controle comum visível do widget', () => {
  assert.match(controls, /Configuração comum/);
  assert.match(controls, />EXIBIÇÃO<select/);
  assert.match(controls, /Completo/);
  assert.match(controls, /Resumo/);
  assert.match(controls, /Atalho/);
  assert.match(controls, /Oculto/);
  assert.doesNotMatch(controls, />LARGURA<select/);
  assert.doesNotMatch(controls, />ALTURA<select/);
  assert.doesNotMatch(controls, />VISUAL<select/);
  assert.doesNotMatch(controls, />CABEÇALHO<select/);
});

test('contratos visuais legados continuam disponíveis para compatibilidade interna', () => {
  assert.match(controls, /Pequena/);
  assert.match(controls, /Média/);
  assert.match(controls, /Grande/);
  assert.match(controls, /Total/);
  assert.match(controls, /Automática/);
  assert.match(controls, /Baixa/);
  assert.match(controls, /Alta/);
  assert.match(controls, /Minimalista/);
  assert.match(controls, /Padrão/);
  assert.match(controls, /Destaque/);
  assert.match(controls, /Completo/);
  assert.match(controls, /Compacto/);
  assert.match(controls, /Oculto/);
  assert.match(controls, /Botão \/ popup/);
});

test('normalização preserva defaults e compatibilidade com span legado', () => {
  assert.match(presentation, /legacySpanToWidth/);
  assert.match(presentation, /display: presentation\.display \|\|/);
  assert.match(presentation, /width: presentation\.width \|\| legacySpanToWidth\(legacySpan\)/);
  assert.match(presentation, /height: presentation\.height \|\| 'auto'/);
  assert.match(presentation, /visual: presentation\.visual \|\| 'standard'/);
  assert.match(presentation, /header: presentation\.header \|\| 'full'/);
});
