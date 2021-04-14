FROM node:12.8-alpine as builder

WORKDIR /app
ENV NODE_ENV=development

COPY package*.json ./
COPY tsconfig*.json ./
COPY .eslintrc.json ./
COPY .eslintignore ./

RUN npm install -g @nestjs/cli
RUN npm install

COPY src/ src/
RUN npm run build



FROM node:12.8-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=2 \
 CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health \
  || exit 1

CMD [ "node", "dist/main.js" ]
