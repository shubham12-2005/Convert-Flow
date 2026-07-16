export default function Footer() {
  return (
    <footer className="border-t border-gray-100 px-6 py-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
        <p>© 2024 ConvertFlow. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#privacy" className="hover:text-gray-600 transition-colors">Privacy</a>
          <a href="#terms" className="hover:text-gray-600 transition-colors">Terms</a>
          <a href="#contact" className="hover:text-gray-600 transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  )
}
