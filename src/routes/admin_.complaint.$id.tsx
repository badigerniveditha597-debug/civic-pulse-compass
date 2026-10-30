import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BrainCircuit, Calendar, MapPin, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PageShell, Panel, PriorityBadge, StatusBadge, selectClass } from "@/components/civic/ui";
import { DEPARTMENTS, formatDate, PRIORITIES, STATUSES, suggestDepartment, updateComplaint, useComplaints, type Priority, type Status } from "@/lib/complaints";

export const Route = createFileRoute("/admin_/complaint/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Complaint ${params.id} — CivicPulse AI` },
      { name: "description", content: "Complaint details, AI triage, department assignment and status." },
      { property: "og:title", content: `Complaint ${params.id} — CivicPulse AI` },
      { property: "og:description", content: "Civic complaint details." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Details,
});

function Details() {
  const { id } = Route.useParams();
  const c = useComplaints().find((x) => x.id === id);
  const [status, setStatus] = useState<Status>("Pending");
  const [dept, setDept] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");

  useEffect(() => {
    if (c) { setStatus(c.status); setDept(c.department || ""); setPriority(c.priority); }
  }, [c]);

  if (!c) {
    return (
      <PageShell className="max-w-xl text-center">
        <h1 className="text-2xl font-bold text-navy">Complaint not found</h1>
        <Button asChild className="mt-4"><Link to="/admin">Back to dashboard</Link></Button>
      </PageShell>
    );
  }
  const dirty = status !== c.status || dept !== (c.department || "") || priority !== c.priority;
  const suggested = suggestDepartment(c.category);

  return (
    <PageShell className="max-w-5xl">
      <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm text-teal">{c.id}</span>
        <PriorityBadge priority={c.priority} /><StatusBadge status={c.status} />
      </div>
      <h1 className="mt-1 text-2xl font-bold text-navy sm:text-3xl">{c.title}</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Details">
            <p className="text-sm leading-relaxed">{c.description}</p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <Info icon={<User className="h-4 w-4" />} label="Citizen" value={c.name || "Anonymous"} />
              <Info icon={<Calendar className="h-4 w-4" />} label="Filed" value={formatDate(c.createdAt)} />
              <Info icon={<MapPin className="h-4 w-4" />} label="Location" value={c.location} />
              <Info icon={<BrainCircuit className="h-4 w-4" />} label="Category" value={c.category} />
            </dl>
            {c.image && <img src={c.image} alt="Complaint" className="mt-4 max-h-80 rounded-lg border border-border object-cover" />}
          </Panel>
          <Panel title="AI triage">
            <div className="flex items-center gap-4">
              <div className="font-display text-4xl font-bold text-navy">{c.aiScore}<span className="text-base text-muted-foreground">/100</span></div>
              <div className="h-2 flex-1 rounded-full bg-muted"><div className="h-2 rounded-full bg-hero" style={{ width: `${c.aiScore}%` }} /></div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{c.aiReason}</p>
            <p className="mt-1 text-sm">Suggested department: <b className="text-navy">{suggested}</b></p>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Manage">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Assign department</Label>
                <select className={selectClass} value={dept} onChange={(e) => setDept(e.target.value)}>
                  <option value="">Unassigned</option>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                </select>
                {dept !== suggested && <button type="button" className="text-xs font-medium text-teal hover:underline" onClick={() => setDept(suggested)}>Use AI suggestion</button>}
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value as Status)}>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority override</Label>
                <select className={selectClass} value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                  {PRIORITIES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <Button className="w-full" disabled={!dirty} onClick={() => {
                updateComplaint(c.id, { status, priority, department: dept || undefined });
                toast.success("Complaint updated");
              }}>Save changes</Button>
            </div>
          </Panel>
          <Panel title="Timeline">
            <ol className="space-y-3 border-l-2 border-border pl-4">
              {[...c.timeline].reverse().map((t, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-background bg-teal" />
                  <div className="text-sm font-medium">{t.label}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(t.at)}</div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="mt-0.5 text-teal">{icon}</span>
      <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-medium">{value}</dd></div>
    </div>
  );
}
