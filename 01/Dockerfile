FROM node:lts-slim
WORKDIR /srv
COPY . .
RUN yarn && yarn tsc
EXPOSE 10123
CMD [ "node", "--enable-source-maps", "dist/index.js" ]