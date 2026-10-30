import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Clock, FileText, Loader, RotateCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageShell, Panel, PriorityBadge, StatCard, StatusBadge, selectClass } from "@/components/civic/ui";
import { CATEGORIES, countBy, formatDate, PRIORITIES, resetDemoData, STATUSES, useComplaints, type Priority } from "@/lib/complaints";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — CivicPulse AI" },
      { name: "description", content: "Prioritize, assign and resolve civic complaints with AI-driven insights." },
      { property: "og:title", content: "Admin Dashboard — CivicPulse AI" },
      { property: "og:description", content: "Civic complaint analytics and management." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminDashboard,
});

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--muted-foreground)"];
const PRIORITY_RANK: Record<Priority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
type Quick = "all" | "Pending" | "In Progress" | "Resolved" | "critical";

function AdminDashboard() {
  const all = useComplaints();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [area, setArea] = useState("");
  const [sort, setSort] = useState<"priority" | "newest">("priority");
  const [quick, setQuick] = useState<Quick>("all");

  const areas = useMemo(() => [...new Set(all.map((c) => c.area))].sort(), [all]);
  const stats = {
    total: all.length,
    pending: all.filter((c) => c.status === "Pending").length,
    progress: all.filter((c) => c.status === "In Progress").length,
    resolved: all.filter((c) => c.status === "Resolved").length,
    critical: all.filter((c) => c.priority === "Critical" && c.status !== "Resolved").length,
  };
  const byCategory = countBy(all, (c) => c.category);
  const byArea = countBy(all, (c) => c.area);

  const list = useMemo(() => {
    const s = q.toLowerCase();
    return all
      .filter((c) => !s || [c.id, c.title, c.location, c.name, c.description].some((f) => f.toLowerCase().includes(s)))
      .filter((c) => !status || c.status === status)
      .filter((c) => !category || c.category === category)
      .filter((c) => !priority || c.priority === priority)
      .filter((c) => !area || c.area === area)
      .filter((c) => quick === "all" || (quick === "critical" ? c.priority === "Critical" && c.status !== "Resolved" : c.status === quick))
      .sort((a, b) => sort === "newest" ? b.createdAt.localeCompare(a.createdAt) : PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || b.aiScore - a.aiScore);
  }, [all, q, status, category, priority, area, quick, sort]);

  const clear = () => { setQ(""); setStatus(""); setCategory(""); setPriority(""); setArea(""); setQuick("all"); };
  const filtered = q || status || category || priority || area || quick !== "all";

  return (
    <PageShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-navy">Admin Dashboard</h1>
          <p className="text-muted-foreground">Real-time overview of civic complaints</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { resetDemoData(); clear(); toast.success("Demo data restored"); }}>
          <RotateCcw /> Reset demo data
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total" value={stats.total} icon={<FileText className="h-4 w-4" />} tone="bg-primary/10 text-navy" active={quick === "all"} onClick={() => setQuick("all")} />
        <StatCard label="Pending" value={stats.pending} icon={<Clock className="h-4 w-4" />} tone="bg-medium/20 text-foreground" active={quick === "Pending"} onClick={() => setQuick("Pending")} />
        <StatCard label="In Progress" value={stats.progress} icon={<Loader className="h-4 w-4" />} tone="bg-teal-soft text-teal" active={quick === "In Progress"} onClick={() => setQuick("In Progress")} />
        <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle2 className="h-4 w-4" />} tone="bg-success/15 text-success" active={quick === "Resolved"} onClick={() => setQuick("Resolved")} />
        <StatCard label="Critical" value={stats.critical} icon={<AlertTriangle className="h-4 w-4" />} tone="bg-critical/10 text-critical" active={quick === "critical"} onClick={() => setQuick("critical")} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Category-wise complaints">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="h-56 w-full sm:w-1/2">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                    {byCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="w-full space-y-2 sm:w-1/2">
              {byCategory.map((c, i) => (
                <li key={c.name}>
                  <button className="flex w-full items-center justify-between rounded-md px-2 py-1 text-sm hover:bg-muted" onClick={() => setCategory(category === c.name ? "" : c.name)}>
                    <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />{c.name}</span>
                    <b className="text-navy">{c.value}</b>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
        <Panel title="Location-wise complaints">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={byArea} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="value" name="Complaints" fill="var(--chart-2)" radius={[0, 4, 4, 0]} onClick={(d: { name?: string }) => d.name && setArea(area === d.name ? "" : d.name)} className="cursor-pointer" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel className="mt-6" title={`Complaints (${list.length})`} action={filtered ? <Button variant="ghost" size="sm" onClick={clear}>Clear filters</Button> : undefined}>
        <div className="grid gap-2 md:grid-cols-6">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ID, title, location…" />
          </div>
          <select aria-label="Status" className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select aria-label="Category" className={selectClass} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>{CATEGORIES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select aria-label="Priority" className={selectClass} value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="">All priorities</option>{PRIORITIES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select aria-label="Area" className={selectClass} value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">All areas</option>{areas.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          Sort by
          <select aria-label="Sort" className="rounded border border-input bg-background px-2 py-1" value={sort} onChange={(e) => setSort(e.target.value as "priority" | "newest")}>
            <option value="priority">AI priority</option><option value="newest">Newest</option>
          </select>
        </div>

        {list.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No complaints match these filters.</p>
        ) : (
          <>
            <div className="mt-4 hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <tr><th className="py-2">ID</th><th>Complaint</th><th>Category</th><th>Area</th><th>Priority</th><th>Status</th><th>Filed</th><th /></tr>
                </thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="py-3 font-mono text-xs text-teal">{c.id}</td>
                      <td className="max-w-xs truncate pr-3 font-medium text-navy">{c.title}</td>
                      <td>{c.category}</td>
                      <td>{c.area}</td>
                      <td><PriorityBadge priority={c.priority} /></td>
                      <td><StatusBadge status={c.status} /></td>
                      <td className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(c.createdAt)}</td>
                      <td><Button asChild size="sm" variant="outline"><Link to="/admin/complaint/$id" params={{ id: c.id }}>View</Link></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 space-y-3 md:hidden">
              {list.map((c) => (
                <Link key={c.id} to="/admin/complaint/$id" params={{ id: c.id }} className="block rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between text-xs"><span className="font-mono text-teal">{c.id}</span><PriorityBadge priority={c.priority} /></div>
                  <div className="mt-1 font-medium text-navy">{c.title}</div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground"><span>{c.category} · {c.area}</span><StatusBadge status={c.status} /></div>
                </Link>
              ))}
            </div>
          </>
        )}
      </Panel>
    </PageShell>
  );
}
