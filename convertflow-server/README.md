# ConvertFlow Server

Real file-conversion backend for the ConvertFlow frontend. Uses:
- **LibreOffice headless** — docx/xlsx/pptx ↔ pdf
- **poppler-utils** (`pdftoppm`) — pdf → jpg/png
- **img2pdf** — jpg/png → pdf

## Run locally

Requires LibreOffice, poppler-utils, and img2pdf installed on the host (see Dockerfile for exact packages on Linux).

### Windows setup
1. **LibreOffice**: install from https://www.libreoffice.org/download/download/. The server auto-detects `soffice.exe` at the default install path (`C:\Program Files\LibreOffice\program\soffice.exe`). If you installed it elsewhere, set `SOFFICE_PATH` in a `.env` file to the full path.
2. **poppler-utils** (needed for pdf → jpg/png): download Windows binaries from https://github.com/oschwartz10612/poppler-windows/releases, extract them, and add the `Library\bin` folder to your PATH (so `pdftoppm` resolves).
3. **img2pdf** (needed for jpg/png → pdf): `pip install img2pdf`. Requires Python on PATH.

After installing, restart your terminal so PATH changes take effect, then run `npm start` — it logs a warning for any tool it can't find, so you'll see immediately if something's missing instead of failing mid-conversion.

### macOS / Linux
```bash
brew install libreoffice poppler img2pdf   # macOS
# or apt-get install libreoffice poppler-utils python3-pip && pip3 install img2pdf  # Debian/Ubuntu
```

```bash
npm install
npm start
```

Server runs on `http://localhost:3001`.

## API

**POST `/api/convert`** — multipart form: `file` (the upload), `targetFormat` (e.g. `pdf`, `docx`, `jpg`).
Returns `{ downloadUrl, filename }`.

**GET `/api/download/:jobId/:filename`** — streams the converted file, then deletes it.

**GET `/api/health`** — liveness check.

Converted files and uploads are purged automatically after 1 hour.

## Deploy

This needs a real container/VM, not a serverless platform — LibreOffice doesn't run on Vercel/Netlify functions (no filesystem for the LO profile, and conversions can exceed function time limits).

**Recommended: Render, Railway, Fly.io, or a small VPS, using the included Dockerfile.**

```bash
docker build -t convertflow-server .
docker run -p 3001:3001 convertflow-server
```

Railway/Render/Fly all auto-detect the Dockerfile — just connect the repo and deploy.

## Connect the frontend

In the frontend project, set `VITE_API_URL` (see `.env.example`) to this server's public URL, then rebuild.
