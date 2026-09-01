import fs from 'node:fs';
import path from 'node:path';

describe('legacy Workspace renderer retirement', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src/workspace-engine/WidgetDrivenWorkspace.tsx'), 'utf8');

  it('keeps only a temporary compatibility alias to the visual runtime', () => {
    expect(source).toContain('VisualWorkspaceRuntime');
    expect(source).not.toContain('resolveWidgetPresentation');
    expect(source).not.toContain('getWorkspaceDeviceMode');
    expect(source).not.toContain('masonrySpanClass');
    expect(source).not.toContain('kdsDensity');
    expect(source).not.toContain('createPortal');
  });

  it('does not contain an independent renderer implementation anymore', () => {
    expect(source.split('\n').length).toBeLessThan(12);
  });
});
