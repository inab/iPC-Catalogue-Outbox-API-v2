FROM node:13.13.0-alpine

WORKDIR /app

COPY . .

RUN npm install

CMD ["npm", "run", "dev"]
