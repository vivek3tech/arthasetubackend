# Use Node.js base image
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .
COPY secrets/serviceAccountKey.json ./secrets/serviceAccountKey.json

# Expose port
EXPOSE 8080
CMD [ "node", "contacts.js" ]