import fs from 'node:fs';
import path from 'node:path';

describe('Maintenance visual Workspace preset', () => {
  const templatePath = path.join(process.cwd(), 'src/workspace-engine/maintenanceVisualTemplate.ts');
  const runtimePath = path.join(process.cwd(), 'src/workspace-engine/VisualWorkspaceRuntime.tsx');
  const template = fs.readFileSync(templatePath, 'utf8');
  const runtime = fs.readFileSync(runtimePath, 'utf8');

  it('defines all four official device surfaces', () => {
    expect(template).toContain("desktop: surface('desktop'");
    expect(template).toContain("tablet: surface('tablet'");
    expect(template).toContain("mobile: surface('mobile'");
    expect(template).toContain("kds: surface('kds'");
  });

  it('reuses existing operational widgets instead of creating parallel implementations', () => {
    expect(template).toContain("widgetByType(widgets, 'maintenance')");
    expect(template).not.toContain("widgetByType(widgets, 'task-kanban')");
    expect(template).toContain("widgetByType(widgets, 'room-map')");
    expect(template).toContain("widgetByType(widgets, 'room-details')");
    expect(template).toContain("widgetByType(widgets, 'quick-actions')");
    expect(template).toContain("widgetByType(widgets, 'team')");
  });

  it('keeps KDS without the interactive sidebar', () => {
    expect(template).toContain('enabled: !kds');
  });

  it('keeps the preset presentation-only', () => {
    expect(template).not.toMatch(/supabase|\.from\(|\.rpc\(|fetch\(|axios|service/i);
    expect(template).not.toMatch(/insert\(|update\(|delete\(|mutation/i);
  });

  it('activates maintenance in the existing visual runtime', () => {
    expect(runtime).toContain("definition.sectors.includes('manutencao')");
    expect(runtime).toContain('createMaintenanceVisualPresentation');
  });
});
