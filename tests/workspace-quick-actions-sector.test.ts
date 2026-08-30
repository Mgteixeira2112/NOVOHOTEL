import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const widget = readFileSync('src/workspace-engine/widgets/QuickActionsWidget.tsx', 'utf8');
const registry = readFileSync('src/workspace-engine/registerBuiltinWidgets.ts', 'utf8');

test('ações rápidas são explicitamente vinculadas aos cinco setores operacionais', () => {
  for (const sector of ['operacao', 'recepcao', 'governanca', 'manutencao', 'cozinha']) {
    assert.match(widget, new RegExp(`${sector}: \\[`));
  }
  assert.match(widget, /const sectors = workspace\.sectors\.length \? workspace\.sectors : \['operacao'\]/);
});

test('ações rápidas só exibem widgets existentes, habilitados e visíveis', () => {
  assert.match(widget, /workspace\.widgets\.find/);
  assert.match(widget, /candidate\.enabled !== false/);
  assert.match(widget, /candidate\.permissions\?\.view !== false/);
  assert.match(widget, /widget\.actions\?\.\[action\.type\] === false/);
});

test('ações rápidas não cria fluxo paralelo e apenas abre ou localiza widget existente', () => {
  assert.match(widget, /button\[aria-haspopup="dialog"\]/);
  assert.match(widget, /dialogButton\.click\(\)/);
  assert.match(widget, /scrollIntoView/);
  assert.doesNotMatch(widget, /receptionStayService|financialEngine|frigobarCore|supabase\./);
});

test('pedidos planejados não são expostos como ação rápida funcional', () => {
  assert.doesNotMatch(widget, /type: 'orders'/);
  assert.match(widget, /catalog\?\.readiness === 'planned'/);
});

test('renderer de ações rápidas está registrado no runtime', () => {
  assert.match(registry, /registerWorkspaceWidgetRenderer\('quick-actions', QuickActionsWidget\)/);
});
