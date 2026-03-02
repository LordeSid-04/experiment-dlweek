"use client";

import JSZip from "jszip";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { AIPanel } from "@/components/workspace/AIPanel";
import { EditorDiffTabs } from "@/components/workspace/EditorDiffTabs";
import { FileExplorer } from "@/components/workspace/FileExplorer";
import { PermissionsModal } from "@/components/workspace/PermissionsModal";
import { TerminalDrawer } from "@/components/workspace/TerminalDrawer";
import { TopBar } from "@/components/workspace/TopBar";
import type { DiffFinding, MockRunResult, UnifiedDiffLine } from "@/lib/mockRun";
import { useGovernance } from "@/lib/use-governance";

const PROJECT_FILE_PATHS = [
  "src/app/page.tsx",
  "src/app/confidence/page.tsx",
  "src/app/workspace/page.tsx",
  "src/components/workspace/AIPanel.tsx",
  "src/components/workspace/EditorDiffTabs.tsx",
  "src/lib/governance.ts",
] as const;

function createEmptyProjectFiles() {
  return Object.fromEntries(PROJECT_FILE_PATHS.map((path) => [path, ""])) as Record<string, string>;
}

function generateUniqueProjectId(existingIds: Set<string>) {
  let candidate = `project-${new Date().toISOString()}`;
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    candidate = `project-${crypto.randomUUID()}`;
  } else {
    candidate = `project-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  while (existingIds.has(candidate)) {
    candidate = `${candidate}-x`;
  }

  return candidate;
}

function loadSelectedProjectSnapshot(selectedProjectId: string) {
  if (typeof window === "undefined") {
    return {
      files: createEmptyProjectFiles(),
      selectedFile: PROJECT_FILE_PATHS[0],
      projectName: "Workspace Project",
    };
  }

  const userId = localStorage.getItem("codexai.activeUser") ?? "demo-user";
  const projectsByUser = JSON.parse(localStorage.getItem("codexai.projects") ?? "{}") as Record<
    string,
    Array<{ id?: string; name: string; savedAt: string; files: Record<string, string> }>
  >;
  const userProjects = projectsByUser[userId] ?? [];
  const selectedProject = userProjects.find(
    (project) => (project.id ?? `project-${project.savedAt}`) === selectedProjectId
  );

  if (!selectedProject) {
    return {
      files: createEmptyProjectFiles(),
      selectedFile: PROJECT_FILE_PATHS[0],
      projectName: "Workspace Project",
    };
  }

  const loadedFiles = Object.keys(selectedProject.files).length
    ? selectedProject.files
    : createEmptyProjectFiles();

  return {
    files: loadedFiles,
    selectedFile: Object.keys(loadedFiles)[0] ?? PROJECT_FILE_PATHS[0],
    projectName: selectedProject.name,
  };
}

export default function WorkspacePage() {
  const router = useRouter();
  const {
    mode,
    selectedProjectId,
    setSelectedProjectId,
    confidencePercent,
    permissions,
  } = useGovernance();
  const initialProjectSnapshot = useMemo(
    () => loadSelectedProjectSnapshot(selectedProjectId),
    [selectedProjectId]
  );
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [activeCenterTab, setActiveCenterTab] = useState<"editor" | "diff">("editor");
  const [diffLines, setDiffLines] = useState<UnifiedDiffLine[]>([]);
  const [findings, setFindings] = useState<DiffFinding[]>([]);
  const [logs, setLogs] = useState<string[]>(["[system] workspace ready"]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [projectFiles, setProjectFiles] = useState<Record<string, string>>(
    initialProjectSnapshot.files
  );
  const [selectedFile, setSelectedFile] = useState<string>(initialProjectSnapshot.selectedFile);
  const [isLeavePromptOpen, setIsLeavePromptOpen] = useState(false);
  const [isDeviceSavePromptOpen, setIsDeviceSavePromptOpen] = useState(false);
  const [projectDisplayName] = useState(initialProjectSnapshot.projectName);
  const filePaths = useMemo(() => Object.keys(projectFiles), [projectFiles]);
  const [aiPanelWidth, setAiPanelWidth] = useState(320);
  const [isResizingPanel, setIsResizingPanel] = useState(false);
  const layoutSectionRef = useRef<HTMLElement | null>(null);
  const isAssistOrPair = mode === "assist" || mode === "pair";

  useEffect(() => {
    if (!isResizingPanel) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const sectionBounds = layoutSectionRef.current?.getBoundingClientRect();
      if (!sectionBounds) {
        return;
      }

      const nextWidth = sectionBounds.right - event.clientX;
      const clampedWidth = Math.min(520, Math.max(260, nextWidth));
      setAiPanelWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizingPanel(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingPanel]);

  const handleRunGenerated = (result: MockRunResult) => {
    setDiffLines(result.diffLines);
    setFindings(result.findings);
    setActiveCenterTab("diff");
    setLogs((prev) => {
      const nextEntries = [
        `[run] task submitted at ${new Date().toISOString()}`,
        ...result.timeline.map(
          (step) =>
            `[${step.timestamp}] ${step.agentRole} -> ${step.artifactType} | risk=${step.riskScore} | gate=${step.gateDecision}`
        ),
      ];
      return [...prev, ...nextEntries].slice(-40);
    });
  };

  const saveProjectLocally = () => {
    const userId = localStorage.getItem("codexai.activeUser") ?? "demo-user";
    const projectsByUser = JSON.parse(localStorage.getItem("codexai.projects") ?? "{}") as Record<
      string,
      Array<{ id: string; name: string; savedAt: string; files: Record<string, string> }>
    >;
    const userProjects = projectsByUser[userId] ?? [];
    const now = new Date().toISOString();
    const existingIds = new Set(userProjects.map((project) => project.id));
    const nextProjectId =
      selectedProjectId === "default-project"
        ? generateUniqueProjectId(existingIds)
        : selectedProjectId;

    const nextProject = {
      id: nextProjectId,
      name: projectDisplayName,
      savedAt: now,
      files: projectFiles,
    };

    const withoutCurrent = userProjects.filter((project) => project.id !== nextProjectId);
    projectsByUser[userId] = [nextProject, ...withoutCurrent].slice(0, 20);
    localStorage.setItem("codexai.projects", JSON.stringify(projectsByUser));

    if (selectedProjectId !== nextProjectId) {
      setSelectedProjectId(nextProjectId);
    }
  };

  const downloadProjectToDevice = async () => {
    const zip = new JSZip();
    Object.entries(projectFiles).forEach(([path, content]) => {
      zip.file(path, content);
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `${projectDisplayName.toLowerCase().replace(/\s+/g, "-") || "workspace-project"}.zip`;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  };

  const handleLocalSaveThenPromptDevice = () => {
    saveProjectLocally();
    setIsLeavePromptOpen(false);
    setIsDeviceSavePromptOpen(true);
  };

  return (
    <main className="workspace-shell min-h-screen bg-black text-white antialiased">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 md:px-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsLeavePromptOpen(true)}
            className="inline-flex rounded-full border border-white/20 bg-white/[0.02] px-3 py-1 text-xs text-white/80 hover:bg-white/[0.08]"
          >
            Back to Confidence
          </button>
          {isAssistOrPair ? (
            <span className="inline-flex rounded-full border border-violet-300/35 bg-violet-300/12 px-3 py-1 text-xs font-medium text-violet-100">
              Editor Open
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditorOpen((prev) => !prev)}
              className="inline-flex rounded-full border border-violet-300/35 bg-violet-300/12 px-3 py-1 text-xs font-medium text-violet-100 hover:bg-violet-300/20"
            >
              {isEditorOpen ? "Hide Editor" : "Open Editor"}
            </button>
          )}
        </div>

        <TopBar
          mode={mode}
          confidencePercent={confidencePercent}
          onOpenPermissions={() => setIsPermissionsOpen(true)}
        />

        {isAssistOrPair ? (
          <section
            ref={layoutSectionRef}
            className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_var(--ai-panel-width)]"
            style={{ "--ai-panel-width": `${aiPanelWidth}px` } as CSSProperties}
          >
            <FileExplorer
              files={filePaths}
              selectedFile={selectedFile}
              onSelectFile={(path) => {
                setSelectedFile(path);
                setActiveCenterTab("editor");
              }}
            />
            <div className="space-y-2">
              <EditorDiffTabs
                tab={activeCenterTab}
                onTabChange={setActiveCenterTab}
                diffLines={diffLines}
                findings={findings}
                selectedFile={selectedFile}
                fileContent={projectFiles[selectedFile] ?? ""}
                onFileContentChange={(value) =>
                  setProjectFiles((prev) => ({
                    ...prev,
                    [selectedFile]: value,
                  }))
                }
              />
              <TerminalDrawer logs={logs} showAuditIndicator />
            </div>
            <AIPanel
              mode={mode}
              permissions={permissions}
              onRunGenerated={handleRunGenerated}
              onManualEditToggle={() => {}}
              isResizable
              onResizeStart={() => setIsResizingPanel(true)}
            />
          </section>
        ) : (
          <section className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
            <FileExplorer
              files={filePaths}
              selectedFile={selectedFile}
              onSelectFile={(path) => {
                setSelectedFile(path);
                setIsEditorOpen(true);
                setActiveCenterTab("editor");
              }}
            />
            <AIPanel
              mode={mode}
              permissions={permissions}
              onRunGenerated={handleRunGenerated}
              onManualEditToggle={(enabled) => {
                setIsEditorOpen(enabled);
                if (enabled) {
                  setActiveCenterTab("editor");
                }
              }}
            />
          </section>
        )}

        {!isAssistOrPair && isEditorOpen ? (
          <section className="space-y-2">
            <EditorDiffTabs
              tab={activeCenterTab}
              onTabChange={setActiveCenterTab}
              diffLines={diffLines}
              findings={findings}
              selectedFile={selectedFile}
              fileContent={projectFiles[selectedFile] ?? ""}
              onFileContentChange={(value) =>
                setProjectFiles((prev) => ({
                  ...prev,
                  [selectedFile]: value,
                }))
              }
            />
            <TerminalDrawer logs={logs} showAuditIndicator />
          </section>
        ) : null}
      </div>

      <PermissionsModal
        isOpen={isPermissionsOpen}
        onClose={() => setIsPermissionsOpen(false)}
        permissions={permissions}
      />

      {isLeavePromptOpen ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/65 p-4">
          <div className="w-full max-w-md rounded-2xl border border-violet-300/30 bg-[#090611] p-5 shadow-[0_0_32px_rgba(168,85,247,0.22)]">
            <h3 className="text-lg font-semibold text-violet-100">Save before leaving?</h3>
            <p className="mt-2 text-sm text-white/75">
              Do you want to save your project files before returning to Confidence?
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => router.push("/confidence")}
                className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/75 hover:bg-white/[0.08]"
              >
                Go Back Without Saving
              </button>
              <button
                type="button"
                onClick={handleLocalSaveThenPromptDevice}
                className="rounded-full border border-violet-300/40 bg-violet-300/15 px-3 py-1 text-xs font-medium text-violet-100 hover:bg-violet-300/25"
              >
                Save Project
              </button>
              <button
                type="button"
                onClick={() => setIsLeavePromptOpen(false)}
                className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/75 hover:bg-white/[0.08]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isDeviceSavePromptOpen ? (
        <div className="fixed inset-0 z-[71] grid place-items-center bg-black/65 p-4">
          <div className="w-full max-w-md rounded-2xl border border-violet-300/30 bg-[#090611] p-5 shadow-[0_0_32px_rgba(168,85,247,0.22)]">
            <h3 className="text-lg font-semibold text-violet-100">Save on this device too?</h3>
            <p className="mt-2 text-sm text-white/75">
              Your project is saved in-app under your account. Do you also want to download a copy?
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={async () => {
                  await downloadProjectToDevice();
                  router.push("/confidence");
                }}
                className="rounded-full border border-violet-300/40 bg-violet-300/15 px-3 py-1 text-xs font-medium text-violet-100 hover:bg-violet-300/25"
              >
                Save to Device and Continue
              </button>
              <button
                type="button"
                onClick={() => router.push("/confidence")}
                className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/75 hover:bg-white/[0.08]"
              >
                Skip Download and Continue
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
