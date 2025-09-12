FROM 414751826153.dkr.ecr.ap-southeast-3.amazonaws.com/midas/nodejs:20

# Set the environment to production
ENV NODE_ENV=production

# 2. Use standard working directory
WORKDIR $APP_DIR

# Copy package.json and the lock file first for better caching
COPY package.json ./

# Install dependencies
RUN npm install --omit=dev

COPY . .

RUN chown -R "$APP_USER:$APP_GROUP" "$APP_DIR"

USER $APP_USER

# Expose the application port
EXPOSE 8080

# Define the command to run your application
CMD [ "npm", "start" ]