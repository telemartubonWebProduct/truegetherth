// The only Supabase project this repository may push migrations to.
export const DEV_PROJECT_REF = "wdcbbjvxrcxuaabcipqo";
// Organization telemart-ubon. Projects in any other organization (including truefiberhome) are refused.
export const DEV_ORGANIZATION_ID = "pfvlbpujcoqiqziehstu";

/**
 * The dev project's entry in `supabase projects list -o json` (an array of projects, or an
 * object holding one), as the signed-in account sees it.
 *
 * @param {unknown} listing
 * @returns {unknown} the entry, or null when the account cannot see the dev project
 */
export function devProjectIn(listing) {
  const projects = Array.isArray(listing) ? listing : /** @type {{ projects?: unknown } | null} */ (listing)?.projects;
  if (!Array.isArray(projects)) return null;
  return projects.find((project) => typeof project === "object" && project !== null && (project.ref ?? project.id) === DEV_PROJECT_REF) ?? null;
}

/**
 * Checks a project, as the Management API's `GET /v1/projects/{ref}` or the CLI's project
 * listing describes it, against the dev target.
 *
 * @param {unknown} project
 * @returns {string | null} why the project is refused, or null when it is the dev project
 */
export function devTargetProblem(project) {
  if (typeof project !== "object" || project === null) {
    return "the Management API did not return a project";
  }
  const { ref, id, organization_id: organizationId, organization_slug: organizationSlug } =
    /** @type {Record<string, unknown>} */ (project);

  const actualRef = ref ?? id;
  if (actualRef !== DEV_PROJECT_REF) {
    return `the Management API returned project '${String(actualRef)}', expected '${DEV_PROJECT_REF}'`;
  }

  const organizations = [organizationId, organizationSlug].filter((value) => value != null);
  if (!organizations.includes(DEV_ORGANIZATION_ID)) {
    const actual = organizations.map(String).join(" / ") || "unknown";
    return `project ${DEV_PROJECT_REF} belongs to organization '${actual}', expected '${DEV_ORGANIZATION_ID}' (telemart-ubon)`;
  }
  return null;
}
