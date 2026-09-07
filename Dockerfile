FROM node:22.23.2-bookworm-slim@sha256:83f487e0a63425e5b4d146fb5e5be574bcbe1b7b843d3ebafdd95eaf7767a7e5
RUN npm install --global pnpm@12.3.4
ENV PNPM_HOME=/pnpm
WORKDIR /workspace
USER node
