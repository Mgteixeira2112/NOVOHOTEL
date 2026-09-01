import fs from 'node:fs';
import path from 'node:path';

describe('Workspace Factory retired presentation shells', () => {
  const editor = fs.readFileSync(path.join(process.cwd(), 'src/components/admin/WorkspaceEditorModule.tsx'), 'utf8');

  it('does not import or render retired presentation shells', () => {
    expect(editor).not.toContain('WorkspaceGeneralPresentationControls');
    expect(editor).not.toContain('WorkspaceWidgetPresentationControls');
    expect(editor).not.toContain('getWorkspaceDeviceMode');
  });

  it('keeps the visual preview as the presentation editor', () => {
    expect(editor).toContain('WorkspacePreviewPanel');
    expect(editor).toContain('definition={selected} onChange={updateSelected}');
  });

  it('keeps domain-specific editors intact', () => {
    expect(editor).toContain('KanbanWidgetAutomationEditor');
    expect(editor).toContain('RoomMapWidgetEditor');
  });
});
