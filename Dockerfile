FROM nginx:alpine

COPY build/ /usr/share/nginx/html

RUN chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 8080 443
