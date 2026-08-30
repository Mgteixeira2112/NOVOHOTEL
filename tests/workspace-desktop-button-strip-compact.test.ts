import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

const css = readFileSync('src/workspace-engine/workspaceDesktopButtonStrip.css', 'utf8');
const main = readFileSync('src/main.tsx', 'utf8');

describe('Workspace Desktop compact button strip', () => {
  test('keeps many button widgets readable in one horizontal strip', () => {
    expect(main).toContain("import './workspace-engine/workspaceDesktopButtonStrip.css';");
    expect(css).toContain("[data-desktop-button-strip] [data-widget-display='button']");
    expect(css).toContain('min-width: 10rem !important;');
    expect(css).toContain('flex: 0 0 auto !important;');
    expect(css).toContain('min-height: 3.25rem !important;');
    expect(css).toContain("> button > div > p");
    expect(css).toContain('display: none;');
    expect(css).toContain('text-overflow: ellipsis;');
    expect(css).toContain('white-space: nowrap;');
  });
});
