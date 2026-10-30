import { describe, expect, it } from "vitest";
import { triage, extractArea } from "@/lib/complaints";

describe("AI triage", () => {
  it("marks dangerous reports near schools as Critical", () => {
    expect(triage("Streetlight", "Live wire", "Dangerous wire near school, children at risk").priority).toBe("Critical");
  });
  it("marks plain reports without risk signals as Low", () => {
    expect(triage("Other", "Request", "Please repaint the bench").priority).toBe("Low");
  });
  it("extracts area from address", () => {
    expect(extractArea("Main Rd, Jayanagar, Bengaluru")).toBe("Jayanagar");
  });
});
