'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusSquare, Network, BarChart3, Settings } from 'lucide-react';
import './bottom-nav.css';

const navItems = [
  { href: '/', label: 'Dash', icon: Home },
  { href: '/input', label: 'Input', icon: PlusSquare },
  { href: '/skills', label: 'Skills', icon: Network },
  { href: '/analytics', label: 'Stats', icon: BarChart3 },
  { href: '/settings', label: 'Config', icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav glass-panel">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
