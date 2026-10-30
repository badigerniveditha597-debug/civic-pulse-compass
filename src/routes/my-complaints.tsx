import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Inbox, MapPin } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageShell, Panel, PriorityBadge, StatusBadge } from "@/components/civic/ui";
import { formatDate, STATUSES, useComplaints, useMyComplaintIds, type Complaint } from "@/lib/complaints";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/my-complaints")({
  head: () => ({
    meta: [
      { title: "My Complaints — CivicPulse AI" },
      { name: "description", content: "Track the status of your civic complaints by ID." },
      { property: "og:title", content: "My Complaints — CivicPulse AI" },
      { property: "og:description", content: "Track your civic complaint status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyComplaints,
});

function MyComplaints() {
  const all = useComplaints();
  const mine = useMyComplaintIds();
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState<string | null>(null);

  const myList = mine.map((id) => all.find((c) => c.id === id)).filter(Boolean) as Complaint[];
  const found = searched ? all.find((c) => c.id.toLowerCase() === searched.toLowerCase()) : undefined;

  return (
    <PageShell className="max-w-3xl">
      <h1 className="text-3xl font-bold text-navy">My Complaints</h1>
      <p className="mt-1 text-muted-foreground">Track any complaint using its ID.</p>

      <form className="mt-6 flex gap-2" onSubmit={(e) => { e.preventDefault(); setSearched(query.trim()); }}>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Enter complaint ID, e.g. CP-2026-482100" />
        <Button type="submit" disabled={!query.trim()}><Search /> Track</Button>
      </form>
      {searched !== null && (
        <div className="mt-4">
          {found ? <TrackCard c={found} /> : <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No complaint found with ID "{searched}".</p>}
        </div>
      )}

      <h2 className="mt-10 text-lg font-semibold text-navy">Submitted from this device</h2>
      {myList.length === 0 ? (
        <Panel className="mt-3 text-center">
          <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">You haven't submitted any complaints yet.</p>
          <Button asChild className="mt-4"><Link to="/report">Report an issue</Link></Button>
        </Panel>
      ) : (
        <div className="mt-3 space-y-4">{myList.map((c) => <TrackCard key={c.id} c={c} />)}</div>
      )}
    </PageShell>
  );
}

function TrackCard({ c }: { c: Complaint }) {
  const step = STATUSES.indexOf(c.status);
  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-xs font-semibold text-teal">{c.id}</div>
          <h3 className="font-semibold text-navy">{c.title}</h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{c.location}</p>
        </div>
        <div className="flex gap-2"><PriorityBadge priority={c.priority} /><StatusBadge status={c.status} /></div>
      </div>
      <div className="mt-5 flex items-center">
        {STATUSES.map((s, i) => (
          <div key={s} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <span className={cn("grid h-7 w-7 place-items-center rounded-full text-xs font-bold", i <= step ? "bg-teal text-accent-foreground" : "bg-muted text-muted-foreground")}>{i + 1}</span>
              <span className="mt-1 text-[11px] text-muted-foreground">{s}</span>
            </div>
            {i < STATUSES.length - 1 && <div className={cn("mx-2 mb-4 h-0.5 flex-1", i < step ? "bg-teal" : "bg-muted")} />}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
        <span>Department: <b className="text-foreground">{c.department || "Awaiting assignment"}</b></span>
        <span>Updated {formatDate(c.updatedAt)}</span>
      </div>
    </Panel>
  );
}
