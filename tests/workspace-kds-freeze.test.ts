import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const runtime = readFileSync('src/workspace-engine/WidgetDrivenWorkspace.tsx', 'utf8');
const presentation = readFileSync('src/workspace-engine/presentation.ts', 'utf8');
const controls = readFileSync('src/components/admin/WorkspaceGeneralPresentationControls.tsx', 'utf8');

const forbiddenParallelSources = [
  /from ['\"]@?\/?[^'\"]*supabase[^'\"]*['\"]/i,
  /from ['\"][^'\"]*\/(repositories|services)\/[^'\"]*['\"]/i,
];

test('KDS/TV mantém somente o comportamento já existente no runtime oficial', () => {
  assert.match(runtime, /requested === 'kds'/);
  assert.match(runtime, /kds\?\.orientation/);
  assert.match(runtime, /kds\?\.density/);
  assert.match(runtime, /kds\?\.viewingDistance/);
  assert.match(runtime, /kds\?\.fullscreen/);
  assert.match(runtime, /kds\?\.realtime/);
  assert.match(runtime, /hideAdministrativeControls/);
  assert.match(runtime, /hideEditingControls/);
  assert.match(runtime, /getWidgetKdsSuitability/);
  assert.match(runtime, /suitability !== 'unsupported'/);
  assert.match(runtime, /kdsSpanClass\(presentation\.width, kdsOrientation\)/);
});

test('KDS/TV continua resolvendo apresentação pelo mesmo contrato responsivo', () => {
  assert.match(runtime, /getWorkspaceDeviceMode\(definition, viewport\)/);
  assert.match(runtime, /resolveWidgetPresentation\(definition, widget, viewport\)/);
  assert.match(presentation, /definition\.presentation\?\.kds\?\.enabled === false/);
  assert.match(presentation, /definition\.presentation\?\.kds\?\.enabled === true/);
  assert.match(presentation, /: base\.kds/);
  assert.match(presentation, /viewport === 'kds' && deviceMode === 'auto' && display === 'button'/);
});

test('Fábrica mantém apenas os controles KDS/TV já existentes', () => {
  assert.match(controls, /Tela KDS \/ TV/);
  assert.match(controls, /Distância de visualização/);
  assert.match(controls, /Ocultar menus administrativos/);
  assert.match(controls, /Ocultar controles de edição/);
});

test('certificação KDS/TV não cria fonte de dados paralela', () => {
  for (const forbidden of forbiddenParallelSources) {
    assert.doesNotMatch(runtime, forbidden);
    assert.doesNotMatch(presentation, forbidden);
  }
});
