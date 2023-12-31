FROM node:20

WORKDIR /app

COPY ./backend/package*.json ./

RUN npm install

COPY ./backend .

RUN npm run build

CMD [ "npm", "run", "start:dev" ]