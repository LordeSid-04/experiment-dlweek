import { useMemo, useState } from "react";
import type { DiffFinding, UnifiedDiffLine } from "@/lib/mockRun";

type DiffViewerProps = {
  diffLines: UnifiedDiffLine[];
  findings: DiffFinding[];
};

const severityPillClass = {
  LOW: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200",
  MED: "border-amber-300/30 bg-amber-300/10 text-amber-200",
  HIGH: "border-orange-300/35 bg-orange-300/10 text-orange-200",
  CRITICAL: "border-rose-300/35 bg-rose-300/10 text-rose-200",
} as const;

const lineTintClass = {
  LOW: "bg-emerald-300/[0.06]",
  MED: "bg-amber-300/[0.06]",
  HIGH: "bg-orange-300/[0.07]",
  CRITICAL: "bg-rose-300/[0.08]",
} as const;

export function DiffViewer({ diffLines, findings }: DiffViewerProps) {
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);

  const findingById = useMemo(
    () => Object.fromEntries(findings.map((finding) => [finding.id, finding])),
    [findings]
  );

  const selectedFinding = selectedFindingId ? findingById[selectedFindingId] : undefined;

  if (!diffLines.length) {
    return (
      <div className="min-h-[300px] rounded-lg border border-white/10 bg-black/35 p-3 text-sm text-white/70">
        Run a task in the AI Panel to generate unified diff output.
      </div>
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="rounded-lg border border-white/10 bg-black/35 p-2">
        <div className="space-y-1 font-mono text-xs">
          {diffLines.map((line) => {
            const finding = line.findingIds?.[0] ? findingById[line.findingIds[0]] : undefined;
            const prefix = line.kind === "add" ? "+" : line.kind === "remove" ? "-" : " ";
            const baseTint = finding ? lineTintClass[finding.severity] : "";

            return (
              <div
                key={`${line.lineNumber}-${line.content}`}
                className={`flex items-start gap-2 rounded px-2 py-1 ${baseTint}`}
              >
                <span className="w-10 text-right text-white/45">{line.lineNumber}</span>
                <span className="w-3 text-white/60">{prefix}</span>
                <span className="flex-1 text-white/82">{line.content}</span>
                {finding ? (
                  <button
                    type="button"
                    onClick={() => setSelectedFindingId(finding.id)}
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${severityPillClass[finding.severity]}`}
                  >
                    {finding.severity}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-black/35 p-3">
        {selectedFinding ? (
          <div className="space-y-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/60">
              Finding
            </p>
            <h3 className="text-sm font-semibold text-white">{selectedFinding.title}</h3>
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${severityPillClass[selectedFinding.severity]}`}
            >
              {selectedFinding.severity}
            </span>
            <p className="text-xs text-white/70">
              Evidence: line {selectedFinding.lineNumber} · {selectedFinding.ruleName}
            </p>
            <p className="text-xs text-white/78">{selectedFinding.evidence}</p>
            <div className="rounded border border-white/10 bg-black/40 p-2">
              <p className="mb-1 text-[10px] uppercase tracking-[0.12em] text-white/60">
                Suggested fix
              </p>
              <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-white/80">
                {selectedFinding.suggestedFixSnippet}
              </pre>
            </div>
          </div>
        ) : (
          <p className="text-xs text-white/60">
            Click a severity badge in the diff to inspect finding details.
          </p>
        )}
      </div>
    </div>
  );
}
