import React, { useMemo } from 'react';
import { createReceptionVisualPresentation } from '../../workspace-engine/receptionVisualTemplate';
import type { WorkspaceDefinition, WorkspaceViewport } from '../../workspace-engine/types';
import { WorkspaceVisualCanvasEditor } from './WorkspaceVisualCanvasEditor';

interface WorkspaceVisualEditorPresetBridgeProps {
  definition: WorkspaceDefinition;
  viewport: WorkspaceViewport;
  onChange: (patch: Partial<WorkspaceDefinition>) => void;
}

/**
 * Applies an in-memory Reception preset only when the Workspace does not yet
 * own a visualPresentation. The first visual edit persists the complete preset
 * through the existing Workspace save path; no new persistence is introduced.
 */
export const WorkspaceVisualEditorPresetBridge: React.FC<WorkspaceVisualEditorPresetBridgeProps> = ({
  definition,
  viewport,
  onChange,
}) => {
  const effectiveDefinition = useMemo<WorkspaceDefinition>(() => {
    if (definition.visualPresentation || definition.sectors[0] !== 'recepcao') return definition;
    return {
      ...definition,
      visualPresentation: createReceptionVisualPresentation(definition.widgets),
    };
  }, [definition]);

  return <WorkspaceVisualCanvasEditor definition={effectiveDefinition} viewport={viewport} onChange={onChange} />;
};
