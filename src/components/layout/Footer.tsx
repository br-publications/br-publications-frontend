export default function Footer() {
  return (
    <footer className="border-t bg-gray-50 mt-12">
      <div className="container mx-auto px-4 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <span className="text-2xl font-black tracking-tighter text-gray-900">NOVA</span>
          <p className="text-sm text-gray-500">Premium commerce, elevated.</p>
        </div>
        
        <div className="flex gap-8 text-sm text-gray-500">
          <a href="#" className="hover:text-black transition-colors">Terms</a>
          <a href="#" className="hover:text-black transition-colors">Privacy</a>
          <a href="#" className="hover:text-black transition-colors">About</a>
          <a href="#" className="hover:text-black transition-colors">Contact</a>
        </div>
      </div>
      <div className="border-t py-6 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} Nova Store. All rights reserved.
      </div>
    </footer>
  );
}
