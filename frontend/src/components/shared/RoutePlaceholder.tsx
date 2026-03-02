import Link from "next/link";

type RoutePlaceholderProps = {
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function RoutePlaceholder({
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: RoutePlaceholderProps) {
  return (
    <main className="min-h-screen bg-black text-white antialiased">
      <section className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-6 text-center">
        <p className="text-xs uppercase tracking-[0.22em] text-white/65">Workspace</p>
        <h1 className="mt-3 text-4xl font-semibold text-white md:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
          {description}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={primaryHref}
            className="rounded-full border border-white/30 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            {primaryLabel}
          </Link>
          {secondaryHref && secondaryLabel ? (
            <Link
              href={secondaryHref}
              className="rounded-full border border-white/15 bg-white/[0.02] px-5 py-2 text-sm font-medium text-white/85 transition hover:bg-white/8"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}
