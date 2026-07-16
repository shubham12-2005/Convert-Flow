import express from 'express'
import multer from 'multer'
import cors from 'cors'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import os from 'os'

const execAsync = promisify(exec)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// LibreOffice's CLI binary isn't called the same thing -- or reliably on PATH --
// across platforms. Resolve it once at startup instead of assuming `soffice` works.
function resolveSofficeBinary() {
  if (process.env.SOFFICE_PATH) return `"${process.env.SOFFICE_PATH}"`

  if (os.platform() === 'win32') {
    const candidates = [
      'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
      'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
    ]
    const found = candidates.find((p) => existsSync(p))
    if (found) return `"${found}"`
    console.warn(
      '[convertflow-server] Could not find soffice.exe in the usual install locations.\n' +
      '  Install LibreOffice from https://www.libreoffice.org/download/download/\n' +
      '  or set SOFFICE_PATH in a .env file to its exact location.'
    )
    return 'soffice' // fall through to PATH, will error clearly if missing
  }

  if (os.platform() === 'darwin') {
    const macPath = '/Applications/LibreOffice.app/Contents/MacOS/soffice'
    if (existsSync(macPath)) return `"${macPath}"`
  }

  return 'soffice' // Linux, or already on PATH
}

const SOFFICE_BIN = resolveSofficeBinary()

// Fail loudly at startup if a required tool is missing, instead of a confusing
// error mid-conversion. pdftoppm and img2pdf aren't on PATH by default on Windows.
async function checkDependency(name, cmd) {
  try {
    await execAsync(cmd)
    return true
  } catch {
    console.warn(`[convertflow-server] '${name}' not found or not working. Conversions needing it will fail.`)
    return false
  }
}

async function checkDependencies() {
  await checkDependency('LibreOffice', `${SOFFICE_BIN} --version`)
  await checkDependency('pdftoppm (poppler-utils)', 'pdftoppm -v')
  await checkDependency('img2pdf', 'img2pdf --version')
}

const UPLOAD_DIR = path.join(__dirname, 'uploads')
const OUTPUT_DIR = path.join(__dirname, 'converted')
for (const dir of [UPLOAD_DIR, OUTPUT_DIR]) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

const app = express()
app.use(cors())

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB, matches the UI copy
})

// Formats LibreOffice's --convert-to filter handles directly (office docs <-> pdf)
const OFFICE_FORMATS = new Set(['pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'odt', 'ods', 'odp'])
const IMAGE_FORMATS = new Set(['jpg', 'jpeg', 'png'])

function jobDirFor(jobId) {
  return path.join(OUTPUT_DIR, jobId)
}

async function convertWithLibreOffice(inputPath, targetFormat, outDir) {
  // soffice is single-instance by default; --convert-to runs headless and exits when done.
  const cmd = `${SOFFICE_BIN} --headless --norestore --convert-to ${targetFormat} --outdir "${outDir}" "${inputPath}"`
  await execAsync(cmd, { timeout: 60_000 })
  const base = path.basename(inputPath, path.extname(inputPath))
  return path.join(outDir, `${base}.${targetFormat}`)
}

async function convertPdfToImage(inputPath, outDir, format) {
  const prefix = path.join(outDir, 'page')
  const flag = format === 'png' ? '-png' : '-jpeg'
  await execAsync(`pdftoppm ${flag} -r 150 "${inputPath}" "${prefix}"`, { timeout: 60_000 })
  const files = (await fs.readdir(outDir)).filter((f) => f.startsWith('page'))
  if (files.length === 0) throw new Error('PDF rasterization produced no pages')
  if (files.length === 1) {
    const single = path.join(outDir, `result.${format}`)
    await fs.rename(path.join(outDir, files[0]), single)
    return { filePath: single, multiple: false }
  }
  // Multiple pages: zip them up
  const zipPath = path.join(outDir, 'pages.zip')
  await execAsync(`cd "${outDir}" && zip -j "${zipPath}" ${files.map((f) => `"${f}"`).join(' ')}`)
  return { filePath: zipPath, multiple: true }
}

async function convertImageToPdf(inputPath, outDir) {
  const outPath = path.join(outDir, 'result.pdf')
  await execAsync(`img2pdf "${inputPath}" -o "${outPath}"`, { timeout: 30_000 })
  return outPath
}

app.post('/api/convert', upload.single('file'), async (req, res) => {
  const { targetFormat } = req.body
  const file = req.file

  if (!file) return res.status(400).json({ error: 'No file uploaded.' })
  if (!targetFormat) return res.status(400).json({ error: 'targetFormat is required.' })

  const target = targetFormat.toLowerCase().replace('.', '')
  const sourceExt = path.extname(file.originalname).slice(1).toLowerCase()
  const jobId = path.basename(file.path)
  const outDir = jobDirFor(jobId)
  mkdirSync(outDir, { recursive: true })

  // Multer drops the upload without an extension; the conversion tools need one.
  const renamedInput = path.join(UPLOAD_DIR, `${jobId}.${sourceExt}`)
  await fs.rename(file.path, renamedInput)

  try {
    let resultPath
    let resultName

    if (IMAGE_FORMATS.has(sourceExt) && target === 'pdf') {
      resultPath = await convertImageToPdf(renamedInput, outDir)
      resultName = `${path.parse(file.originalname).name}.pdf`
    } else if (sourceExt === 'pdf' && IMAGE_FORMATS.has(target)) {
      const { filePath, multiple } = await convertPdfToImage(renamedInput, outDir, target === 'png' ? 'png' : 'jpg')
      resultPath = filePath
      resultName = multiple ? 'pages.zip' : `${path.parse(file.originalname).name}.${target}`
    } else if (OFFICE_FORMATS.has(sourceExt) && OFFICE_FORMATS.has(target)) {
      resultPath = await convertWithLibreOffice(renamedInput, target, outDir)
      resultName = `${path.parse(file.originalname).name}.${target}`
    } else {
      return res.status(400).json({ error: `Conversion from .${sourceExt} to .${target} isn't supported.` })
    }

    res.json({
      downloadUrl: `/api/download/${jobId}/${encodeURIComponent(path.basename(resultPath))}`,
      filename: resultName,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Conversion failed. The file may be corrupted or password-protected.' })
  } finally {
    fs.unlink(renamedInput).catch(() => {})
  }
})

app.get('/api/download/:jobId/:filename', async (req, res) => {
  const { jobId, filename } = req.params
  const filePath = path.join(jobDirFor(jobId), filename)
  if (!existsSync(filePath)) return res.status(404).json({ error: 'File not found or expired.' })
  res.download(filePath, filename, (err) => {
    if (!err) {
      // Clean up after a successful download — files don't need to live longer than that.
      fs.rm(jobDirFor(jobId), { recursive: true, force: true }).catch(() => {})
    }
  })
})

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

// Purge anything older than 1 hour, matching the UI's stated retention policy.
setInterval(async () => {
  const now = Date.now()
  for (const dir of [UPLOAD_DIR, OUTPUT_DIR]) {
    const entries = await fs.readdir(dir).catch(() => [])
    for (const entry of entries) {
      const full = path.join(dir, entry)
      const stat = await fs.stat(full).catch(() => null)
      if (stat && now - stat.mtimeMs > 60 * 60 * 1000) {
        fs.rm(full, { recursive: true, force: true }).catch(() => {})
      }
    }
  }
}, 15 * 60 * 1000)

const PORT = process.env.PORT || 3001
checkDependencies().then(() => {
  app.listen(PORT, () => console.log(`ConvertFlow API running on http://localhost:${PORT}`))
})
