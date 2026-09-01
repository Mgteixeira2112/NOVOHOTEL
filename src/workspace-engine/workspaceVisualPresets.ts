import type { CSSProperties } from 'react';
import type { WorkspaceBackgroundPresetId, WorkspaceSurfacePresentation } from './types';

export interface WorkspaceBackgroundPreset {
  id: WorkspaceBackgroundPresetId;
  label: string;
  description: string;
  backgroundColor: string;
  backgroundImage: string;
}

export const WORKSPACE_BACKGROUND_PRESETS: readonly WorkspaceBackgroundPreset[] = [
  {
    id: 'none',
    label: 'Neutro',
    description: 'Superfície clara sem imagem de fundo.',
    backgroundColor: '#f1f5f9',
    backgroundImage: 'none',
  },
  {
    id: 'lobby',
    label: 'Lobby',
    description: 'Luz quente e profundidade suave para recepção e atendimento.',
    backgroundColor: '#d6c6ae',
    backgroundImage: 'radial-gradient(circle at 78% 22%, rgba(255,255,255,.74), transparent 26%), linear-gradient(135deg, rgba(71,57,43,.42), rgba(214,198,174,.56) 42%, rgba(120,101,80,.3)), linear-gradient(25deg, #8c7964 0%, #d9c8ae 52%, #6d6257 100%)',
  },
  {
    id: 'operations',
    label: 'Operação',
    description: 'Grade técnica discreta para operação, governança e manutenção.',
    backgroundColor: '#26323b',
    backgroundImage: 'linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px), radial-gradient(circle at 20% 18%, rgba(251,191,36,.14), transparent 28%), linear-gradient(135deg, #111827, #334155)',
  },
  {
    id: 'finance',
    label: 'Financeiro',
    description: 'Superfície sóbria com foco central para indicadores e contas.',
    backgroundColor: '#17211d',
    backgroundImage: 'radial-gradient(circle at 82% 18%, rgba(16,185,129,.18), transparent 25%), radial-gradient(circle at 14% 70%, rgba(245,158,11,.12), transparent 30%), linear-gradient(145deg, #111827 0%, #1f2937 45%, #10251d 100%)',
  },
  {
    id: 'service',
    label: 'Serviço',
    description: 'Contraste leve e áreas luminosas para cozinha e fluxo de pedidos.',
    backgroundColor: '#ddd5c7',
    backgroundImage: 'radial-gradient(circle at 18% 24%, rgba(255,255,255,.72), transparent 24%), radial-gradient(circle at 82% 70%, rgba(180,83,9,.16), transparent 28%), linear-gradient(120deg, #c9bda8, #eee8dd 48%, #b8aa96)',
  },
] as const;

export const getWorkspaceBackgroundPreset = (id: WorkspaceBackgroundPresetId | undefined) =>
  WORKSPACE_BACKGROUND_PRESETS.find(preset => preset.id === (id || 'none')) || WORKSPACE_BACKGROUND_PRESETS[0];

export const workspaceSurfaceStyle = (surface: WorkspaceSurfacePresentation | undefined): CSSProperties => {
  const preset = getWorkspaceBackgroundPreset(surface?.backgroundPreset);
  return {
    backgroundColor: preset.backgroundColor,
    backgroundImage: preset.backgroundImage,
    backgroundSize: surface?.backgroundFit === 'contain' ? 'contain' : 'cover',
    backgroundPosition: surface?.backgroundPosition || 'center',
    backgroundRepeat: 'no-repeat',
    minHeight: surface?.minHeight ? `${Math.max(480, surface.minHeight)}px` : undefined,
  };
};
