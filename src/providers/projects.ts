import { execSync } from "child_process";
import { yellow } from "../colors.js";
import { ProjectConfig } from "../config.js";

export interface ProjectItem {
  id: string;
  contentId: string;
  issueNumber: number;
  title: string;
  status: string | null;
  assignees: string[];
  labels: string[];
  url: string;
}

export interface ProjectFieldOption {
  id: string;
  name: string;
}

export interface ProjectField {
  id: string;
  name: string;
  options?: ProjectFieldOption[];
}

export interface ProjectInfo {
  id: string;
  title: string;
  fields: ProjectField[];
}

interface RepoInfo {
  owner: string;
  repo: string;
  isOrg: boolean;
}

function escapeQuery(query: string): string {
  return query.replace(/'/g, "'\\''");
}

function executeGraphQL<T>(query: string): T | undefined {
  try {
    const result = execSync(`gh api graphql -f query='${escapeQuery(query)}'`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    return JSON.parse(result);
  } catch {
    return undefined;
  }
}

export function getRepoInfo(): RepoInfo | undefined {
  try {
    const result = execSync("gh repo view --json owner,name,isInOrganization", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    const data = JSON.parse(result);
    return {
      owner: data.owner.login,
      repo: data.name,
      isOrg: data.isInOrganization,
    };
  } catch {
    return undefined;
  }
}

export function getCurrentUser(): string | undefined {
  try {
    const result = execSync("gh api user --jq '.login'", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    return result || undefined;
  } catch {
    return undefined;
  }
}

export function getProjectInfo(owner: string, projectNumber: number, isOrg: boolean): ProjectInfo | undefined {
  const ownerType = isOrg ? "organization" : "user";
  const query = `
    query {
      ${ownerType}(login: "${owner}") {
        projectV2(number: ${projectNumber}) {
          id
          title
          fields(first: 30) {
            nodes {
              ... on ProjectV2SingleSelectField {
                id
                name
                options {
                  id
                  name
                }
              }
              ... on ProjectV2Field {
                id
                name
              }
            }
          }
        }
      }
    }
  `;

  const result = executeGraphQL<{
    data: {
      [key: string]: {
        projectV2: {
          id: string;
          title: string;
          fields: {
            nodes: Array<{
              id: string;
              name: string;
              options?: Array<{ id: string; name: string }>;
            }>;
          };
        } | null;
      };
    };
  }>(query);

  if (!result?.data) return undefined;

  const projectData = result.data[ownerType]?.projectV2;
  if (!projectData) return undefined;

  return {
    id: projectData.id,
    title: projectData.title,
    fields: projectData.fields.nodes
      .filter((f) => f.id && f.name)
      .map((f) => ({
        id: f.id,
        name: f.name,
        options: f.options?.map((o) => ({ id: o.id, name: o.name })),
      })),
  };
}

export function listProjectItems(
  projectId: string,
  statusFieldName: string
): ProjectItem[] {
  const query = `
    query {
      node(id: "${projectId}") {
        ... on ProjectV2 {
          items(first: 100) {
            nodes {
              id
              fieldValues(first: 20) {
                nodes {
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    name
                    field { ... on ProjectV2SingleSelectField { name } }
                  }
                }
              }
              content {
                ... on Issue {
                  id
                  number
                  title
                  url
                  assignees(first: 10) { nodes { login } }
                  labels(first: 10) { nodes { name } }
                }
              }
            }
          }
        }
      }
    }
  `;

  const result = executeGraphQL<{
    data: {
      node: {
        items: {
          nodes: Array<{
            id: string;
            fieldValues: {
              nodes: Array<{
                name?: string;
                field?: { name: string };
              }>;
            };
            content: {
              id: string;
              number: number;
              title: string;
              url: string;
              assignees: { nodes: Array<{ login: string }> };
              labels: { nodes: Array<{ name: string }> };
            } | null;
          }>;
        };
      };
    };
  }>(query);

  if (!result?.data?.node?.items) return [];

  const items: ProjectItem[] = [];

  for (const node of result.data.node.items.nodes) {
    if (!node.content) continue;

    // Find status field value
    let status: string | null = null;
    for (const fieldValue of node.fieldValues.nodes) {
      if (fieldValue.field?.name === statusFieldName && fieldValue.name) {
        status = fieldValue.name;
        break;
      }
    }

    items.push({
      id: node.id,
      contentId: node.content.id,
      issueNumber: node.content.number,
      title: node.content.title,
      status,
      assignees: node.content.assignees.nodes.map((a) => a.login),
      labels: node.content.labels.nodes.map((l) => l.name),
      url: node.content.url,
    });
  }

  return items;
}

export function updateItemStatus(
  projectId: string,
  itemId: string,
  fieldId: string,
  optionId: string
): boolean {
  const mutation = `
    mutation {
      updateProjectV2ItemFieldValue(
        input: {
          projectId: "${projectId}"
          itemId: "${itemId}"
          fieldId: "${fieldId}"
          value: { singleSelectOptionId: "${optionId}" }
        }
      ) {
        projectV2Item {
          id
        }
      }
    }
  `;

  const result = executeGraphQL<{
    data: {
      updateProjectV2ItemFieldValue: {
        projectV2Item: { id: string } | null;
      };
    };
  }>(mutation);

  return !!result?.data?.updateProjectV2ItemFieldValue?.projectV2Item;
}

export function getIssueNodeId(owner: string, repo: string, issueNumber: number): string | undefined {
  const query = `
    query {
      repository(owner: "${owner}", name: "${repo}") {
        issue(number: ${issueNumber}) {
          id
        }
      }
    }
  `;

  const result = executeGraphQL<{
    data: {
      repository: {
        issue: { id: string } | null;
      };
    };
  }>(query);

  return result?.data?.repository?.issue?.id;
}

export function addIssueToProject(projectId: string, issueNodeId: string): string | undefined {
  const mutation = `
    mutation {
      addProjectV2ItemById(input: { projectId: "${projectId}", contentId: "${issueNodeId}" }) {
        item {
          id
        }
      }
    }
  `;

  const result = executeGraphQL<{
    data: {
      addProjectV2ItemById: {
        item: { id: string } | null;
      };
    };
  }>(mutation);

  return result?.data?.addProjectV2ItemById?.item?.id;
}

export function assignIssue(issueNumber: number, assignee: string): boolean {
  try {
    execSync(`gh issue edit ${issueNumber} --add-assignee "${assignee}"`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return true;
  } catch {
    return false;
  }
}

export interface ProjectContext {
  repoInfo: RepoInfo;
  projectInfo: ProjectInfo;
  statusField: ProjectField;
  statusOptions: Map<string, string>;
}

export function getProjectContext(config: ProjectConfig): ProjectContext | undefined {
  if (!config.enabled) return undefined;

  const repoInfo = getRepoInfo();
  if (!repoInfo) {
    console.error(yellow("Could not determine repository info."));
    return undefined;
  }

  const projectInfo = getProjectInfo(repoInfo.owner, config.number, repoInfo.isOrg);
  if (!projectInfo) {
    console.error(yellow(`Project #${config.number} not found. Check project.number in config.`));
    return undefined;
  }

  const statusField = projectInfo.fields.find((f) => f.name === config.statusField);
  if (!statusField || !statusField.options) {
    console.error(
      yellow(`Status field "${config.statusField}" not found in project. Available fields: ${projectInfo.fields.map((f) => f.name).join(", ")}`)
    );
    return undefined;
  }

  // Map config status names to option IDs
  const statusOptions = new Map<string, string>();
  for (const [key, configName] of Object.entries(config.statuses)) {
    const option = statusField.options.find((o) => o.name === configName);
    if (option) {
      statusOptions.set(key, option.id);
    } else {
      console.error(
        yellow(`Status "${configName}" not found in project. Available: ${statusField.options.map((o) => o.name).join(", ")}`)
      );
    }
  }

  return {
    repoInfo,
    projectInfo,
    statusField,
    statusOptions,
  };
}

export function moveIssueToStatus(
  issueNumber: number,
  statusKey: "todo" | "inProgress" | "inReview" | "done",
  config: ProjectConfig
): boolean {
  const ctx = getProjectContext(config);
  if (!ctx) return false;

  const optionId = ctx.statusOptions.get(statusKey);
  if (!optionId) {
    console.error(yellow(`Could not find option ID for status "${statusKey}"`));
    return false;
  }

  // Find the item in the project
  const items = listProjectItems(ctx.projectInfo.id, config.statusField);
  const item = items.find((i) => i.issueNumber === issueNumber);

  if (!item) {
    // Issue might not be in project yet - try to add it
    const issueNodeId = getIssueNodeId(ctx.repoInfo.owner, ctx.repoInfo.repo, issueNumber);
    if (!issueNodeId) {
      console.error(yellow(`Could not find issue #${issueNumber}`));
      return false;
    }

    const newItemId = addIssueToProject(ctx.projectInfo.id, issueNodeId);
    if (!newItemId) {
      console.error(yellow(`Could not add issue #${issueNumber} to project`));
      return false;
    }

    return updateItemStatus(ctx.projectInfo.id, newItemId, ctx.statusField.id, optionId);
  }

  return updateItemStatus(ctx.projectInfo.id, item.id, ctx.statusField.id, optionId);
}
