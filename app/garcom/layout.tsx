'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, ShoppingBag, User, BarChart3 } from 'lucide-react';

export default function GarcomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: '/garcom/dashboard', icon: Home, label: 'Início' },
    { href: '/garcom/mesas', icon: ShoppingBag, label: 'Mesas' },
    { href: '/garcom/vendas', icon: BarChart3, label: 'Vendas' },
    { href: '/garcom/perfil', icon: User, label: 'Perfil' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {children}
      
      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive
                    ? 'text-primary-orange'
                    : 'text-gray-500 hover:text-primary-orange'
                }`}
              >
                <Icon className="h-6 w-6 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
