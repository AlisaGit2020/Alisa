# Käytä Node.js -pohjaista kuvaa
FROM node:20.6.1

# Aseta työskentelyhakemisto Docker-kontissa
WORKDIR /app

# Kopioi package.json- ja package-lock.json-tiedostot konttiin
COPY ./package*.json ./

# Asenna sovelluksen riippuvuudet
RUN npm install

# Kopioi lähdekoodi konttiin
COPY ./src ./

# Käännä TypeScript-koodi
RUN npm run build

# Määritä ympäristömuuttujat, jos tarpeen
# ENV KEY=VALUE

# Määritä sovelluksen käynnistyskomento
CMD ["npm", "start"]