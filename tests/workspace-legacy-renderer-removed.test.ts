import fs from 'node:fs';
import path from 'node:path';

describe('legacy Workspace renderer removal', () => {
  const legacyPath = path.join(process.cwd(), 'src/workspace-engine/WidgetDrivenWorkspace.tsx');
  const runtime = fs.readFileSync(path.join(process.cwd(), 'src/workspace-engine/WorkspaceRuntime.tsx'), 'utf8');

  it('removes the legacy renderer alias from the source tree', () => {
    expect(fs.existsSync(legacyPath)).toBe(false);
  });

  it('keeps VisualWorkspaceRuntime as the only Workspace runtime', () => {
    expect(runtime).toContain("import { VisualWorkspaceRuntime } from './VisualWorkspaceRuntime';");
    expect(runtime).toContain('<VisualWorkspaceRuntime definition={definition} />');
    expect(runtime).not.toContain('WidgetDrivenWorkspace');
  });
});
