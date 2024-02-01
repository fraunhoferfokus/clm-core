FROM node:20.5.1-alpine

COPY . /app

WORKDIR /app

RUN npm i
RUN npm install -g typescript
RUN tsc
