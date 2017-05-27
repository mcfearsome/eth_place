FROM node:boron

# Create app directory
RUN mkdir -p /usr/src/daemon
WORKDIR /usr/src/daemon

# Install app dependencies
COPY package.json /usr/src/daemon/
RUN npm install

# Bundle app source
COPY ./daemon /usr/src/daemon

RUN chmod +x ./bin/ethplace-daemon
CMD ./bin/ethplace-daemon 
