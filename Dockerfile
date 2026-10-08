# syntax=docker/dockerfile:1.7

FROM node:24.19.0-bookworm-slim

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NEXT_TELEMETRY_DISABLED=1
ENV npm_config_fetch_retries=5 \
    npm_config_fetch_retry_mintimeout=20000 \
    npm_config_fetch_retry_maxtimeout=120000 \
    npm_config_fetch_timeout=600000

RUN corepack enable && corepack prepare pnpm@11.25.0 --activate
WORKDIR /workspace
COPY . .
RUN --mount=type=cache,id=tiffin-pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile
RUN pnpm build

EXPOSE 4411 4412
CMD ["pnpm", "start:customer"]
