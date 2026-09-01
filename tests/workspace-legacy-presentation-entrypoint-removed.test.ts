import fs from 'node:fs';
import path from 'node:path';

describe('legacy Workspace presentation entrypoint removal', () => {
  const root = process.cwd();
  const entrypoint = path.join(root, 'src/workspace-engine/presentation.ts');
  const compatibility = path.join(root, 'src/workspace-engine/legacyPresentationCompatibility.ts');
  const legacyTypes = path.join(root, 'src/workspace-engine/legacyPresentationTypes.ts');
  const runtime = fs.readFileSync(path.join(root, 'src/workspace-engine/VisualWorkspaceRuntime.tsx'), 'utf8');
  const workspaceRuntime = fs.readFileSync(path.join(root, 'src/workspace-engine/WorkspaceRuntime.tsx'), 'utf8');
  const editor = fs.readFileSync(path.join(root, 'src/components/admin/WorkspaceEditorModule.tsx'), 'utf8');
  const preview = fs.readFileSync(path.join(root, 'src/components/admin/WorkspacePreviewPanel.tsx'), 'utf8');
  const catalog = fs.readFileSync(path.join(root, 'src/workspace-engine/widgetCatalog.ts'), 'utf8');

  it('removes the deprecated presentation entrypoint while preserving the historical compatibility boundary', () => {
    expect(fs.existsSync(entrypoint)).toBe(false);
    expect(fs.existsSync(compatibility)).toBe(true);
    expect(fs.existsSync(legacyTypes)).toBe(true);
  });

  it('keeps active runtime and Factory independent from legacy presentation compatibility', () => {
    for (const source of [runtime, workspaceRuntime, editor, preview, catalog]) {
      expect(source).not.toContain('legacyPresentationCompatibility');
      expect(source).not.toContain('resolveWidgetPresentation');
      expect(source).not.toContain('getWorkspaceDeviceMode');
      expect(source).not.toContain("workspace-engine/presentation");
      expect(source).not.toContain("./presentation");
    }
  });
});
