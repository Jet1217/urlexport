FROM node:18-slim

# Install Chromium dependencies
RUN apt-get update \
    && apt-get install -y \
    libglib2.0-0 \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Option 1: Use npm ci for production builds (recommended)
# - Faster and more reliable for CI/CD and production builds
# - Requires package-lock.json
# - Won't modify package files
RUN npm ci

# Option 2: Use npm install for development
# - More flexible for development
# - Can update package files
# - Slower than npm ci
# RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    CHROME_LAUNCH_ARGS="--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage"

# Start application
CMD ["node", "src/index.js"] 