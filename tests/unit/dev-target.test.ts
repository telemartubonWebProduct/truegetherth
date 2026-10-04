import { describe, expect, it } from "vitest";

import {
  DEV_ORGANIZATION_ID,
  DEV_PROJECT_REF,
  devProjectIn,
  devTargetProblem,
} from "../../scripts/supabase/dev-target.mjs";

describe("dev migration target", () => {
  it("accepts the dev project in the telemart-ubon organization", () => {
    expect(
      devTargetProblem({ ref: DEV_PROJECT_REF, organization_id: DEV_ORGANIZATION_ID, status: "ACTIVE_HEALTHY" }),
    ).toBeNull();
    expect(devTargetProblem({ id: DEV_PROJECT_REF, organization_slug: DEV_ORGANIZATION_ID })).toBeNull();
    expect(
      devTargetProblem({ ref: DEV_PROJECT_REF, organization_id: "7", organization_slug: DEV_ORGANIZATION_ID }),
    ).toBeNull();
  });

  it("refuses a project in any other organization", () => {
    expect(devTargetProblem({ ref: DEV_PROJECT_REF, organization_id: "truefiberhome" })).toMatch(
      /belongs to organization 'truefiberhome'/,
    );
    expect(devTargetProblem({ ref: DEV_PROJECT_REF })).toMatch(/organization 'unknown'/);
  });

  it("refuses a different project or an unexpected response", () => {
    expect(devTargetProblem({ ref: "abcdefghijklmnopqrst", organization_id: DEV_ORGANIZATION_ID })).toMatch(
      /returned project 'abcdefghijklmnopqrst'/,
    );
    expect(devTargetProblem({ organization_id: DEV_ORGANIZATION_ID })).toMatch(/returned project 'undefined'/);
    expect(devTargetProblem(null)).toMatch(/did not return a project/);
    expect(devTargetProblem("wdcbbjvxrcxuaabcipqo")).toMatch(/did not return a project/);
  });

  it("finds the dev project among the projects the signed-in CLI lists, and only that one", () => {
    const dev = { ref: DEV_PROJECT_REF, organization_id: DEV_ORGANIZATION_ID, status: "ACTIVE_HEALTHY" };
    const other = { ref: "abcdefghijklmnopqrst", organization_id: "truefiberhome", status: "ACTIVE_HEALTHY" };
    expect(devProjectIn([other, dev])).toBe(dev);
    expect(devProjectIn({ projects: [dev, other] })).toBe(dev);
    expect(devProjectIn([other])).toBeNull();
    expect(devProjectIn([])).toBeNull();
    expect(devProjectIn(null)).toBeNull();
    expect(devProjectIn("not a list")).toBeNull();
    // Being listed is not enough: a project of that ref in another organization is still refused.
    expect(devTargetProblem(devProjectIn([{ ref: DEV_PROJECT_REF, organization_id: "truefiberhome" }]))).toMatch(/belongs to organization/);
  });
});
