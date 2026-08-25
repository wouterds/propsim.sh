# propsim.sh

A prop trading simulator. It trades a live futures tape on a short delay against a prop firm's
account rules, so the limits that end a funded account can be met for nothing. Nothing is ordered
and no money is at stake.

## Stack

Turborepo with npm workspaces on Node 24. React Router 8 with SSR, Tailwind 4 and Base UI on the
front. MariaDB through Drizzle. Biome for lint and formatting, Vitest for tests, lefthook and
commitlint on the way in.

| | |
| --- | --- |
| `apps/web` | the site: landing, auth, dashboard, trading screen |
| `packages/datasources` | upstream feeds, normalised to one candle shape |
| `packages/database` | drizzle models and the connection |
| `packages/mail` | react-email templates over the Mailjet send API |

## Getting started

Switch to the node version this repo pins with [nvm](https://github.com/nvm-sh/nvm), then install:

```sh
nvm install
npm install
```

Copy the example environment files and fill them in. `apps/web` needs the database, the Mailjet
keys and two secrets of its own. `packages/database` needs the database only, for the drizzle-kit
scripts.

```sh
cp apps/web/.env.example apps/web/.env
cp packages/database/.env.example packages/database/.env
```

```sh
npm run dev
```

## Commands

Run from the root. Turbo fans them out to every workspace.

```sh
npm run dev          # every app in watch mode
npm run build        # production build
npm run lint         # what the commit hook runs
npm run lint:fix     # lint and format, writes what it can
npm run typecheck    # typegen and tsc
npm test             # vitest everywhere
```

`lint:fix` passing is not `lint` passing. It stays quiet about anything Biome classes as an unsafe
fix, so run `lint` before claiming a change is clean.

## Database

Migrations are generated and applied by hand, never on deploy.

```sh
npm run db:generate --workspace @propsim/database   # diff the schema into src/__migrations
npm run db:migrate  --workspace @propsim/database   # apply it
```

## Email

Preview the templates without sending anything:

```sh
npm run preview --workspace @propsim/mail
```

## Deploy

`.github/workflows/deploy.yml` is manual only. It builds the image, pushes it to ghcr, then copies
`docker-compose.yml` to the host over a Cloudflare tunnel and recreates the container.

```sh
gh workflow run deploy.yml
```
