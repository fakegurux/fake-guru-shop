FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY server.js .
RUN mkdir -p public/uploads data
COPY index.html public/
COPY admin.html public/
COPY products.json data/
EXPOSE 3000
CMD ["node", "server.js"]
