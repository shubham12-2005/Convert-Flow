import { useState } from 'react'
import FormatTabs from './FormatTabs.jsx'
import Converter from './Converter.jsx'

export default function Hero() {
  const [active, setActive] = useState(0)

  return (
    <section id="top" className="px-6 pt-20 pb-24 text-center">
      <span className="inline-block bg-brand-50 text-brand-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
        Free · No sign-up required
      </span>

      <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
        Convert any file, instantly
      </h1>

      <p className="text-lg text-gray-500 mt-5 max-w-xl mx-auto">
        PDF, Word, Excel, PowerPoint, images — convert between formats in seconds.
      </p>

      <div className="mt-10 mb-12">
        <FormatTabs active={active} onSelect={setActive} />
      </div>

      <Converter activeIndex={active} />
    </section>
  )
}
