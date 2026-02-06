FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json .
COPY backend/tsconfig.json .

RUN npm install

COPY backend/. .

RUN npm run build

CMD [ "npm", "run", "start:dev" ]