
FROM node:14

WORKDIR /transcendance/frontend/src/app

COPY package*.json ./

RUN npm install
RUN npm install -g @angular/cli@12.0.0

COPY . .

# RUN npm run build

EXPOSE 4200