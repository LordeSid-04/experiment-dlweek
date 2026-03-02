import { getMode, getPermissions } from "@/lib/governance";
import { useAppStore } from "@/lib/store";

export function useGovernance() {
  const selectedProjectId = useAppStore((state) => state.selectedProjectId);
  const confidenceByProject = useAppStore((state) => state.confidenceByProject);
  const setSelectedProjectId = useAppStore((state) => state.setSelectedProjectId);
  const setConfidenceForProject = useAppStore((state) => state.setConfidenceForProject);
  const confidencePercent = confidenceByProject[selectedProjectId] ?? 50;
  const setConfidencePercent = (percent: number) =>
    setConfidenceForProject(selectedProjectId, percent);
  const mode = getMode(confidencePercent);
  const permissions = getPermissions(mode);

  return {
    selectedProjectId,
    setSelectedProjectId,
    confidencePercent,
    setConfidencePercent,
    mode,
    permissions,
  };
}
