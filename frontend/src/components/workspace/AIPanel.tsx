"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { GovernanceMode, GovernancePermission, PermissionState } from "@/lib/governance";
import {
  generateMockRun,
  type MockRunResult,
  type RunTimelineStep,
} from "@/lib/mockRun";

type AIPanelProps = {
  mode: GovernanceMode;
  permissions: GovernancePermission[];
  onRunGenerated: (result: MockRunResult) => void;
  onManualEditToggle: (enabled: boolean) => void;
  isResizable?: boolean;
  onResizeStart?: () => void;
};

const panelNotes: Record<GovernanceMode, string> = {
  assist: "Assistant suggestions and scoped next-step prompts appear here.",
  pair: "Collaborative AI responses, context links, and review hints appear here.",
  autopilot: "Autonomous task stream and checkpoints appear here.",
};

export function AIPanel({
  mode,
  permissions,
  onRunGenerated,
  onManualEditToggle,
  isResizable = false,
  onResizeStart,
}: AIPanelProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [timeline, setTimeline] = useState<RunTimelineStep[]>([]);
  const [autocompleteEnabled, setAutocompleteEnabled] = useState(true);
  const [assistPrompt, setAssistPrompt] = useState("");
  const [manualEditMode, setManualEditMode] = useState(false);

  const handleSubmit = () => {
    const runResult = generateMockRun(assistPrompt, mode);
    setTimeline(runResult.timeline);
    onRunGenerated(runResult);
  };

  const getPermissionState = (
    category: GovernancePermission["category"]
  ): PermissionState => {
    return permissions.find((permission) => permission.category === category)?.state ?? "blocked";
  };

  const codeChangeState = getPermissionState("Code Changes");
  const currentGateDecision = timeline[timeline.length - 1]?.gateDecision;

  return (
    <aside className="relative rounded-xl border border-white/10 bg-white/[0.02] p-3">
      {isResizable ? (
        <button
          type="button"
          onMouseDown={onResizeStart}
          aria-label="Resize AI panel"
          className="absolute -left-2 top-1/2 hidden h-24 w-2 -translate-y-1/2 cursor-col-resize rounded-full border border-white/20 bg-white/[0.06] xl:block"
        />
      ) : null}
      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
        AI Panel
      </h2>
      <div className="mt-3 min-h-[300px] rounded-lg border border-violet-300/20 bg-violet-300/[0.05] p-3">
        <p className="text-sm font-medium text-violet-100">Mode: {mode}</p>
        <p className="mt-2 text-sm text-white/80">{panelNotes[mode]}</p>

        <AnimatePresence mode="wait">
          {mode === "assist" ? (
            <motion.div
              key="assist-controls"
              initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: reduceMotion ? 0 : 0.18, ease: "easeOut" }}
              className="mt-4 rounded-lg border border-white/12 bg-black/30 p-3"
            >
            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                className="rounded-full border border-violet-300/35 bg-violet-300/12 px-3 py-1 text-xs font-medium text-violet-100 hover:bg-violet-300/20"
              >
                Suggest
              </button>

              <button
                type="button"
                onClick={() => setAutocompleteEnabled((prev) => !prev)}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] ${
                  autocompleteEnabled
                    ? "border-violet-300/35 bg-violet-300/15 text-violet-100"
                    : "border-white/20 bg-white/[0.02] text-white/70"
                }`}
              >
                {autocompleteEnabled ? "ON" : "OFF"}
              </button>
            </div>

            <textarea
              value={assistPrompt}
              onChange={(event) => setAssistPrompt(event.target.value)}
              placeholder="Ask AI for a safe suggestion..."
              className="mt-3 min-h-[84px] w-full rounded-md border border-white/12 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none placeholder:text-white/45"
            />
            </motion.div>
          ) : null}

          {mode === "pair" ? (
            <motion.div
              key="pair-controls"
              initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: reduceMotion ? 0 : 0.18, ease: "easeOut" }}
              className="mt-4 rounded-lg border border-white/12 bg-black/30 p-3"
            >
            <p className="text-xs text-white/75">
              Enter a prompt to generate the next guided change proposal.
            </p>
            <textarea
              value={assistPrompt}
              onChange={(event) => setAssistPrompt(event.target.value)}
              placeholder="Describe what you want changed..."
              className="mt-3 min-h-[96px] w-full rounded-md border border-white/12 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none placeholder:text-white/45"
            />
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleSubmit}
                className="rounded-full border border-violet-300/35 bg-violet-300/12 px-3 py-1 text-xs font-medium text-violet-100 hover:bg-violet-300/20"
              >
                Submit Prompt
              </button>
              {currentGateDecision ? (
                <span className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-white/70">
                  Gate: {currentGateDecision}
                </span>
              ) : null}
            </div>
            </motion.div>
          ) : null}

          {mode === "autopilot" ? (
            <motion.div
              key="autopilot-controls"
              initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: reduceMotion ? 0 : 0.18, ease: "easeOut" }}
              className="mt-4 rounded-lg border border-white/12 bg-black/30 p-3"
            >
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={codeChangeState === "blocked"}
                title={
                  codeChangeState === "blocked"
                    ? "Requires higher confidence mode"
                    : "Generate code with AI"
                }
                className="rounded-full border border-violet-300/35 bg-violet-300/12 px-3 py-1 text-xs font-medium text-violet-100 hover:bg-violet-300/20 disabled:cursor-not-allowed disabled:opacity-55"
              >
                Generate Code with AI
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = !manualEditMode;
                  setManualEditMode(next);
                  onManualEditToggle(next);
                }}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  manualEditMode
                    ? "border-white/35 bg-white/[0.08] text-white"
                    : "border-white/20 text-white/75 hover:bg-white/[0.06]"
                }`}
              >
                Manual Edit {manualEditMode ? "ON" : "OFF"}
              </button>
            </div>

            <div className="mt-3 rounded-md border border-white/10 bg-white/[0.02] p-3">
              <p className="text-xs text-white/75">
                Describe the app you want, and the agent will draft the full build plan and code direction.
              </p>
              <textarea
                value={assistPrompt}
                onChange={(event) => setAssistPrompt(event.target.value)}
                placeholder="Build a production-ready app with auth, dashboard, APIs, tests, and deployment checklist..."
                className="mt-3 min-h-[120px] w-full rounded-md border border-white/12 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/45"
              />
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="rounded-full border border-violet-300/35 bg-violet-300/12 px-3 py-1 text-xs font-medium text-violet-100 hover:bg-violet-300/20"
                >
                  Build App from Prompt
                </button>
                {currentGateDecision ? (
                  <span className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-white/70">
                    Gate: {currentGateDecision}
                  </span>
                ) : null}
              </div>
            </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

      </div>
    </aside>
  );
}
