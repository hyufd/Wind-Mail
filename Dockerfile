# Use Node.js LTS (Iron) as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (caching layer)
COPY package*.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]