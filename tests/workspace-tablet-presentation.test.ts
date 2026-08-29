import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { getWorkspaceDeviceMode, resolveWidgetPresentation } from '../src/workspace-engine/presentation';
import { WorkspaceDefinition } from '../src/workspace-engine/types';

const preview = readFileSync('src/components/admin/WorkspacePreviewPanel.tsx', 'utf8');
const generalControls = readFileSync('src/components/admin/WorkspaceGeneralPresentationControls.tsx', 'utf8');

const definition: WorkspaceDefinition = {
  id: 'tablet-contract',
  name: 'Tablet contract',
  description: '',
  sectors: ['operacao'],
  layout: 'operational',
  defaultScope: 'sector',
  presentation: { devices: { desktop: 'custom', tablet: 'auto' } },
  widgets: [{
    id: 'metrics',
    type: 'metrics',
    order: 10,
    presentation: {
      width: 'full',
      desktop: { mode: 'custom', width: 'medium', order: 20 },
    },
  }],
};

test('Tablet faz parte do contrato oficial e herda a apresentação Desktop em Automático', () => {
  assert.equal(getWorkspaceDeviceMode(definition, 'tablet'), 'auto');
  assert.deepEqual(resolveWidgetPresentation(definition, definition.widgets[0], 'tablet'), resolveWidgetPresentation(definition, definition.widgets[0], 'desktop'));
});

test('preview oferece Desktop, Tablet, Celular e KDS sem criar runtime paralelo para Tablet', () => {
  assert.match(preview, /id: 'tablet', label: 'Tablet'/);
  assert.match(preview, /max-w-\[1024px\]/);
  assert.match(preview, /viewport === 'tablet' \? 'desktop' : viewport/);
});

test('Fábrica expõe Tablet como quarta apresentação e explicita a herança de Desktop', () => {
  assert.match(generalControls, /getWorkspaceDeviceMode\(definition, 'tablet'\)/);
  assert.match(generalControls, />Tablet<select/);
  assert.match(generalControls, /Herdar Desktop/);
  assert.match(generalControls, /xl:grid-cols-4/);
});
