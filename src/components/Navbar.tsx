import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: '/', label: 'Home' },
    { to: '/arena', label: 'Arena' },
    { to: '/lab', label: 'Lab' },
    { to: '/generator', label: 'Generator' },
    { to: '/science', label: 'Science' },
    { to: '/token', label: 'Token' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center bg-[#060a0f]/85 backdrop-blur-xl border-b border-[rgba(0,229,255,0.1)]">
      <Link to="/" className="flex items-center gap-3 font-bold text-lg text-[#e8f0f8] no-underline">
        <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#00e5ff] to-[#4488ff] flex items-center justify-center text-[#060a0f] font-bold text-sm font-[var(--font-mono)]">
          P
        </div>
        <span>Proteus AI</span>
      </Link>

      <div className="hidden md:flex items-center gap-8">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`text-sm font-medium transition-colors ${
              location.pathname === l.to
                ? 'text-[#00e5ff]'
                : 'text-[#7a8fa8] hover:text-[#00e5ff]'
            } no-underline`}
          >
            {l.label}
          </Link>
        ))}
      </div>

      <div className="hidden md:block font-[var(--font-mono)] text-xs px-4 py-2 bg-[#0e1828] border border-[rgba(0,229,255,0.1)] rounded-md text-[#00ff88]">
        0x71...A3F2 • 2.4M PROTEUS
      </div>

      <button className="md:hidden text-[#e8f0f8]" onClick={() => setOpen(!open)}>
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 bg-[#060a0f]/95 border-b border-[rgba(0,229,255,0.1)] p-4 flex flex-col gap-4 md:hidden">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-[#7a8fa8] hover:text-[#00e5ff] no-underline"
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
