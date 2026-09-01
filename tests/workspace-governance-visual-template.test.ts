import fs from 'node:fs';
import path from 'node:path';

describe('Governance visual Workspace template', () => {
  const templatePath = path.join(process.cwd(), 'src/workspace-engine/governanceVisualTemplate.ts');
  const runtimePath = path.join(process.cwd(), 'src/workspace-engine/VisualWorkspaceRuntime.tsx');
  const template = fs.readFileSync(templatePath, 'utf8');
  const runtime = fs.readFileSync(runtimePath, 'utf8');

  it('defines independent Desktop, Tablet, Mobile and KDS surfaces', () => {
    expect(template).toContain("viewport: 'desktop'");
    expect(template).toContain("viewport: 'tablet'");
    expect(template).toContain("viewport: 'mobile'");
    expect(template).toContain("viewport: 'kds'");
  });

  it('uses only existing Governance widgets and keeps KDS without sidebar', () => {
    expect(template).toContain("widgetByType(widgets, 'room-map')");
    expect(template).toContain("widgetByType(widgets, 'task-kanban')");
    expect(template).toContain("widgetByType(widgets, 'room-details')");
    expect(template).toContain("widgetByType(widgets, 'frigobar')");
    expect(template).toContain("widgetByType(widgets, 'team')");
    expect(template).toContain('enabled: false');
  });

  it('keeps the Governance preset presentation-only', () => {
    expect(template).not.toMatch(/supabase|\.from\(|\.rpc\(|fetch\(|axios|service/i);
    expect(template).not.toMatch(/insert\(|update\(|delete\(|mutation/i);
  });

  it('activates the same visual runtime for Governance without creating another renderer', () => {
    expect(runtime).toContain('createGovernanceVisualPresentation');
    expect(runtime).toContain("definition.sectors.includes('governanca')");
    expect(runtime).toContain('WorkspaceWidgetHost');
    expect(runtime).toContain('WorkspaceShortcutSummary');
  });
});
