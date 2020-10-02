FROM node:12

USER root

# copy source files
COPY public /tmp/public
COPY src /tmp/src
COPY package.json /tmp/package.json
COPY tsconfig.json /tmp/tsconfig.json

# install build dependencies
RUN apt-get update && apt-get install -y build-essential git libusb-1.0-0 libusb-1.0-0-dev nginx

# install dependencies
WORKDIR /tmp
RUN npm i

# build application
RUN npm run build:bamboo

# copy build to nginx and remove tmp folder
RUN cp -r build/* /usr/share/nginx/html
RUN cp -r build/* /var/www/html/
RUN rm -rf /tmp/{*,.*}

# Remove the default Nginx configuration file
RUN rm -v /etc/nginx/nginx.conf

# Copy a configuration file from the current directory
ADD nginx.conf /etc/nginx/

# Append "daemon off;" to the beginning of the configuration
RUN echo "daemon off;" >> /etc/nginx/nginx.conf

# Set the default command to execute
# when creating a new container
CMD service nginx start

RUN chmod 755 -R /usr/share/nginx/html/
RUN chmod 755 -R /var/www/html/
EXPOSE 8080 443
