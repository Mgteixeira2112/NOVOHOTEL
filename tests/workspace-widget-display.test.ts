import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const types = readFileSync('src/workspace-engine/types.ts', 'utf8');
const runtime = readFileSync('src/workspace-engine/WidgetDrivenWorkspace.tsx', 'utf8');
const editor = readFileSync('src/components/admin/WorkspaceEditorModule.tsx', 'utf8');

test('contrato de largura preserva tamanhos existentes e adiciona modo botão', () => {
  assert.match(types, /WorkspaceWidgetSpan = 1 \| 2 \| 3 \| 4 \| 'full' \| 'button'/);
  assert.match(editor, /Pequena/);
  assert.match(editor, /Média/);
  assert.match(editor, /Grande/);
  assert.match(editor, /Extra grande/);
  assert.match(editor, /Largura total/);
  assert.match(editor, /Botão \/ popup/);
});

test('modo botão preserva o span e aceita override mobile sem montar renderer inline', () => {
  assert.match(runtime, /const mobileDisplay = widget\.presentation\?\.mobile\?\.display/);
  assert.match(runtime, /widget\.span === 'button'/);
  assert.match(runtime, /viewport === 'mobile' && mobileDisplay === 'button'/);
  assert.match(runtime, /setOpenWidgetId\(widget\.id\)/);
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
});
