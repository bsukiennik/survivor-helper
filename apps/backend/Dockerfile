FROM node:22-alpine

WORKDIR /workspace

RUN corepack enable

# Run as the image's built-in non-root `node` user (uid/gid 1000, matching
# most Linux dev hosts' first user) rather than root — least-privilege, and
# it keeps this container's writes into the bind-mounted apps/backend
# (dist/, node_modules/) from landing on the host owned by root, which
# otherwise blocks any `pnpm build`/`pnpm test` run outside Docker.
RUN chown node:node /workspace
USER node

COPY --chown=node:node package.json pnpm-workspace.yaml ./
COPY --chown=node:node apps/backend/package.json ./apps/backend/package.json
COPY --chown=node:node apps/frontend/package.json ./apps/frontend/package.json

RUN pnpm install --frozen-lockfile || pnpm install

COPY --chown=node:node apps/backend ./apps/backend

# `dist/` is an anonymous volume (docker-compose.yml) so tsc's build output
# never lands on the host bind mount. Docker creates a fresh anonymous
# volume's mountpoint as root regardless of USER — pre-creating it here,
# node-owned, while the image still has it, is what makes the volume start
# out node-owned too (Docker copies the image's existing directory content/
# ownership into a new anonymous volume; an empty root:root directory is
# what you get otherwise).
RUN mkdir -p apps/backend/dist

WORKDIR /workspace/apps/backend

EXPOSE 3000

CMD ["pnpm", "start:docker"]
