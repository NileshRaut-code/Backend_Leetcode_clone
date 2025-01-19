FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN apk add --no-cache redis

EXPOSE 3000 6379

COPY start.sh /usr/src/app/start.sh
RUN chmod +x /usr/src/app/start.sh

CMD ["sh", "/usr/src/app/start.sh"]


