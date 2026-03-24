# 1. Use an official Node.js runtime as the base image
# Alpine versions are recommended for smaller, faster builds
FROM node:20-alpine

# 2. Set the working directory inside the container
WORKDIR /usr/src/app

# 3. Copy package.json and package-lock.json
# Doing this first allows Docker to cache dependencies for faster subsequent builds
COPY package*.json ./

# 4. Install production dependencies
# 'npm ci' is preferred for automated environments as it's faster and more reliable
RUN npm ci --only=production

# 5. Copy the rest of your application code
COPY . .

# 6. Expose the port your Express app listens on (common defaults: 5000 or 8000)
EXPOSE 5000

# 7. Define the command to start your application
CMD ["node", "index.js"]
