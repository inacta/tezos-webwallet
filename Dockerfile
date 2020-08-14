# Base container
FROM node:12-alpine as base
RUN apk add --update --no-cache git python make g++

RUN mkdir -p /tezos
WORKDIR /tezos
ADD . /tezos
RUN echo "SKIP_PREFLIGHT_CHECK=true" > /tezos/.env

RUN yarn install --no-cache
RUN yarn build

# Build Nginx Webserver
FROM nginx:1.17-alpine as prod
COPY --from=base /tezos/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
