FROM node:20-alpine

# Install Redis inside the container
RUN apk add --no-cache redis

# Set working directory
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy everything else
COPY . .

# Expose server port
EXPOSE 3001

# Start Redis + Server + Worker
CMD ["sh", "/app/start.sh"]
