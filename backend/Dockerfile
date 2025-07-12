# Use the official Node.js runtime as base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
# This is done before copying the rest of the code for better caching
COPY package*.json ./

# Install ALL dependencies (including devDependencies for development)
RUN npm ci

# Install NestJS CLI globally for development
RUN npm install -g @nestjs/cli

# Copy the rest of the application code
COPY . .

# Generate Prisma client (important for NestJS + Prisma)
RUN npx prisma generate

# Create uploads directory for file uploads (if needed)
RUN mkdir -p uploads

# Expose the port your app runs on
EXPOSE 3000

# Command to run the application in development mode
# This will be overridden by docker-compose command
CMD ["npm", "run", "start:dev"]