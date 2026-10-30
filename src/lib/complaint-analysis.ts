import type { Category, Complaint, Priority } from "./complaints";

export interface ScoreFactor { name: string; points: number; maximum: number; explanation: string }
export interface DuplicateMatch { id: string; similarity: number; reason: string }
export interface ComplaintAnalysis {
  category: Category;
  categoryReason: string;
  summary: string;
  score: number;
  priority: Priority;
  reason: string;
  factors: ScoreFactor[];
  duplicates: DuplicateMatch[];
  action: string;
}

const CATEGORY_PATTERNS: Record<Category, RegExp[]> = {
  "Road Damage": [/potholes?/, /road.*(damag|broken|crack)/, /footpath|pavement|speed breaker/],
  Garbage: [/garbage|rubbish|trash|waste|litter/, /bins?.*(overflow|collect)/],
  Waterlogging: [/waterlog|flood|standing water/, /storm drain|drain.*(block|overflow)|underpass.*water/],
  Streetlight: [/street\s*lights?|lamp\s*post|lighting pole/, /live wire|electric.*wire|electrocut/],
  "Water Supply": [/water supply|no water|water pressure|water outage/, /drinking water|tap water|contaminat.*water|water.*contaminat/],
  Other: [],
};

export function categorize(title: string, description: string, fallback: Category = "Other") {
  const text = `${title} ${description}`.toLowerCase();
  const ranked = (Object.entries(CATEGORY_PATTERNS) as [Category, RegExp[]][])
    .map(([category, patterns]) => ({ category, hits: patterns.filter((p) => p.test(text)).length }))
    .sort((a, b) => b.hits - a.hits);
  const best = ranked[0];
  const category = best && best.hits > 0 ? best.category : fallback;
  return { category, categoryReason: best && best.hits > 0
    ? `Issue terms in the title and description identify ${category}.`
    : `No specific issue terms found; ${fallback === "Other" ? "general review required" : "retained the submitted category"}.` };
}

const STOP_WORDS = new Set("a an the is are was were has have had our my at in on to of for and it this that with from very please there about near by been be as we i us but".split(" "));
function tokens(text: string) {
  return new Set(text.toLowerCase().replace(/street\s*lights?/g, "streetlight").replace(/rubbish|trash|litter/g, "garbage")
    .replace(/roadway/g, "road").replace(/\brd\b/g, "road").replace(/\bst\b/g, "street")
    .match(/[a-z0-9]+/g)?.filter((w) => !STOP_WORDS.has(w)).map((w) => w.length > 4 ? w.replace(/(ing|ed|s)$/, "") : w) ?? []);
}
export function textSimilarity(a: string, b: string) {
  const left = tokens(a), right = tokens(b);
  if (!left.size || !right.size) return 0;
  return 2 * [...left].filter((w) => right.has(w)).length / (left.size + right.size);
}

type ReportInput = Pick<Complaint, "title" | "description" | "category" | "location"> & { id?: string };
function matchingReports(input: ReportInput, existing: Complaint[], category: Category) {
  return existing.filter((c) => c.id !== input.id && c.category === category).map((c) => {
    const description = textSimilarity(input.description, c.description);
    const similarity = description * 0.75 + textSimilarity(input.title, c.title) * 0.25;
    const location = textSimilarity(input.location, c.location);
    const local = input.location.split(",")[0]?.trim().toLowerCase();
    const exactStreet = !!local && local === c.location.split(",")[0]?.trim().toLowerCase();
    return { c, similarity, location, exactStreet };
  }).filter((m) => m.location >= 0.5 && m.similarity >= 0.3);
}

const ACTIONS: Record<Category, string> = {
  "Road Damage": "Inspect the damaged surface, mark the hazard and schedule road or footpath repairs.",
  Garbage: "Inspect the reported site, remove accumulated waste and restore scheduled collection.",
  Waterlogging: "Inspect and clear blocked drains, remove standing water and check drainage capacity.",
  Streetlight: "Send an electrical crew to isolate unsafe wiring and repair the affected lights.",
  "Water Supply": "Inspect the supply network, test water quality where contamination is reported and restore safe supply.",
  Other: "Send a field officer to verify the issue and coordinate the appropriate civic team.",
};

/** Transparent, deterministic local text rules; no external AI service. */
export function analyzeComplaint(input: ReportInput, existing: Complaint[] = []): ComplaintAnalysis {
  const { category, categoryReason } = categorize(input.title, input.description, input.category);
  const text = `${input.title} ${input.description}`.toLowerCase();
  const locationText = `${text} ${input.location.toLowerCase()}`;
  const has = (pattern: RegExp) => pattern.test(text);
  const safety = has(/live wire|electrocut|injur|accident|death|danger|collapse|fire|contaminat|fell sick/) ? 35
    : has(/unsafe|sewage|smoke|burning|mosquito|dark|risk/) ? 20 : 0;
  const severity = has(/live wire|collapse|flood|contaminat|no water|knee.deep|deep pothole|large pothole|dangerous wire/) ? 25
    : has(/broken|block|overflow|damag|pothole|not working|outage|stuck/) ? 15
    : has(/flicker|low pressure|uneven|smell/) ? 5 : 0;
  const number = [...text.matchAll(/\b(\d+)\s*(?:people|residents|families|households|homes|students|children)\b/g)]
    .reduce((max, match) => Math.max(max, Number(match[1])), 0);
  const people = number >= 100 || has(/entire (area|neighbourhood|neighborhood|community)|hundreds|thousands/) ? 20
    : number >= 10 || has(/apartment|many people|several people|residents|families|children|crowd/) ? 10 : number > 1 ? 5 : 0;
  const sensitive = /school|hospital|playground|bus stop|highway|elderly|children/.test(locationText) ? 10 : 0;
  const matches = matchingReports(input, existing, category);
  const repeatCount = matches.length;
  const recurring = repeatCount >= 3 ? 10 : repeatCount > 0 ? 5 : has(/every (day|night|evening|time)|recurr|again|repeated|for (\d+|three|five|seven) (days|weeks)|for a week/) ? 5 : 0;
  const factors: ScoreFactor[] = [
    { name: "Safety risk", points: safety, maximum: 35, explanation: safety ? "Reported injury, health or safety hazard terms detected." : "No explicit safety hazard reported." },
    { name: "Problem severity", points: severity, maximum: 25, explanation: severity ? "Reported damage or service disruption indicates severity." : "No major damage or service disruption reported." },
    { name: "People affected", points: people, maximum: 20, explanation: number ? `${number} people or households explicitly reported.` : people ? "Group impact described; exact affected count is unknown." : "Affected population not specified; no extra points assumed." },
    { name: "Location sensitivity", points: sensitive, maximum: 10, explanation: sensitive ? "A school, hospital, transport site or vulnerable group is mentioned." : "No sensitive site or vulnerable group mentioned." },
    { name: "Recurring complaints", points: recurring, maximum: 10, explanation: repeatCount ? `${repeatCount} related report(s) in this location.` : recurring ? "Repeated or prolonged occurrence described." : "No recurrence signal or related report found." },
  ];
  const score = factors.reduce((sum, f) => sum + f.points, 0);
  const priority: Priority = score >= 80 ? "Critical" : score >= 60 ? "High" : score >= 40 ? "Medium" : "Low";
  const sentences = input.description.trim().match(/[^.!?]+[.!?]?/g) ?? [];
  const selected = sentences.map((sentence, index) => ({ sentence: sentence.trim(), index, weight: /risk|injur|danger|people|children|no water|block|overflow|broken|contaminat/i.test(sentence) ? 2 : 1 }))
    .sort((a, b) => b.weight - a.weight || a.index - b.index).slice(0, 2).sort((a, b) => a.index - b.index).map((s) => s.sentence).join(" ");
  const summary = selected.length > 220 ? `${selected.slice(0, 217).replace(/\s+\S*$/, "")}…` : selected || input.title.trim();
  const duplicates = matches.filter((m) => m.similarity >= (m.exactStreet || m.location >= 0.85 ? 0.4 : 0.65))
    .sort((a, b) => b.similarity - a.similarity).slice(0, 5)
    .map((m) => ({ id: m.c.id, similarity: Math.round(m.similarity * 100), reason: `Similar description and title, same ${category} category, ${m.exactStreet ? "same street/address" : "overlapping location"}.` }));
  return { category, categoryReason, summary, score, priority, factors, duplicates,
    reason: `${score}/100 — ${factors.map((f) => `${f.name}: ${f.points}/${f.maximum}`).join("; ")}.`,
    action: `${priority === "Critical" ? "Urgent: secure the site and dispatch an emergency inspection. " : ""}${ACTIONS[category]}` };
}