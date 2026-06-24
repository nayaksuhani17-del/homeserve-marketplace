"use client";

import { useState, type ReactNode } from "react";

type SectionProps = {
  id?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
};

export function Section({
  id,
  title,
  description,
  action,
  children,
  collapsible = false,
  defaultOpen = true,
  className = "",
}: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section id={id} className={`scroll-mt-24 ${className}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="section-title">{title}</h2>
          {description && <p className="section-desc">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {action}
          {collapsible && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="btn-ghost text-xs"
            >
              {open ? "Hide" : "Show"}
            </button>
          )}
        </div>
      </div>
      {(!collapsible || open) && <div className="mt-5">{children}</div>}
    </section>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="text-sm font-medium text-green-700">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-desc">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function QuickNav({ links }: { links: { href: string; label: string }[] }) {
  if (links.length === 0) return null;
  return (
    <nav
      aria-label="Page sections"
      className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm"
    >
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-green-700"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
