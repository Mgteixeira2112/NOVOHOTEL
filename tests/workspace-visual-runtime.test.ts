import fs from 'node:fs';
import path from 'node:path';

describe('Workspace visual operational runtime', () => {
  const runtimePath = path.join(process.cwd(), 'src/workspace-engine/VisualWorkspaceRuntime.tsx');
  const entryPath = path.join(process.cwd(), 'src/workspace-engine/WorkspaceRuntime.tsx');
  const runtime = fs.readFileSync(runtimePath, 'utf8');
  const entry = fs.readFileSync(entryPath, 'utf8');

  it('renders the saved visual surface and opens the existing complete widget through the generic host', () => {
    expect(runtime).toContain('getWorkspaceVisualSurface');
    expect(runtime).toContain('WorkspaceShortcutSummary');
    expect(runtime).toContain('WorkspaceWidgetHost');
    expect(runtime).toContain('data-workspace-runtime="visual"');
  });

  it('keeps the visual runtime presentation-only', () => {
    expect(runtime).not.toMatch(/supabase|\.from\(|\.rpc\(|fetch\(|axios|receptionStayService/i);
    expect(runtime).not.toMatch(/insert\(|update\(|delete\(|mutation/i);
  });

  it('uses the four official device contexts', () => {
    expect(runtime).toContain("return 'mobile'");
    expect(runtime).toContain("return 'tablet'");
    expect(runtime).toContain("return 'desktop'");
    expect(runtime).toContain("requested === 'kds'");
  });

  it('activates visual runtime without deleting the migration fallback yet', () => {
    expect(entry).toContain('hasVisualWorkspaceRuntime(definition)');
    expect(entry).toContain('<VisualWorkspaceRuntime definition={definition} />');
    expect(entry).toContain('<WidgetDrivenWorkspace definition={definition} />');
  });
});
