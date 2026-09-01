import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const types = readFileSync('src/workspace-engine/types.ts', 'utf8');
const presets = readFileSync('src/workspace-engine/workspaceVisualPresets.ts', 'utf8');
const controls = readFileSync('src/components/admin/WorkspaceGeneralPresentationControls.tsx', 'utf8');
const editor = readFileSync('src/components/admin/WorkspaceDesktopLayoutEditor.tsx', 'utf8');
const runtime = readFileSync('src/workspace-engine/WidgetDrivenWorkspace.tsx', 'utf8');
const officialFactory = readFileSync('src/workspace-engine/workspaceOfficialFactory.ts', 'utf8');

test('Freeze Visual 3.0 mantém contratos de superfície, posição Desktop e sidebar na apresentação', () => {
  assert.match(types, /WorkspaceBackgroundPresetId/);
  assert.match(types, /WorkspaceSurfacePresentation/);
  assert.match(types, /WorkspaceSidebarPresentation/);
  assert.match(types, /sidebar\?: WorkspaceSidebarPresentation/);
  assert.match(types, /x\?: number/);
  assert.match(types, /y\?: number/);
});

test('Freeze Visual 3.0 mantém biblioteca local de fundos sem dependência externa', () => {
  assert.match(presets, /id: 'none'/);
  assert.match(presets, /id: 'lobby'/);
  assert.match(presets, /id: 'operations'/);
  assert.match(presets, /id: 'finance'/);
  assert.match(presets, /id: 'service'/);
  assert.match(presets, /backgroundImage:/);
  assert.doesNotMatch(presets, /https?:\/\//i);
});

test('Freeze Visual 3.0 mantém edição na Fábrica usando o runtime real', () => {
  assert.match(controls, /data-workspace-surface-controls/);
  assert.match(controls, /data-workspace-sidebar-controls/);
  assert.match(editor, /<WidgetDrivenWorkspace definition=\{definition\} forcedViewport="desktop" previewMode \/>/);
  assert.match(editor, /data-workspace-layout-runtime/);
  assert.match(editor, /data-workspace-spatial-editor/);
  assert.match(editor, /data-workspace-sidebar-editor/);
});

test('Freeze Visual 3.0 preserva fallback Desktop e ativa posição livre/sidebar somente por configuração', () => {
  assert.match(runtime, /desktopSpatialActive = viewport === 'desktop' && desktopSpatialEntries\.length > 0/);
  assert.match(runtime, /desktopSidebarActive = viewport === 'desktop' && sidebar\?\.enabled === true/);
  assert.match(runtime, /desktopFlowEntries\.forEach\(entry =>/);
  assert.match(runtime, /renderDesktopSurface\(\)/);
  assert.match(runtime, /renderDesktopSpatialWidgets\(\)/);
  assert.match(runtime, /renderDesktopSidebar\(\)/);
});

test('Freeze Visual 3.0 mantém sidebar baseada somente em widgets-botão já filtrados pelo runtime', () => {
  assert.match(runtime, /desktopSidebarEntries = desktopSidebarActive[\s\S]*entries\.filter\(\(\{ presentation \}\) => presentation\.display === 'button'\)/);
  assert.match(runtime, /openWidgetPanel\(widget\.id\)/);
  assert.match(runtime, /itemSize !== 'compact'/);
  assert.match(runtime, /itemSize === 'large'/);
  assert.match(runtime, /canAccessResource\(rbacMatrix, role, requiredResource\)/);
});

test('Freeze Visual 3.0 mantém Mobile e KDS fora da camada espacial Desktop', () => {
  assert.match(runtime, /viewport === 'desktop'[\s\S]*renderDesktopSurface\(\)[\s\S]*entries\.map\(\(\{ widget, presentation \}\) =>/);
  assert.match(runtime, /isKds \? kdsSpanClass\(presentation\.width, kdsOrientation\) : ''/);
  assert.match(editor, /Mobile e KDS continuam usando suas estratégias próprias/);
});

test('Freeze Visual 3.0 mantém presets oficiais e sidebar desativada por padrão', () => {
  assert.match(officialFactory, /createVisualPresentation\('lobby'\)/);
  assert.match(officialFactory, /createVisualPresentation\('finance'\)/);
  assert.match(officialFactory, /createVisualPresentation\('service'\)/);
  assert.match(officialFactory, /enabled: false/);
  assert.match(officialFactory, /surface: template\.presentation\.surface \? \{ \.\.\.template\.presentation\.surface \} : undefined/);
  assert.match(officialFactory, /sidebar: template\.presentation\.sidebar \? \{ \.\.\.template\.presentation\.sidebar \} : undefined/);
});

test('Freeze Visual 3.0 não introduz persistência ou fontes de dados paralelas na camada visual', () => {
  const visualLayer = [presets, controls, editor].join('\n');
  assert.doesNotMatch(visualLayer, /localStorage|sessionStorage|migration|supabase\.from|fetch\(/i);
});
