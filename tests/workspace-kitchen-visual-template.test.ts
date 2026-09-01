import fs from 'node:fs';
import path from 'node:path';

describe('Kitchen visual Workspace preset', () => {
  const preset = fs.readFileSync(path.join(process.cwd(), 'src/workspace-engine/kitchenVisualTemplate.ts'), 'utf8');
  const runtime = fs.readFileSync(path.join(process.cwd(), 'src/workspace-engine/VisualWorkspaceRuntime.tsx'), 'utf8');

  it('defines exactly the four official visual surfaces', () => {
    expect(preset).toContain("desktop: surface('desktop', widgets)");
    expect(preset).toContain("tablet: surface('tablet', widgets)");
    expect(preset).toContain("mobile: surface('mobile', widgets)");
    expect(preset).toContain("kds: surface('kds', widgets)");
  });

  it('reuses existing kitchen widgets instead of creating business variants', () => {
    expect(preset).toContain("widgetByType(widgets, 'task-kanban')");
    expect(preset).toContain("widgetByType(widgets, 'dashboard')");
    expect(preset).toContain("widgetByType(widgets, 'metrics')");
    expect(preset).toContain("widgetByType(widgets, 'alerts')");
  });

  it('keeps the preset presentation-only', () => {
    expect(preset).not.toMatch(/supabase|\.from\(|\.rpc\(|fetch\(|axios|service/i);
    expect(preset).not.toMatch(/insert\(|update\(|delete\(|mutation/i);
  });

  it('activates kitchen on the shared visual runtime', () => {
    expect(runtime).toContain("createKitchenVisualPresentation");
    expect(runtime).toContain("definition.sectors.includes('cozinha')");
    expect(runtime).toContain('WorkspaceWidgetHost');
  });
});
