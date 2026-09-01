import fs from 'node:fs';
import path from 'node:path';

describe('Workspace legacy presentation compatibility boundary', () => {
  const runtimePath = path.join(process.cwd(), 'src/workspace-engine/VisualWorkspaceRuntime.tsx');
  const factoryPath = path.join(process.cwd(), 'src/components/admin/WorkspaceEditorModule.tsx');
  const compatibilityPath = path.join(process.cwd(), 'src/workspace-engine/legacyPresentationCompatibility.ts');
  const entrypointPath = path.join(process.cwd(), 'src/workspace-engine/presentation.ts');

  const runtime = fs.readFileSync(runtimePath, 'utf8');
  const factory = fs.readFileSync(factoryPath, 'utf8');
  const compatibility = fs.readFileSync(compatibilityPath, 'utf8');
  const entrypoint = fs.readFileSync(entrypointPath, 'utf8');

  it('keeps active runtime and Factory independent from historical presentation helpers', () => {
    expect(runtime).not.toContain("from './presentation'");
    expect(runtime).not.toContain('resolveWidgetPresentation');
    expect(runtime).not.toContain('getWorkspaceDeviceMode');
    expect(factory).not.toContain("workspace-engine/presentation");
    expect(factory).not.toContain('resolveWidgetPresentation');
    expect(factory).not.toContain('getWorkspaceDeviceMode');
  });

  it('isolates old resolution logic behind an explicit compatibility module', () => {
    expect(compatibility).toContain('Compatibility-only presentation model');
    expect(compatibility).toContain('resolveWidgetPresentation');
    expect(compatibility).toContain('getWorkspaceDeviceMode');
    expect(entrypoint).toContain("export * from './legacyPresentationCompatibility'");
    expect(entrypoint).toContain('@deprecated');
  });

  it('does not introduce data access into the compatibility layer', () => {
    expect(compatibility).not.toMatch(/supabase|\.from\(|\.rpc\(|fetch\(|axios|service/i);
    expect(compatibility).not.toMatch(/insert\(|update\(|delete\(|mutation/i);
  });
});
