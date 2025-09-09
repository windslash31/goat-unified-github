# packages/client/Dockerfile

# --- Stage 1: Build the React Application ---
    FROM node:20-alpine AS builder

    # Set the working directory
    WORKDIR /app
    
    # Copy package.json and lock file first to leverage Docker cache
    COPY package.json package-lock.json* ./
    RUN npm install
    
    # Copy the rest of the client source code
    COPY . .
    
    # IMPORTANT: Accept a build-time argument for the API URL
    ARG VITE_API_BASE_URL
    ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
    ENV VITE_IMAGE_MODE=production
    
    # Build the application
    RUN npm run build
    
    
    # --- Stage 2: Serve the application with Nginx ---
    FROM nginx:1.27-alpine
    
    # Copy the build output from the builder stage
    COPY --from=builder /app/build /usr/share/nginx/html
    
    # Copy our custom Nginx configuration
    COPY nginx.conf /etc/nginx/conf.d/default.conf
    
    # Expose port 80 to the outside world
    EXPOSE 80
    
    # Command to run Nginx in the foreground
    CMD ["nginx", "-g", "daemon off;"]