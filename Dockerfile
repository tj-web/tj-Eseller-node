# Use a specific Node.js version for reproducibility.
# Using alpine for a smaller image size.
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
# This is done separately to take advantage of Docker's layer caching.
# The npm install step will only be re-run if these files change.
COPY package*.json ./

# Install dependencies. `npm ci` is generally recommended for production
# as it's faster and safer than `npm install`. It requires a package-lock.json.
RUN npm ci

RUN npm install -g nodemon


# Copy the rest of your application's source code
COPY . .

# Expose the port the app runs on.
# Make sure this matches the port in your application's configuration.
EXPOSE 3000

# The command to start your application.
# This directly starts your index.js file.
# Start the app using nodemon
CMD ["nodemon", "src/index.js"]