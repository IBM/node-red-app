FROM registry.access.redhat.com/ubi8:8.4

SHELL ["/bin/bash", "-o", "pipefail", "-c"]
RUN curl -sL https://rpm.nodesource.com/setup_14.x | bash -
RUN yum install -y nodejs make gcc-c++
RUN mkdir /app
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --only=prod
COPY . .
ENV NODE_ENV production
ENV PORT 3000
EXPOSE 3000
CMD ["npm", "start"]
