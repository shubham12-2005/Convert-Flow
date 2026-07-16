FROM node:20-bookworm-slim

# LibreOffice (office <-> pdf), poppler-utils (pdftoppm: pdf -> jpg/png), zip (multi-page output)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice \
    poppler-utils \
    zip \
    python3-pip \
    && pip3 install --no-cache-dir --break-system-packages img2pdf \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .

RUN mkdir -p uploads converted

EXPOSE 3001
CMD ["node", "server.js"]
