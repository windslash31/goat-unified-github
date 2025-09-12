FROM 414751826153.dkr.ecr.ap-southeast-3.amazonaws.com/midas/nodejs:20 AS builder

WORKDIR $APP_DIR

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# API URL
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_IMAGE_MODE=production

# Build the static files
RUN npm run build


# nginx + debian
FROM 414751826153.dkr.ecr.ap-southeast-3.amazonaws.com/midas/debian:12

# Update and install Nginx
RUN apt-get update && apt-get install -y nginx --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Command to run Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]