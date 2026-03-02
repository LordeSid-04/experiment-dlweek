import type { GovernancePermission } from "@/lib/governance";

type PermissionsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  permissions: GovernancePermission[];
};

const stateLabelMap = {
  allowed: "✅ allowed",
  gated: "⚠️ gated",
  blocked: "❌ blocked",
} as const;

const stateStyleMap = {
  allowed: "text-emerald-200 border-emerald-300/30 bg-emerald-300/8",
  gated: "text-amber-200 border-amber-300/30 bg-amber-300/8",
  blocked: "text-white/70 border-white/20 bg-white/[0.02]",
} as const;

export function PermissionsModal({
  isOpen,
  onClose,
  permissions,
}: PermissionsModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-xl border border-white/12 bg-[#060606] p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Permissions Matrix</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/80 hover:bg-white/[0.08]"
          >
            Close
          </button>
        </div>

        <div className="space-y-2">
          {permissions.map((permission) => (
            <div
              key={permission.category}
              className="grid grid-cols-1 gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 md:grid-cols-[minmax(0,180px)_1fr_auto] md:items-center"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-white/75">
                {permission.category}
              </p>
              <p className="text-xs text-white/80">{permission.label}</p>
              <span
                className={`inline-flex w-fit rounded-full border px-2 py-0.5 text-[11px] font-medium ${stateStyleMap[permission.state]}`}
              >
                {stateLabelMap[permission.state]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
