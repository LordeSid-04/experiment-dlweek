type ReviewChecklistProps = {
  viewedRiskHighlights: boolean;
  viewedSecurityReport: boolean;
  viewedTests: boolean;
  onChange: (
    key: "viewedRiskHighlights" | "viewedSecurityReport" | "viewedTests",
    checked: boolean
  ) => void;
  recommendedOnly: boolean;
};

export function ReviewChecklist({
  viewedRiskHighlights,
  viewedSecurityReport,
  viewedTests,
  onChange,
  recommendedOnly,
}: ReviewChecklistProps) {
  return (
    <div className="rounded-md border border-white/12 bg-white/[0.02] p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
          Review Checklist
        </p>
        <span className="text-[11px] text-white/60">
          {recommendedOnly ? "Recommended" : "Required"}
        </span>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs text-white/82">
          <input
            type="checkbox"
            checked={viewedRiskHighlights}
            onChange={(event) => onChange("viewedRiskHighlights", event.target.checked)}
          />
          viewed risk highlights
        </label>
        <label className="flex items-center gap-2 text-xs text-white/82">
          <input
            type="checkbox"
            checked={viewedSecurityReport}
            onChange={(event) => onChange("viewedSecurityReport", event.target.checked)}
          />
          viewed security report
        </label>
        <label className="flex items-center gap-2 text-xs text-white/82">
          <input
            type="checkbox"
            checked={viewedTests}
            onChange={(event) => onChange("viewedTests", event.target.checked)}
          />
          viewed tests
        </label>
      </div>
    </div>
  );
}
