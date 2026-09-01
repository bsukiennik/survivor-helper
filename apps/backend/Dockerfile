FROM node:22-alpine

WORKDIR /workspace

RUN corepack enable

COPY package.json pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json

RUN pnpm install --frozen-lockfile || pnpm install

COPY apps/backend ./apps/backend

WORKDIR /workspace/apps/backend

EXPOSE 3000

CMD ["pnpm", "start:docker"]
