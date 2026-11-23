FROM nginx:1.28.0-alpine AS build
RUN apk add --no-cache nodejs npm
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --fetch-retries=1
COPY apps/api/auth.mjs apps/api/desktop-grants.mjs apps/api/desktop-sessions.mjs apps/api/
COPY apps/web apps/web
RUN npm run build
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
RUN addgroup -S triplecode && adduser -S -G triplecode triplecode && chown -R triplecode:triplecode /app
USER triplecode
EXPOSE 3000
ENTRYPOINT []
CMD ["node", "apps/web/run-next.mjs", "start"]
