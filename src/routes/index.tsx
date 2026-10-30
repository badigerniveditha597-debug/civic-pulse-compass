import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BrainCircuit, Building2, CheckCircle2, ClipboardList, MapPin, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/civic/ui";
import { useComplaints } from "@/lib/complaints";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CivicPulse AI — From Complaints to Action" },
      { name: "description", content: "Report potholes, garbage, waterlogging and more. AI prioritizes every complaint so authorities act faster." },
      { property: "og:title", content: "CivicPulse AI — From Complaints to Action" },
      { property: "og:description", content: "AI-powered civic complaint reporting and resolution platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const all = useComplaints();
  const resolved = all.filter((c) => c.status === "Resolved").length;
  const critical = all.filter((c) => c.priority === "Critical" && c.status !== "Resolved").length;
  return (
    <PageShell className="max-w-none px-0 py-0 sm:px-0">
      <section className="bg-hero grid-dots text-primary-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs font-medium">
              <BrainCircuit className="h-3.5 w-3.5" /> AI-powered smart city platform
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight sm:text-6xl">
              From Complaints<br />to <span className="text-teal">Action.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-primary-foreground/80">
              Report public problems in under a minute. CivicPulse AI triages every complaint by urgency and routes it to the right department.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link to="/report"><Megaphone /> Report an Issue</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <Link to="/admin">Admin Dashboard <ArrowRight /></Link>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 self-center">
            {[
              { label: "Complaints filed", value: all.length },
              { label: "Resolved", value: resolved },
              { label: "Critical open", value: critical },
              { label: "Departments", value: 6 },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 p-6 backdrop-blur">
                <div className="font-display text-4xl font-bold">{s.value}</div>
                <div className="mt-1 text-sm text-primary-foreground/70">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-bold text-navy">How it works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {[
            { icon: ClipboardList, t: "Report", d: "Describe the issue, add a photo and location." },
            { icon: BrainCircuit, t: "AI Triage", d: "Urgency scored and priority assigned instantly." },
            { icon: Building2, t: "Assign", d: "Routed to the responsible department." },
            { icon: CheckCircle2, t: "Resolve", d: "Track progress with your complaint ID." },
          ].map((s, i) => (
            <div key={s.t} className="rounded-xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-teal-soft text-teal"><s.icon className="h-5 w-5" /></span>
                <span className="font-display text-sm font-bold text-muted-foreground">0{i + 1}</span>
              </div>
              <h3 className="mt-4 font-semibold text-navy">{s.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-teal-soft p-8 md:flex-row">
          <div className="flex items-center gap-3">
            <MapPin className="h-6 w-6 text-teal" />
            <p className="font-medium text-navy">Already reported something? Track it with your complaint ID.</p>
          </div>
          <Button asChild><Link to="/my-complaints">Track my complaints</Link></Button>
        </div>
      </section>
    </PageShell>
  );
}
