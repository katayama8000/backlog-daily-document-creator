#!/usr/bin/env -S deno run --allow-env --allow-net

/**
 * Backlog Daily Document Creator
 * Creates daily activity log documents automatically via Backlog API
 */

interface BacklogConfig {
  host: string;
  apiKey: string;
  projectIdOrKey: string;
  parentDocumentId?: string;
}

interface ProjectResponse {
  id: number;
  projectKey: string;
  name: string;
}

interface DocumentResponse {
  id: number;
  projectId: number;
  title: string;
  content: string;
  createdUser: {
    id: number;
    name: string;
  };
  created: string;
  updated: string;
}

const REQUIRED_ENV_VARS = [
  "BACKLOG_HOST",
  "BACKLOG_API_KEY",
  "BACKLOG_PROJECT_ID_OR_KEY",
] as const;

function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !Deno.env.get(key));
  if (missing.length > 0) {
    console.error("Missing required environment variables:");
    missing.forEach((key) => console.error(`  - ${key}`));
    Deno.exit(1);
  }
}

function getConfig(): BacklogConfig {
  return {
    host: Deno.env.get("BACKLOG_HOST")!,
    apiKey: Deno.env.get("BACKLOG_API_KEY")!,
    projectIdOrKey: Deno.env.get("BACKLOG_PROJECT_ID_OR_KEY")!,
    parentDocumentId: Deno.env.get("BACKLOG_PARENT_DOCUMENT_ID"),
  };
}

async function getProjectId(
  config: BacklogConfig,
): Promise<number> {
  const url = new URL(
    `https://${config.host}/api/v2/projects/${config.projectIdOrKey}`,
  );
  url.searchParams.set("apiKey", config.apiKey);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to get project info: ${response.status} ${response.statusText}\n${errorText}`,
    );
  }

  const project: ProjectResponse = await response.json();
  return project.id;
}

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDayOfWeek(date: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[date.getDay()];
}

function generateDocumentContent(): string {
  const now = new Date();
  return `

## Today's Schedule
-

## Notes


## Issues / Next Actions


---
*Auto-generated: ${now.toISOString()}*
`;
}

async function createDocument(
  config: BacklogConfig,
  projectId: number,
  title: string,
  content: string,
): Promise<DocumentResponse> {
  const url = new URL(`https://${config.host}/api/v2/documents`);
  url.searchParams.set("apiKey", config.apiKey);

  const body = new URLSearchParams({
    projectId: String(projectId),
    title: title,
    content: content,
  });

  if (config.parentDocumentId) {
    body.set("parentId", config.parentDocumentId);
  }

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}\n${errorText}`,
    );
  }

  return await response.json();
}

async function main() {
  console.log("Backlog Daily Document Creator");
  console.log("=".repeat(50));

  validateEnv();
  const config = getConfig();

  const today = getTodayString();
  const now = new Date();
  const dayOfWeek = getDayOfWeek(now);
  const title = `${today} (${dayOfWeek}) Activity Log`;
  const content = generateDocumentContent();

  console.log(`Date: ${today} (${dayOfWeek})`);
  console.log(`Title: ${title}`);
  console.log(`Host: ${config.host}`);
  console.log(`Project: ${config.projectIdOrKey}`);
  if (config.parentDocumentId) {
    console.log(`Parent Document ID: ${config.parentDocumentId}`);
  }
  console.log();

  try {
    console.log("Getting project ID...");
    const projectId = await getProjectId(config);
    console.log(`Project ID: ${projectId}`);

    console.log("Creating document...");
    const result = await createDocument(config, projectId, title, content);
    console.log("Document created successfully!");
    console.log(`Document ID: ${result.id}`);
    console.log(
      `URL: https://${config.host}/documents/${result.id}`,
    );
  } catch (error) {
    console.error("Failed to create document:", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}
