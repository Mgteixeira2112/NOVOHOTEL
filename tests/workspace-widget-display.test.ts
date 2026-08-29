import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const types = readFileSync('src/workspace-engine/types.ts', 'utf8');
const runtime = readFileSync('src/workspace-engine/WidgetDrivenWorkspace.tsx', 'utf8');
const presentation = readFileSync('src/workspace-engine/presentation.ts', 'utf8');
const controls = readFileSync('src/components/admin/WorkspaceWidgetPresentationControls.tsx', 'utf8');

test('largura e modo de exibição são contratos independentes e span fica apenas como legado', () => {
  assert.match(types, /WorkspaceWidgetDisplay = 'panel' \| 'button'/);
  assert.match(types, /WorkspaceWidgetWidth = 'small' \| 'medium' \| 'large' \| 'full'/);
  assert.match(types, /Legacy layout contract kept only for persisted definitions/);
  assert.match(types, /WorkspaceWidgetSpan = 1 \| 2 \| 3 \| 4 \| 'full' \| 'button'/);
  assert.match(controls, /EXIBIÇÃO/);
  assert.match(controls, /LARGURA/);
  assert.match(controls, /Pequena/);
  assert.match(controls, /Média/);
  assert.match(controls, /Grande/);
  assert.match(controls, /Total/);
  assert.match(controls, /Botão \/ popup/);
});

test('definições antigas com span button continuam legíveis sem misturar largura e display novos', () => {
  assert.match(presentation, /legacySpan === 'button' \? 'button' : 'panel'/);
  assert.match(presentation, /legacySpanToWidth\(legacySpan\)/);
  assert.match(runtime, /presentation\.display === 'button'/);
  assert.match(runtime, /presentation\.width/);
  assert.match(runtime, /setOpenWidgetId\(widgetId\)/);
  assert.match(runtime, /aria-haspopup="dialog"/);
  assert.match(runtime, /role="dialog"/);
  assert.match(runtime, /aria-modal="true"/);
  assert.match(runtime, /<OpenRenderer workspace=\{definition\} widget=\{openWidget\} \/>/);
});

test('popup é isolado do header e possui formas seguras de fechamento', () => {
  assert.match(runtime, /createPortal\(/);
  assert.match(runtime, /document\.body/);
  assert.match(runtime, /event\.key === 'Escape'/);
  assert.match(runtime, /event\.target === event\.currentTarget/);
  assert.match(runtime, /aria-label="Fechar widget"/);
  assert.match(runtime, /document\.body\.style\.overflow = 'hidden'/);
  assert.match(runtime, /!previewMode/);
});
