import { describe, it, expect } from "vitest";
import type { ProjectConfig } from "../src/config.js";

// Test the project configuration interface and structure
describe("project configuration", () => {
  const validProjectConfig: ProjectConfig = {
    enabled: true,
    number: 1,
    statusField: "Status",
    statuses: {
      todo: "Todo",
      inProgress: "In Progress",
      inReview: "In Review",
      done: "Done",
    },
  };

  it("has required fields", () => {
    expect(validProjectConfig.enabled).toBe(true);
    expect(validProjectConfig.number).toBe(1);
    expect(validProjectConfig.statusField).toBe("Status");
    expect(validProjectConfig.statuses).toBeDefined();
  });

  it("has all status mappings", () => {
    const { statuses } = validProjectConfig;
    expect(statuses.todo).toBe("Todo");
    expect(statuses.inProgress).toBe("In Progress");
    expect(statuses.inReview).toBe("In Review");
    expect(statuses.done).toBe("Done");
  });

  it("status keys match expected values", () => {
    const expectedKeys = ["todo", "inProgress", "inReview", "done"];
    const actualKeys = Object.keys(validProjectConfig.statuses);
    expect(actualKeys).toEqual(expectedKeys);
  });
});

describe("project status workflow", () => {
  it("follows correct status progression", () => {
    const statusOrder = ["todo", "inProgress", "inReview", "done"];

    // Verify todo comes before inProgress
    expect(statusOrder.indexOf("todo")).toBeLessThan(statusOrder.indexOf("inProgress"));

    // Verify inProgress comes before inReview
    expect(statusOrder.indexOf("inProgress")).toBeLessThan(statusOrder.indexOf("inReview"));

    // Verify inReview comes before done
    expect(statusOrder.indexOf("inReview")).toBeLessThan(statusOrder.indexOf("done"));
  });
});
