# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- Development image (Vite dev server, used by docker-compose.dev.yml) ----
FROM deps AS development
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ---- Build static assets ----
FROM deps AS build
ARG VITE_API_URL=/api
ARG VITE_SHOW_DEMO_ACCOUNTS=true
ENV VITE_API_URL=$VITE_API_URL \
    VITE_SHOW_DEMO_ACCOUNTS=$VITE_SHOW_DEMO_ACCOUNTS
COPY . .
RUN npm run build

# ---- Serve with nginx ----
FROM nginx:1.25-alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=5s --retries=5 CMD wget -qO- http://127.0.0.1/ > /dev/null || exit 1
