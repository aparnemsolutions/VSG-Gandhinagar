import { NavLink } from 'react-router-dom';
import { Home, List, BookOpen, Phone } from 'lucide-react';

const TABS = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/entries', icon: List, label: 'Vihar Entries' },
  { to: '/directory', icon: BookOpen, label: 'Directory' },
  { to: '/contacts', icon: Phone, label: 'Imp. Contacts' },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-[#E8C97A] z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex h-16">
        {TABS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${
                isActive ? 'text-[#C96800]' : 'text-[#8B6525]'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
