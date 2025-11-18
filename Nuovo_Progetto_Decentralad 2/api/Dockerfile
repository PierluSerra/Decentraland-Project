FROM node:20-alpine
WORKDIR /srv
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 8787
CMD ["node","server.js"]
