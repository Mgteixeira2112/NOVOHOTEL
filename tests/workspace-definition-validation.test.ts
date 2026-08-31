import { describe, expect, it } from 'vitest';
import { createWorkspaceDefinition } from '../src/workspace-engine/workspaceFactory';
import { validateWorkspaceDefinition } from '../src/workspace-engine/workspaceDefinitionValidation';

const reception = () => createWorkspaceDefinition({ id: 'workspace-validation', name: 'Recepção', sector: 'recepcao' });

describe('Workspace definition validation', () => {
  it('accepts an official sector template', () => {
    const result = validateWorkspaceDefinition(reception());
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it('ignores disabled incompatible widgets but blocks active ones', () => {
    const definition = reception();
    definition.widgets.push({ id: 'kitchen-orders', type: 'orders', enabled: false });
    expect(validateWorkspaceDefinition(definition).valid).toBe(true);

    definition.widgets[definition.widgets.length - 1].enabled = true;
    const result = validateWorkspaceDefinition(definition);
    expect(result.valid).toBe(false);
    expect(result.issues.some(issue => issue.code === 'incompatible-widget' && issue.widgetId === 'kitchen-orders')).toBe(true);
  });

  it('blocks duplicate widget ids', () => {
    const definition = reception();
    definition.widgets.push({ ...definition.widgets[0] });
    const result = validateWorkspaceDefinition(definition);
    expect(result.valid).toBe(false);
    expect(result.issues.some(issue => issue.code === 'duplicate-widget-id')).toBe(true);
  });

  it('blocks definitions without an operational sector', () => {
    const definition = reception();
    definition.sectors = [];
    const result = validateWorkspaceDefinition(definition);
    expect(result.valid).toBe(false);
    expect(result.issues.some(issue => issue.code === 'missing-sector')).toBe(true);
  });
});
