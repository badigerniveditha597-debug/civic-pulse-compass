import { useSyncExternalStore } from "react";

export const CATEGORIES = ["Road Damage", "Garbage", "Waterlogging", "Streetlight", "Water Supply", "Other"] as const;
export const STATUSES = ["Pending", "In Progress", "Resolved"] as const;
export const PRIORITIES = ["Critical", "High", "Medium", "Low"] as const;
export const DEPARTMENTS = [
  "Public Works (Roads)",
  "Sanitation & Waste",
  "Storm Water Drainage",
  "Electrical & Lighting",
  "Water Supply Board",
  "General Administration",
] as const;

export type Category = (typeof CATEGORIES)[number];
export type Status = (typeof STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];

export interface TimelineEvent { at: string; label: string }
export interface Complaint {
  id: string;
  name: string;
  title: string;
  description: string;
  category: Category;
  location: string;
  area: string;
  image?: string | undefined;
  status: Status;
  priority: Priority;
  aiScore: number;
  aiReason: string;
  department?: string | undefined;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEvent[];
}

const DEFAULT_DEPT: Record<Category, string> = {
  "Road Damage": "Public Works (Roads)",
  Garbage: "Sanitation & Waste",
  Waterlogging: "Storm Water Drainage",
  Streetlight: "Electrical & Lighting",
  "Water Supply": "Water Supply Board",
  Other: "General Administration",
};
export const suggestDepartment = (c: Category) => DEFAULT_DEPT[c];

const CRITICAL_WORDS = ["accident", "injur", "danger", "live wire", "electrocut", "collapse", "flood", "sewage", "contaminat", "hospital", "school", "fire", "children", "death"];
const HIGH_WORDS = ["days", "week", "overflow", "smell", "dark", "no water", "blocked", "traffic", "deep", "mosquito", "elderly", "broken"];
const CATEGORY_BASE: Record<Category, number> = {
  "Road Damage": 45, Garbage: 35, Waterlogging: 50, Streetlight: 35, "Water Supply": 50, Other: 25,
};

/** Rule-based "AI" triage: scores urgency 0-100 from category and keywords. */
export function triage(category: Category, title: string, description: string): { priority: Priority; score: number; reason: string } {
  const text = `${title} ${description}`.toLowerCase();
  let score = CATEGORY_BASE[category];
  const hitsC = CRITICAL_WORDS.filter((w) => text.includes(w));
  const hitsH = HIGH_WORDS.filter((w) => text.includes(w));
  score += hitsC.length * 18 + hitsH.length * 8;
  score = Math.min(100, score);
  const priority: Priority = score >= 80 ? "Critical" : score >= 60 ? "High" : score >= 40 ? "Medium" : "Low";
  const signals = [...hitsC, ...hitsH];
  const reason = signals.length
    ? `Detected risk signals: ${signals.map((s) => `"${s}"`).join(", ")} in a ${category} report.`
    : `Standard ${category} report with no urgent risk signals.`;
  return { priority, score, reason };
}

export function extractArea(location: string) {
  const parts = location.split(",").map((p) => p.trim()).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 2] : parts[0] || "Unknown";
}

export function generateId(existing: Set<string>) {
  let id = "";
  do {
    id = `CP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  } while (existing.has(id));
  return id;
}

// ---------- Sample data ----------
type Seed = [string, string, string, Category, string, Status, number, string?];
const SEEDS: Seed[] = [
  ["Ramesh Kumar", "Deep pothole causing accidents near flyover", "A large pothole about 2 feet wide has formed. Two bike accidents happened this week, riders were injured.", "Road Damage", "Outer Ring Road, Marathahalli, Bengaluru", "Pending", 1],
  ["Anita Sharma", "Garbage not collected for 5 days", "Garbage bins overflowing at the corner, bad smell and mosquito breeding near the park.", "Garbage", "4th Cross, Jayanagar, Bengaluru", "In Progress", 2, "Sanitation & Waste"],
  ["", "Live wire hanging from streetlight pole", "An electric wire is hanging low from the pole near the school gate. Very dangerous for children.", "Streetlight", "School Road, Indiranagar, Bengaluru", "In Progress", 0, "Electrical & Lighting"],
  ["Mohammed Irfan", "Road flooded after light rain", "Waterlogging every time it rains, knee-deep water, traffic blocked for hours.", "Waterlogging", "Silk Board Junction, BTM Layout, Bengaluru", "Pending", 1],
  ["Priya Nair", "No water supply for 3 days", "No water in our apartment block for three days. Elderly residents are struggling.", "Water Supply", "8th Main, Koramangala, Bengaluru", "Pending", 0],
  ["Suresh Reddy", "Streetlights not working on main road", "Entire stretch of 10 streetlights is dark at night, unsafe for women walking.", "Streetlight", "100 Feet Road, Indiranagar, Bengaluru", "Resolved", 9, "Electrical & Lighting"],
  ["Lakshmi Devi", "Contaminated drinking water", "Tap water is muddy and has a sewage smell. Several people fell sick.", "Water Supply", "Gandhi Nagar, Whitefield, Bengaluru", "In Progress", 3, "Water Supply Board"],
  ["", "Broken footpath tiles", "Footpath tiles are broken and uneven near the bus stop.", "Road Damage", "MG Road, Shivajinagar, Bengaluru", "Resolved", 14, "Public Works (Roads)"],
  ["Arjun Menon", "Garbage dumped on vacant plot", "People are dumping garbage on an empty plot next to residential houses.", "Garbage", "HSR Sector 2, HSR Layout, Bengaluru", "Pending", 4],
  ["Kavya Rao", "Drain overflowing near hospital", "Storm drain blocked and sewage overflowing onto the road in front of the hospital entrance.", "Waterlogging", "Hosur Road, Koramangala, Bengaluru", "Pending", 0],
  ["Vikram Singh", "Stray cattle on highway stretch", "Stray cattle sitting in the middle of the road at night.", "Other", "Tumkur Road, Yeshwanthpur, Bengaluru", "Resolved", 20, "General Administration"],
  ["Deepa Joshi", "Low water pressure in mornings", "Water pressure is very low between 6 and 9 AM.", "Water Supply", "2nd Stage, BTM Layout, Bengaluru", "Resolved", 11, "Water Supply Board"],
  ["", "Streetlight flickering", "One streetlight outside house no. 45 keeps flickering.", "Streetlight", "3rd Block, Jayanagar, Bengaluru", "Pending", 2],
  ["Rahul Verma", "Speed breaker damaged", "Speed breaker paint is gone and it is broken in parts.", "Road Damage", "Varthur Road, Whitefield, Bengaluru", "In Progress", 5, "Public Works (Roads)"],
  ["Fatima Begum", "Garbage burning in open", "Someone is burning garbage every evening, smoke enters homes, children coughing.", "Garbage", "Frazer Town, Shivajinagar, Bengaluru", "Pending", 1],
  ["Naveen Gowda", "Underpass waterlogged", "Underpass full of water for a week, vehicles stuck.", "Waterlogging", "KR Puram, Marathahalli, Bengaluru", "Resolved", 16, "Storm Water Drainage"],
];

function buildSeed(): Complaint[] {
  const now = Date.parse("2026-10-30T06:00:00Z"); // fixed anchor keeps SSR and browser identical
  return SEEDS.map(([name, title, description, category, location, status, daysAgo, department], i) => {
    const t = triage(category, title, description);
    const created = new Date(now - daysAgo * 86400000 - i * 3600000).toISOString();
    const timeline: TimelineEvent[] = [{ at: created, label: "Complaint submitted" }];
    if (department) timeline.push({ at: created, label: `Assigned to ${department}` });
    if (status !== "Pending") timeline.push({ at: created, label: "Status changed to In Progress" });
    if (status === "Resolved") timeline.push({ at: new Date(now - Math.max(0, daysAgo - 2) * 86400000).toISOString(), label: "Status changed to Resolved" });
    return {
      id: `CP-2026-${String(482100 + i * 137).padStart(6, "0")}`,
      name, title, description, category, location, area: extractArea(location),
      status, priority: t.priority, aiScore: t.score, aiReason: t.reason, department,
      createdAt: created, updatedAt: timeline[timeline.length - 1]!.at, timeline,
    };
  });
}

// ---------- Store (localStorage, frontend-only) ----------
const KEY = "civicpulse.complaints.v1";
const MINE_KEY = "civicpulse.mine.v1";
const SEED = buildSeed();
let cache: Complaint[] | null = null;
let mineCache: string[] | null = null;
const listeners = new Set<() => void>();

function load(): Complaint[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Complaint[]) : SEED;
  } catch {
    cache = SEED;
  }
  return cache;
}
function loadMine(): string[] {
  if (mineCache) return mineCache;
  try { mineCache = JSON.parse(localStorage.getItem(MINE_KEY) || "[]"); } catch { mineCache = []; }
  return mineCache!;
}
function save(next: Complaint[]) {
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* quota */ }
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };

export function useComplaints() {
  return useSyncExternalStore(subscribe, load, () => SEED);
}
const EMPTY: string[] = [];
export function useMyComplaintIds() {
  return useSyncExternalStore(subscribe, loadMine, () => EMPTY);
}

export function addComplaint(input: { name: string; title: string; description: string; category: Category; location: string; image?: string | undefined }) {
  const all = load();
  const t = triage(input.category, input.title, input.description);
  const now = new Date().toISOString();
  const c: Complaint = {
    ...input,
    id: generateId(new Set(all.map((x) => x.id))),
    area: extractArea(input.location),
    status: "Pending", priority: t.priority, aiScore: t.score, aiReason: t.reason,
    createdAt: now, updatedAt: now, timeline: [{ at: now, label: "Complaint submitted" }],
  };
  mineCache = [c.id, ...loadMine()];
  try { localStorage.setItem(MINE_KEY, JSON.stringify(mineCache)); } catch { /* ignore */ }
  save([c, ...all]);
  return c;
}

export function updateComplaint(id: string, patch: Partial<Pick<Complaint, "status" | "department" | "priority">>) {
  const now = new Date().toISOString();
  save(load().map((c) => {
    if (c.id !== id) return c;
    const events: TimelineEvent[] = [];
    if (patch.status && patch.status !== c.status) events.push({ at: now, label: `Status changed to ${patch.status}` });
    if (patch.department && patch.department !== c.department) events.push({ at: now, label: `Assigned to ${patch.department}` });
    if (patch.priority && patch.priority !== c.priority) events.push({ at: now, label: `Priority set to ${patch.priority}` });
    return { ...c, ...patch, updatedAt: now, timeline: [...c.timeline, ...events] };
  }));
}

export function resetDemoData() {
  mineCache = [];
  try { localStorage.removeItem(MINE_KEY); } catch { /* ignore */ }
  save(buildSeed());
}

export function countBy<T extends string>(list: Complaint[], key: (c: Complaint) => T) {
  const m = new Map<T, number>();
  list.forEach((c) => m.set(key(c), (m.get(key(c)) || 0) + 1));
  return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
