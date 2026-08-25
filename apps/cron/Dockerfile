FROM node:24-alpine AS base
WORKDIR /code

# Prunes to this app, so an unrelated workspace does not invalidate this layer.
FROM base AS turbo

COPY . .

RUN npx turbo@^2 prune @propsim/cron --docker

FROM base AS deps

# Manifests only, so this layer is keyed on the lockfile.
COPY --from=turbo /code/out/json .
COPY --from=turbo /code/out/package-lock.json ./package-lock.json

# --ignore-scripts because the root `prepare` runs `lefthook install`, which
# needs a .git directory the image does not have.
RUN npm ci --ignore-scripts

FROM deps AS prod-deps

RUN npm prune --workspaces --include-workspace-root --omit=dev

FROM deps AS build

COPY --from=turbo /code/out/full .

RUN npm run build -- --filter=@propsim/cron

FROM base AS runtime
WORKDIR /code/apps/cron

RUN apk add --no-cache libc6-compat dumb-init

COPY --chown=node:node --from=prod-deps /code/node_modules /code/node_modules
COPY --chown=node:node --from=prod-deps /code/apps/cron/package.json ./package.json
COPY --chown=node:node --from=build /code/apps/cron/build ./build

ARG COMMIT_SHA
ENV COMMIT_SHA=$COMMIT_SHA
ARG BUILD_TIMESTAMP
ENV BUILD_TIMESTAMP=$BUILD_TIMESTAMP
ENV NODE_ENV=production

# Nothing listens. It wakes on a schedule, so there is no port to expose and no
# route to it.
USER node

# PID 1, so SIGTERM reaches node instead of timing out on recreate.
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "start"]
