import { Link } from "@tanstack/react-router";
import { Activity, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Priority, Status } from "@/lib/complaints";

const NAV = [
  { to: "/report", label: "Report Issue" },
  { to: "/my-complaints", label: "My Complaints" },
  { to: "/admin", label: "Admin Dashboard" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-hero text-primary-foreground">
            <Activity className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-bold text-navy">
            CivicPulse <span className="text-teal">AI</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground" activeProps={{ className: "bg-secondary text-secondary-foreground" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <button className="rounded-md p-2 md:hidden" aria-label="Toggle menu" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <nav className="border-t border-border px-4 py-2 md:hidden">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-sm font-medium" activeProps={{ className: "bg-secondary text-secondary-foreground" }}>
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className={cn("mx-auto max-w-7xl px-4 py-8 sm:px-6", className)}>{children}</main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        CivicPulse AI — From Complaints to Action.
      </footer>
    </div>
  );
}

const PRIORITY_STYLE: Record<Priority, string> = {
  Critical: "bg-critical/10 text-critical border-critical/30",
  High: "bg-high/10 text-high border-high/30",
  Medium: "bg-medium/15 text-foreground border-medium/40",
  Low: "bg-low/10 text-low border-low/30",
};
export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold", PRIORITY_STYLE[priority])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {priority}
    </span>
  );
}

const STATUS_STYLE: Record<Status, string> = {
  Pending: "bg-muted text-muted-foreground",
  "In Progress": "bg-secondary text-secondary-foreground",
  Resolved: "bg-success/15 text-success",
};
export function StatusBadge({ status }: { status: Status }) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_STYLE[status])}>{status}</span>;
}

export function Panel({ title, children, className, action }: { title?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-5 shadow-card", className)}>
      {title && (
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-navy">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({ label, value, icon, tone, active, onClick }: { label: string; value: number; icon: ReactNode; tone: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={cn("rounded-xl border bg-card p-4 text-left shadow-card transition hover:-translate-y-0.5", active ? "border-teal ring-2 ring-teal/30" : "border-border")}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className={cn("grid h-8 w-8 place-items-center rounded-lg", tone)}>{icon}</span>
      </div>
      <div className="mt-2 font-display text-3xl font-bold text-navy">{value}</div>
    </button>
  );
}

export const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
