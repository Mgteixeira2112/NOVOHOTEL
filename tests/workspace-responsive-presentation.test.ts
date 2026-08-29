import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

const types = readFileSync('src/workspace-engine/types.ts', 'utf8');
const runtime = readFileSync('src/workspace-engine/WidgetDrivenWorkspace.tsx', 'utf8');
const editor = readFileSync('src/components/admin/WorkspaceEditorModule.tsx', 'utf8');

describe('workspace responsive presentation', () => {
  test('keeps presentation separate from widget business contract', () => {
    expect(types).toContain("WorkspaceViewport = 'desktop' | 'mobile' | 'kds'");
    expect(types).toContain('presentation?: WorkspaceWidgetPresentation');
    expect(types).toContain('presentation?: WorkspacePresentation');
  });

  test('runtime exposes mobile, desktop and KDS strategies', () => {
    expect(runtime).toContain("requested === 'kds'");
    expect(runtime).toContain("data-workspace-viewport={viewport}");
    expect(runtime).toContain("columns-1 gap-4 md:columns-2 xl:columns-4");
  });

  test('runtime shows operational date and time in header', () => {
    expect(runtime).toContain("Intl.DateTimeFormat('pt-BR'");
    expect(runtime).toContain("header?.showDate !== false");
    expect(runtime).toContain("header?.showTime !== false");
  });

  test('factory exposes workspace, mobile and KDS presentation controls', () => {
    expect(editor).toContain('Aparência do Workspace');
    expect(editor).toContain('Habilitar modo KDS / TV');
    expect(editor).toContain('MOBILE');
    expect(editor).toContain('KDS / TV');
    expect(editor).toContain('ALTURA');
    expect(editor).toContain('VISUAL');
  });
});
