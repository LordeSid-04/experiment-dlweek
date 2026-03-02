type FileExplorerProps = {
  files: string[];
  selectedFile: string;
  onSelectFile: (path: string) => void;
};

function getDepth(path: string) {
  return path.split("/").length - 1;
}

export function FileExplorer({ files, selectedFile, onSelectFile }: FileExplorerProps) {
  return (
    <aside className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
        File Explorer
      </h2>
      <div className="mt-3 space-y-1 text-sm text-white/80">
        {files.map((path) => {
          const depth = getDepth(path);
          const isActive = path === selectedFile;
          return (
            <button
              key={path}
              type="button"
              onClick={() => onSelectFile(path)}
              className={`block w-full truncate rounded px-2 py-1 text-left ${
                isActive
                  ? "bg-violet-300/15 text-violet-100"
                  : "text-white/80 hover:bg-white/[0.05]"
              }`}
              style={{ paddingLeft: `${8 + depth * 12}px` }}
              title={path}
            >
              {path}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
