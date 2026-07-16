import { useState, useRef } from 'react'
import { UploadCloud, ArrowRight, Zap, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

const FORMAT_PAIRS = [
  ['PDF', 'Word (.docx)', 'docx'],
  ['Word (.docx)', 'PDF', 'pdf'],
  ['Excel (.xlsx)', 'PDF', 'pdf'],
  ['PowerPoint (.pptx)', 'PDF', 'pdf'],
  ['JPG', 'PDF', 'pdf'],
  ['PDF', 'JPG', 'jpg'],
]

// Set this to wherever the backend in /convertflow-server is deployed.
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function Converter({ activeIndex }) {
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [status, setStatus] = useState('idle') // idle | converting | done | error
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const inputRef = useRef(null)
  const [from, to, targetFormat] = FORMAT_PAIRS[activeIndex]

  const reset = () => {
    setStatus('idle')
    setResult(null)
    setErrorMsg('')
  }

  const pickFile = (f) => {
    if (!f) return
    setFile(f)
    reset()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files?.[0]) pickFile(e.dataTransfer.files[0])
  }

  const handleConvert = async () => {
    if (!file) return
    setStatus('converting')
    setErrorMsg('')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('targetFormat', targetFormat)

      const res = await fetch(`${API_BASE}/api/convert`, { method: 'POST', body: form })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Conversion failed.')

      setResult({ url: `${API_BASE}${data.downloadUrl}`, filename: data.filename })
      setStatus('done')
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <label className="text-xs font-semibold text-gray-500 tracking-wide">FROM</label>
          <div className="mt-1 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 font-medium">
            {from}
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center shrink-0 mt-5">
          <ArrowRight size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <label className="text-xs font-semibold text-gray-500 tracking-wide">TO</label>
          <div className="mt-1 border border-brand-500 bg-brand-50 rounded-lg px-4 py-3 text-brand-600 font-semibold">
            {to}
          </div>
        </div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed text-center py-14 px-6 cursor-pointer transition-colors ${
          dragOver ? 'border-brand-500 bg-brand-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
        <div className="w-14 h-14 mx-auto rounded-full bg-brand-100 flex items-center justify-center mb-4">
          <UploadCloud size={24} className="text-brand-600" />
        </div>
        <p className="font-semibold text-gray-900">
          {file ? file.name : 'Drop your file here'}
        </p>
        <p className="text-sm text-gray-500 mt-1">or click to browse from your computer</p>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
          className="mt-5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
        >
          Choose File
        </button>

        <p className="text-xs text-gray-400 mt-4">
          Supports PDF, DOCX, XLSX, PPTX, JPG, PNG · Max 50MB
        </p>
      </div>

      {status === 'done' && result ? (
        <a
          href={result.url}
          download={result.filename}
          className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <CheckCircle2 size={18} />
          Download {result.filename}
        </a>
      ) : (
        <button
          onClick={handleConvert}
          disabled={!file || status === 'converting'}
          className="w-full mt-6 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          {status === 'converting' ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Converting…
            </>
          ) : (
            <>
              <Zap size={18} />
              Convert Now
            </>
          )}
        </button>
      )}

      {status === 'error' && (
        <p className="flex items-center justify-center gap-1.5 text-sm text-red-600 mt-3">
          <AlertCircle size={14} />
          {errorMsg}
        </p>
      )}

      <p className="text-center text-xs text-gray-400 mt-4">
        Your files are deleted from our servers after 1 hour.
      </p>
    </div>
  )
}

