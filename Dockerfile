# Use Node.js LTS version
FROM node:20-alpine

# Create app directory and set permissions
RUN mkdir -p /app && \
    addgroup -S appgroup && \
    adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /app

# Set working directory
WORKDIR /app

# Copy package files
COPY --chown=appuser:appgroup package*.json ./

# Install dependencies as non-root user
USER appuser
RUN npm install --production

# Copy application code
COPY --chown=appuser:appgroup . .

# Set environment variables
ENV NODE_ENV=production

# Ensure the user is set to appuser
USER appuser

# Set the entrypoint to run the application
ENTRYPOINT ["node", "main.js"] 