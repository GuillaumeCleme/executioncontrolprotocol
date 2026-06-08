# Supabase (browser-demo prompt logging)

Remote-only setup for the `ecp_browser_demo_prompts` table used by `@ecp/browser-demo`.

## One-time setup

```sh
npx supabase login
npx supabase link --project-ref dxcjedxzianiyzxlfefj
npm run supabase:push
```

Link state is stored under `supabase/.temp/` (gitignored). Each developer runs `link` once.

## Scripts (from repo root)

| Script | Description |
| ------ | ----------- |
| `npm run supabase:push` | Apply pending migrations to the linked remote project |
| `npm run supabase:status` | List applied vs pending migrations |
| `npm run supabase:types` | Generate TypeScript types from the linked remote schema |

## App env

Copy `apps/browser-demo/.env.example` to `apps/browser-demo/.env` and set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
