###############################################
# Builder stage
# - Install all dependencies
# - Compile TypeScript to ./dist
# - Prune dev dependencies
# Hinweis: Hier wird bewusst npm verwendet; im Runtime-Image wird npm entfernt,
# damit die bekannte Schwachstelle (tar@7.5.1) nicht mehr vorhanden ist.
###############################################
FROM node:24-alpine3.22 AS builder

# Benötigte Tools für Build (z. B. git)
RUN apk add --no-cache git

# Arbeitsverzeichnis setzen
WORKDIR /app

# Nur Manifest-Dateien kopieren und Abhängigkeiten installieren
COPY package.json package-lock.json ./
# Reproduzierbare Installation anhand des Lockfiles
RUN npm ci

# Quellcode und TS-Config kopieren
COPY tsconfig.json ./
COPY server.ts ./
COPY src ./src

# TypeScript kompilieren
RUN npm run build

# Nur Produktionsabhängigkeiten behalten
RUN npm prune --omit=dev

###############################################
# Runtime stage (schlankes Image)
# - Kopiert nur dist/ und prod node_modules
# - Entfernt npm vollständig, um tar aus der Abhängigkeitskette zu eliminieren
###############################################
FROM node:24-alpine3.22 AS runtime

# Systempakete aktualisieren
RUN apk update && apk upgrade --no-cache

# Unnötige/verletzliche npm-Teile entfernen (wir benötigen npm zur Laufzeit nicht)
# Dadurch wird die in Harbor gemeldete Schwachstelle in npm->tar entfernt.
RUN rm -rf /usr/local/lib/node_modules/npm || true

# Non-Root-User anlegen
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Arbeitsverzeichnis
WORKDIR /app

# Artefakte aus dem Builder übernehmen
COPY --chown=appuser:appgroup --from=builder /app/node_modules ./node_modules
COPY --chown=appuser:appgroup --from=builder /app/dist ./dist
COPY --chown=appuser:appgroup --from=builder /app/src ./src
COPY --chown=appuser:appgroup healthcheck.js ./healthcheck.js

# Auf Non-Root wechseln
USER appuser

# Start-Kommando
CMD ["node", "./dist/server.js"]
