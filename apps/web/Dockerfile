FROM node:25-alpine AS base
WORKDIR /code

# Prunes to this app, so an unrelated workspace does not invalidate this layer.
FROM base AS turbo

COPY . .

RUN npx turbo@^2 prune @propsim/web --docker

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

RUN npm run build -- --filter=@propsim/web

FROM base AS runtime
WORKDIR /code/apps/web

RUN apk add --no-cache libc6-compat dumb-init

COPY --chown=node:node --from=prod-deps /code/node_modules /code/node_modules
COPY --chown=node:node --from=prod-deps /code/apps/web/package.json ./package.json
COPY --chown=node:node --from=build /code/apps/web/build ./build

ARG COMMIT_SHA
ENV COMMIT_SHA=$COMMIT_SHA
ENV PORT=3000
ENV HOST=0.0.0.0
ENV NODE_ENV=production

USER node
EXPOSE $PORT

# PID 1, so SIGTERM reaches node instead of timing out on recreate.
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "start"]
