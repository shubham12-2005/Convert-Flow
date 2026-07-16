export default function Navbar() {
  return (
    <header className="border-b border-gray-100">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-2 font-semibold text-lg text-gray-900">
          <span className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <span className="w-3 h-3 rounded-sm bg-white block" />
          </span>
          ConvertFlow
        </a>

        <div className="hidden md:flex items-center gap-8 text-gray-600 text-sm font-medium">
          <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
          <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
          <a href="#docs" className="hover:text-gray-900 transition-colors">Docs</a>
        </div>

        <button className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
          Sign in
        </button>
      </nav>
    </header>
  )
}
