
FROM node:22-bookworm-slim

RUN npm install -g @angular/cli

WORKDIR /app

EXPOSE 4200

CMD ["sh", "-c", "if [ -f package.json ]; then npm start -- --host 0.0.0.0; else echo 'Inicializa Angular en /app antes de iniciar el servidor'; sleep infinity; fi"]
