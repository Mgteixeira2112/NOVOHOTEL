import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const hostSource = readFileSync('src/workspace-engine/WorkspaceWidgetHost.tsx', 'utf8');
const editorSource = readFileSync('src/components/admin/WorkspaceVisualCanvasEditor.tsx', 'utf8');

test('generic host resolves only the existing registered widget renderer', () => {
  assert.match(hostSource, /getWorkspaceWidgetRenderer\(widget\.type\)/);
  assert.match(hostSource, /<Renderer workspace=\{workspace\} widget=\{widget\} \/>/);
  assert.doesNotMatch(hostSource, /useHotel\(/);
  assert.doesNotMatch(hostSource, /supabase|\.from\(|rpc\(|fetch\(/i);
});

test('host owns presentation shell, escape and body scroll lock only', () => {
  assert.match(hostSource, /document\.body\.style\.overflow = 'hidden'/);
  assert.match(hostSource, /event\.key === 'Escape'/);
  assert.match(hostSource, /mode\?: 'modal' \| 'fullscreen'/);
  assert.match(hostSource, /data-workspace-widget-host/);
});

test('visual editor opens the same complete widget from shortcuts and sidebar', () => {
  assert.match(editorSource, /<WorkspaceWidgetHost/);
  assert.match(editorSource, /setOpenWidgetId\(shortcut\.widgetId\)/);
  assert.match(editorSource, /setOpenWidgetId\(widgetId\)/);
  assert.match(editorSource, /mode=\{viewport === 'mobile' \? 'fullscreen' : 'modal'\}/);
});
