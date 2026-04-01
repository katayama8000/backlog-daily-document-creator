#!/usr/bin/env -S deno run --allow-env --allow-net

/**
 * Backlog Daily Document Creator
 * Creates daily activity log documents automatically via Backlog API
 */

interface BacklogConfig {
  host: string;
  apiKey: string;
  projectIdOrKey: string;
  parentFolderId?: string;
}

interface WikiResponse {
  id: number;
  projectId: number;
  name: string;
  content: string;
  createdUser: {
    id: number;
    name: string;
  };
  created: string;
  updated: string;
}

const REQUIRED_ENV_VARS = [
  'BACKLOG_HOST',
  'BACKLOG_API_KEY',
  'BACKLOG_PROJECT_ID_OR_KEY',
] as const;

function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !Deno.env.get(key));
  if (missing.length > 0) {
    console.error('Missing required environment variables:');
    missing.forEach((key) => console.error(`  - ${key}`));
    Deno.exit(1);
  }
}

function getConfig(): BacklogConfig {
  return {
    host: Deno.env.get('BACKLOG_HOST')!,
    apiKey: Deno.env.get('BACKLOG_API_KEY')!,
    projectIdOrKey: Deno.env.get('BACKLOG_PROJECT_ID_OR_KEY')!,
    parentFolderId: Deno.env.get('BACKLOG_PARENT_FOLDER_ID'),
  };
}

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDayOfWeek(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

function generateDocumentContent(): string {
  const now = new Date();
  const today = getTodayString();
  const dayOfWeek = getDayOfWeek(now);

  return `# ${today} (${dayOfWeek}) Activity Log

## Today's Schedule
-

## Completed Tasks


## Notes


## Issues / Next Actions


---
*Auto-generated: ${now.toISOString()}*
`;
}

async function createWikiPage(
  config: BacklogConfig,
  title: string,
  content: string,
): Promise<WikiResponse> {
  const url = new URL(`https://${config.host}/api/v2/wikis`);
  url.searchParams.set('apiKey', config.apiKey);

  const body = new URLSearchParams({
    projectIdOrKey: config.projectIdOrKey,
    name: title,
    content: content,
  });

  if (config.parentFolderId) {
    body.set('parentFolderId', config.parentFolderId);
  }

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
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
  console.log('Backlog Daily Document Creator');
  console.log('='.repeat(50));

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
  if (config.parentFolderId) {
    console.log(`Parent Folder ID: ${config.parentFolderId}`);
  }
  console.log();

  console.log('Creating document...');

  try {
    const result = await createWikiPage(config, title, content);
    console.log('Document created successfully!');
    console.log(`Document ID: ${result.id}`);
    console.log(`URL: https://${config.host}/wiki/${config.projectIdOrKey}/${result.id}`);
  } catch (error) {
    console.error('Failed to create document:', error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}
