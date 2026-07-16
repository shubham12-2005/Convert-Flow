import { FileText, Table2, Monitor, Image } from 'lucide-react'

const formats = [
  { label: 'PDF → Word', icon: FileText },
  { label: 'Word → PDF', icon: FileText },
  { label: 'Excel → PDF', icon: Table2 },
  { label: 'PPT → PDF', icon: Monitor },
  { label: 'JPG → PDF', icon: Image },
  { label: 'PDF → JPG', icon: Image },
]

export default function FormatTabs({ active, onSelect }) {
  return (
    <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
      {formats.map((f, i) => {
        const Icon = f.icon
        const isActive = active === i
        return (
          <button
            key={f.label}
            onClick={() => onSelect(i)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              isActive
                ? 'bg-brand-50 border-brand-500 text-brand-600'
                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
          >
            <Icon size={16} />
            {f.label}
          </button>
        )
      })}
    </div>
  )
}
