
FROM registry.access.redhat.com/ubi8/nodejs-14:1

RUN mkdir -p /opt/app-root/src
WORKDIR /opt/app-root/src
COPY package.json /opt/app-root/src
RUN npm install --only=prod
COPY . .

ENV NODE_ENV production
ENV PORT 3000
EXPOSE 3000

CMD ["npm", "start"]
