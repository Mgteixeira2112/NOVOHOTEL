import fs from 'node:fs';
import path from 'node:path';

describe('Workspace single visual runtime', () => {
  const runtimeEntry = fs.readFileSync(path.join(process.cwd(), 'src/workspace-engine/WorkspaceRuntime.tsx'), 'utf8');
  const visualRuntime = fs.readFileSync(path.join(process.cwd(), 'src/workspace-engine/VisualWorkspaceRuntime.tsx'), 'utf8');

  it('does not route real Workspaces through WidgetDrivenWorkspace anymore', () => {
    expect(runtimeEntry).toContain('<VisualWorkspaceRuntime definition={definition} />');
    expect(runtimeEntry).not.toContain('WidgetDrivenWorkspace');
    expect(runtimeEntry).not.toContain('hasVisualWorkspaceRuntime');
  });

  it('keeps explicit presets for management and official operational sectors', () => {
    expect(visualRuntime).toContain("definition.layout === 'management'");
    expect(visualRuntime).toContain("definition.sectors.includes('recepcao')");
    expect(visualRuntime).toContain("definition.sectors.includes('governanca')");
    expect(visualRuntime).toContain("definition.sectors.includes('manutencao')");
    expect(visualRuntime).toContain("definition.sectors.includes('cozinha')");
    expect(visualRuntime).toContain('createOperationsVisualPresentation(definition.widgets)');
  });

  it('keeps the runtime presentation-only', () => {
    expect(visualRuntime).not.toMatch(/supabase|\.from\(|\.rpc\(|fetch\(|axios|insert\(|mutation/i);
  });
});
