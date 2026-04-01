# Backlog Daily Document Creator

Automatically creates daily activity log documents in Backlog using GitHub Actions and Deno.

## Features

- Automatically creates Backlog documents at specified times
- Template-based activity log format
- Lightweight implementation using Deno and Backlog API
- Fully automated with GitHub Actions
- No additional dependencies required

## Requirements

- Deno 2.x
- Backlog API key
- GitHub repository (for Actions)

## Setup

### 1. Get Backlog API Key

1. Log in to Backlog
2. Go to Personal Settings → API
3. Click "Add new API key"
4. Copy and save the API key

### 2. Find Required Backlog Information

You'll need the following information:

- **BACKLOG_HOST**: Your space URL (e.g., `your-space.backlog.jp`)
- **BACKLOG_API_KEY**: Your API key
- **BACKLOG_PROJECT_ID_OR_KEY**: Project key (e.g., `DEMO`)
- **BACKLOG_PARENT_FOLDER_ID**: Parent folder ID (optional)

### 3. Local Testing

```bash
# Create environment file
cp .env.example .env

# Edit .env with your actual values
vi .env

# Run the script
deno task create
```

### 4. Configure GitHub Actions

1. Go to your GitHub repository Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `BACKLOG_HOST`: Your Backlog host URL
   - `BACKLOG_API_KEY`: Your Backlog API key
   - `BACKLOG_PROJECT_ID_OR_KEY`: Project key
   - `BACKLOG_PARENT_FOLDER_ID`: Parent folder ID (optional)

### 5. Customize Schedule

To change the execution time, edit the cron setting in `.github/workflows/daily-document.yml`:

```yaml
schedule:
  # Run at JST 09:00 (UTC 00:00) every day
  - cron: '0 0 * * *'
```

Cron format: `'minute hour day month day_of_week'` (UTC time)

Examples:

- JST 09:00 → UTC 00:00 → `'0 0 * * *'`
- JST 18:00 → UTC 09:00 → `'0 9 * * *'`
- JST 22:00 → UTC 13:00 → `'0 13 * * *'`

## Usage

### Automatic Execution

GitHub Actions will automatically run at the scheduled time.

### Manual Execution

Go to the Actions tab in your GitHub repository, select the `Create Daily Backlog Document` workflow, and click "Run workflow".

### Local Execution

```bash
deno task create
```

## Generated Document Format

The following format will be created:

```markdown
# 2026-04-01 (Tue) Activity Log

## Today's Schedule

-

## Completed Tasks

## Notes

## Issues / Next Actions

---

_Auto-generated: 2026-04-01T00:00:00.000Z_
```

## Troubleshooting

### Authentication Error

- Verify that your API key is correct
- Check that the API key has the necessary permissions

### Folder Not Found

- Verify that BACKLOG_PARENT_FOLDER_ID is correct
- Check that you have access permissions to that folder

### API Request Failed

- Check your network connection
- Verify that the Backlog host URL is correct
- Ensure the project key exists and you have access

## Customization

### Change Document Template

Edit the `generateDocumentContent()` function in `create_daily_document.ts`.

### Change Title Format

Modify the title generation logic in `create_daily_document.ts`.

## Project Structure

```
backlog-daily-document/
├── .env.example                # Environment variables template
├── .github/
│   └── workflows/
│       └── daily-document.yml  # GitHub Actions workflow
├── .gitignore                  # Git ignore rules
├── create_daily_document.ts    # Main script (Deno)
├── deno.json                   # Deno configuration
└── README.md                   # This file
```

## API Reference

This project uses the Backlog API:

- Endpoint: `POST /api/v2/wikis`
- Documentation: https://developer.nulab.com/docs/backlog/

## License

MIT

## Links

- [Backlog API Documentation](https://developer.nulab.com/docs/backlog/)
- [Deno](https://deno.land/)
- [GitHub Actions](https://docs.github.com/en/actions)
