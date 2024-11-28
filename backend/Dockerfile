# Use Node 18 alpine as parent image
FROM node:18-alpine

# Change the working directory on the Docker image to /app
WORKDIR /app

# Copy package.json and package-lock.json to the /app directory
# COPY package*.json ./

# Install dependencies
# RUN npm install

# Copy the rest of project files into this image
COPY . .
RUN npm install


# Compile TypeScript files
# RUN npm run build

# Expose application port
EXPOSE 8080

# Start the application
CMD ["npm", "run", "start"]
