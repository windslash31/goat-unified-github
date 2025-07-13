# Use an official Node.js 20 runtime as a parent image
FROM node:20-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# --- ADD THIS LINE ---
# Set the environment to production
ENV NODE_ENV=production

# Copy package.json and the lock file
# This is done first to leverage Docker's caching for faster builds
COPY package.json ./

# Install dependencies, omitting development-only packages
RUN npm install --omit=dev

# Copy the rest of your application's source code into the image
COPY . .

# Cloud Run provides the PORT environment variable, defaulting to 8080.
# This makes your application's port available.
EXPOSE 8080

# Define the command to run your application
CMD [ "npm", "start" ]