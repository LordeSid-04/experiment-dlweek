import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { snapToClosestBand } from "@/lib/governance";

type AppState = {
  selectedProjectId: string;
  confidenceByProject: Record<string, number>;
  setSelectedProjectId: (projectId: string) => void;
  setConfidenceForProject: (projectId: string, percent: number) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedProjectId: "default-project",
      confidenceByProject: {
        "default-project": 50,
      },
      setSelectedProjectId: (projectId) =>
        set({
          selectedProjectId: projectId,
        }),
      setConfidenceForProject: (projectId, percent) =>
        set((state) => ({
          confidenceByProject: {
            ...state.confidenceByProject,
            [projectId]: snapToClosestBand(percent),
          },
        })),
    }),
    {
      name: "codex-app-state",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState as Partial<{
          confidencePercent: number;
          selectedProjectId: string;
          confidenceByProject: Record<string, number>;
        }>;

        if (
          state &&
          typeof state.selectedProjectId === "string" &&
          state.confidenceByProject &&
          typeof state.confidenceByProject === "object"
        ) {
          return state;
        }

        const legacyConfidence =
          typeof state?.confidencePercent === "number"
            ? snapToClosestBand(state.confidencePercent)
            : 50;

        return {
          selectedProjectId: "default-project",
          confidenceByProject: {
            "default-project": legacyConfidence,
          },
        };
      },
    }
  )
);
