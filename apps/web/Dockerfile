FROM node:24-alpine AS base
WORKDIR /code

# Reduces the monorepo to just this app and whatever it depends on, so the rest
# of the workspace does not invalidate the dependency layer on every change.
FROM base AS turbo

COPY . .

RUN npx turbo@^2 prune @propsim/web --docker

FROM base AS deps

# out/json is the manifests-only tree, so this layer is keyed on the lockfile
# rather than on any source file.
COPY --from=turbo /code/out/json .
COPY --from=turbo /code/out/package-lock.json ./package-lock.json

# --ignore-scripts because the root manifest's `prepare` runs `lefthook
# install`, which needs a .git directory that an image deliberately does not
# have, and npm fails the whole install when it exits non-zero. The only other
# install scripts in the lockfile are lefthook's own and fsevents', a darwin
# package, so nothing this image runs is skipped.
RUN npm ci --ignore-scripts

# A branch off deps rather than a second install: the runtime gets production
# node_modules without resolving the tree twice.
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

# Nothing in the app reads it. It is here so a running container can say which
# commit it came from without a tag lookup.
ARG COMMIT_SHA
ENV COMMIT_SHA=$COMMIT_SHA
ENV PORT=3000
ENV HOST=0.0.0.0
ENV NODE_ENV=production

USER node
EXPOSE $PORT

# PID 1, so SIGTERM reaches node and a recreate does not sit through the ten
# second kill timeout.
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "start"]
