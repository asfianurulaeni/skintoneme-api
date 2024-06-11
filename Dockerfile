FROM node:20

WORKDIR /src/app

COPY . .

RUN npm install

CMD ["npm", "run", "start"]