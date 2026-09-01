import fs from 'node:fs';
import path from 'node:path';

describe('Workspace legacy presentation type boundary', () => {
  const enginePath = path.join(process.cwd(), 'src/workspace-engine');
  const types = fs.readFileSync(path.join(enginePath, 'types.ts'), 'utf8');
  const legacyTypes = fs.readFileSync(path.join(enginePath, 'legacyPresentationTypes.ts'), 'utf8');
  const legacyCompatibility = fs.readFileSync(path.join(enginePath, 'legacyPresentationCompatibility.ts'), 'utf8');
  const runtime = fs.readFileSync(path.join(enginePath, 'VisualWorkspaceRuntime.tsx'), 'utf8');
  const editor = fs.readFileSync(path.join(process.cwd(), 'src/components/admin/WorkspaceEditorModule.tsx'), 'utf8');

  it('keeps historical presentation contracts in the compatibility module', () => {
    expect(legacyTypes).toContain("export type WorkspaceWidgetWidth = 'small' | 'medium' | 'large' | 'full'");
    expect(legacyTypes).toContain('export interface WorkspaceWidgetPresentation');
    expect(legacyTypes).toContain('export interface WorkspacePresentation');
    expect(legacyTypes).toContain('export type WorkspaceWidgetSpan');
  });

  it('keeps legacy types private to the compatibility boundary', () => {
    expect(types).toContain("from './legacyPresentationTypes'");
    expect(types).not.toContain("export type {\n  WorkspaceDevicePresentation");
    expect(types).not.toContain('WorkspaceWidgetWidth,');
    expect(types).not.toContain('WorkspaceDevicePresentationMode,');
    expect(types).not.toContain('WorkspaceKdsPresentation,');
    expect(types).not.toContain('WorkspaceWidgetDisplay,');
    expect(types).not.toContain('WorkspaceWidgetHeight,');
    expect(types).not.toContain('WorkspaceWidgetVisualStyle,');
    expect(types).not.toContain('WorkspaceWidgetHeaderStyle,');
  });

  it('keeps compatibility-only serialized fields typed internally', () => {
    expect(types).toContain('span?: WorkspaceWidgetSpan');
    expect(types).toContain('presentation?: WorkspaceWidgetPresentation');
    expect(types).toContain('presentation?: WorkspacePresentation');
  });

  it('makes the compatibility resolver consume legacy types directly', () => {
    expect(legacyCompatibility).toContain("from './legacyPresentationTypes'");
  });

  it('keeps active runtime and Factory outside the legacy type boundary', () => {
    expect(runtime).not.toContain('legacyPresentationTypes');
    expect(runtime).not.toContain('legacyPresentationCompatibility');
    expect(editor).not.toContain('legacyPresentationTypes');
    expect(editor).not.toContain('legacyPresentationCompatibility');
  });
});
