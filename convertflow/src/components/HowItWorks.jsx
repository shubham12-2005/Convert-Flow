import { Upload, Sliders, Download } from 'lucide-react'

const steps = [
  { icon: Upload, title: 'Upload', desc: 'Choose or drag your file' },
  { icon: Sliders, title: 'Configure', desc: 'Select output format' },
  { icon: Download, title: 'Download', desc: 'Get your converted file' },
]

export default function HowItWorks() {
  return (
    <section className="bg-gray-50 border-t border-gray-100 py-20 px-6">
      <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-14">
        How it works
      </h2>
      <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-12 text-center">
        {steps.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.title}>
              <div className="w-14 h-14 mx-auto rounded-full bg-brand-100 flex items-center justify-center mb-4">
                <Icon size={22} className="text-brand-600" />
              </div>
              <h3 className="font-semibold text-gray-900">{s.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{s.desc}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
