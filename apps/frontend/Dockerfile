FROM node:22-alpine

WORKDIR /workspace

RUN corepack enable

# See apps/backend/Dockerfile for why this runs as the non-root `node` user.
RUN chown node:node /workspace
USER node

COPY --chown=node:node package.json pnpm-workspace.yaml ./
COPY --chown=node:node apps/backend/package.json ./apps/backend/package.json
COPY --chown=node:node apps/frontend/package.json ./apps/frontend/package.json

RUN pnpm install --frozen-lockfile || pnpm install

COPY --chown=node:node apps/frontend ./apps/frontend

WORKDIR /workspace/apps/frontend

EXPOSE 5173

CMD ["pnpm", "dev", "--host"]
