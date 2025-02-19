FROM node:20.18.1-alpine3.19 as builder

# Install git and other necessary tools
RUN apk add --no-cache git

# Set the working directory
WORKDIR /tmp

# Copy only the necessary files temporarily for installation
COPY package.json package-lock.json ./

# Install dependencies in a temporary directory
RUN npm install 

# Stage 2: Final image
FROM node:20.18.1-alpine3.19

# delete CVE
RUN rm -r /usr/local/lib/node_modules/npm/node_modules/cross-spawn/

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set the working directory
WORKDIR /app

# Install TypeScript globally
RUN npm install -g typescript

# Change ownership of the app directory
RUN chown -R appuser:appgroup /app

# Switch to the non-root user
USER appuser

# Set working directory
WORKDIR /app

# Copy the rest of the application files
COPY tsconfig.json healthcheck.js  /app/

COPY ./src /app/src

COPY server.ts /app/server.ts

# Copy node_modules from the builder stage
COPY --from=builder /tmp/node_modules ./node_modules

# Compile TypeScript
RUN rm -rf ./dist && npx tsc

# Start the application
CMD ["node", "./dist/server.js"]
