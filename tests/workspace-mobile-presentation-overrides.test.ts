import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const controls = readFileSync('src/components/admin/WorkspaceWidgetPresentationControls.tsx', 'utf8');
const presentation = readFileSync('src/workspace-engine/presentation.ts', 'utf8');

test('Mobile mantém estratégia própria sem duplicar o Workspace', () => {
  assert.match(controls, /data-widget-mobile-customization/);
  assert.match(controls, /Painel, resumo ou botão\/popup com ordem e aparência próprias/);
  assert.match(controls, /<option value="summary">Resumo<\/option>/);
  assert.match(controls, /Ordem mobile/);
  assert.match(controls, /Cabeçalho/);
  assert.match(controls, /Ocultar no celular/);
});

test('override Mobile pode voltar a herdar a configuração comum', () => {
  assert.match(controls, /const resetDevice = \(device: 'mobile' \| 'kds'\)/);
  assert.match(controls, /\[device\]: \{ mode: 'auto' \}/);
  assert.match(controls, /data-reset-mobile-presentation/);
  assert.match(controls, /Herdar configuração comum/);
});

test('runtime continua resolvendo Mobile pelo contrato existente', () => {
  assert.match(presentation, /viewport === 'mobile'/);
  assert.match(presentation, /base\.mobile/);
  assert.match(presentation, /override\.display === 'summary'/);
  assert.match(presentation, /width = 'full'/);
  assert.match(presentation, /order = override\.order \?\? order/);
});
