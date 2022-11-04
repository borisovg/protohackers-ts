FROM node:lts-slim
WORKDIR /srv
COPY package.json .
RUN yarn
COPY . .
RUN yarn tsc
EXPOSE 10123/udp
CMD [ "node", "--enable-source-maps", "dist/index.js" ]