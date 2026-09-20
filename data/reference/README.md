# Local reference snapshot

Do **not** commit these files. Taxonomy and segment IDs change on the platform.

**Live lookup (analysts):** Discovery MCP `taxonomy` / `taxonomy?sector_slug=…`, or `npm run discovery:lookup -- taxonomy`.

**Local QA only:** after clone, run:

```bash
npm run reference:sync
```

That writes `taxonomy.json`, `valid-sector-ids.json`, and `valid-segment-ids.json` here so `qa_reviewer` can reject guessed IDs. Re-run whenever QA says a slug is not in reference taxonomy.
