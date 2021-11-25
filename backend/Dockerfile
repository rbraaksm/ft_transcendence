FROM node:14

WORKDIR /transcendance/src/app

COPY package*.json ./

RUN npm install
RUN npm install -g @angular/cli@12.0.0

# RUN npm uninstall bcrypt
# RUN npm i bcrypt

EXPOSE 3000
CMD [ "node", "dist/main" ]