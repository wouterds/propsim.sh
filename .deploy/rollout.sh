#!/usr/bin/env sh
#
# Replaces the web containers one at a time. While one is down the other is
# still in nginx's upstream, so the site keeps answering through the swap.
#
# Run from the directory holding docker-compose.yml.

set -eu

PREFIX=sh.propsim
WAIT_SECONDS=120

log() { echo "==> $*"; }

wait_until_green() {
  service=$1
  container="${PREFIX}--${service}"
  waited=0

  while [ "$waited" -lt "$WAIT_SECONDS" ]; do
    status=$(docker inspect -f '{{.State.Health.Status}}' "$container" 2>/dev/null || echo missing)

    case "$status" in
      healthy)
        log "$service is green after ${waited}s"
        return 0
        ;;
      unhealthy)
        log "$service went red"
        docker logs --tail 50 "$container" || true
        return 1
        ;;
    esac

    sleep 2
    waited=$((waited + 2))
  done

  log "$service never went green in ${WAIT_SECONDS}s (last status: ${status})"
  docker logs --tail 50 "$container" || true
  return 1
}

# Stop it, throw it away, start the new image in its place, and do not come back
# until it answers its own health check.
roll() {
  service=$1

  log "replacing $service"
  docker compose up -d --force-recreate --no-deps "$service"
  wait_until_green "$service"

  # nginx resolves an upstream name once, when the config loads. The replacement
  # container comes back on a different address, so without this the traffic
  # keeps going to one that is gone.
  log "pointing nginx at the new $service"
  docker exec "${PREFIX}--nginx" nginx -s reload
}

log "pulling images"
docker compose pull

# Anything new in the compose file, and anything orphaned by it, without
# disturbing what is already running.
log "settling everything that is not a web container"
docker compose up -d --no-recreate --remove-orphans
docker compose up -d --no-deps cron redis

roll web-1
roll web-2

log "done"
docker compose ps
