FROM node:24.15.0-alpine AS development

WORKDIR /app

COPY package*.json ./
COPY yarn.lock ./

RUN yarn install

COPY . .

RUN yarn build

FROM node:24.15.0-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app

COPY package*.json ./
COPY yarn.lock ./

RUN yarn install --production

COPY --from=development /app/dist ./dist

ENTRYPOINT ["yarn"]
CMD ["start:prod"]
