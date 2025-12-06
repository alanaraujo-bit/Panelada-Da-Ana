'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  Users, 
  Table,
  ShoppingCart,
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, logout } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!token || user?.role !== 'admin') {
      router.push('/login');
    }
  }, [token, user, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
    { icon: ShoppingCart, label: 'Pedidos', href: '/admin/pedidos' },
    { icon: Table, label: 'Mesas', href: '/admin/mesas' },
    { icon: UtensilsCrossed, label: 'Pratos', href: '/admin/pratos' },
    { icon: Users, label: 'Usuários', href: '/admin/usuarios' },
  ];

  if (!token || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
      {/* Header Mobile */}
      <div className="lg:hidden bg-gradient-to-r from-primary-orange to-primary-brown text-white p-4 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <h1 className="text-xl font-bold">Admin - Panelada da Ana</h1>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-0 left-0 h-screen
          bg-gradient-to-b from-primary-brown to-primary-orange text-white
          w-64 shadow-2xl z-40 transition-transform duration-300
          ${isMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-6 border-b border-white/20 hidden lg:block">
            <h1 className="text-2xl font-bold mb-1">Panelada da Ana</h1>
            <p className="text-sm opacity-80">Painel Administrativo</p>
          </div>

          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <button
                  key={item.href}
                  onClick={() => {
                    router.push(item.href);
                    setIsMenuOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-all duration-200 font-medium
                    ${isActive 
                      ? 'bg-white text-primary-brown shadow-lg scale-105' 
                      : 'hover:bg-white/10 hover:translate-x-1'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/20">
            <div className="mb-3 px-2">
              <p className="text-sm opacity-80">Logado como:</p>
              <p className="font-semibold truncate">{user?.nome}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg
                bg-red-500 hover:bg-red-600 transition-all duration-200 font-medium"
            >
              <LogOut className="h-5 w-5" />
              Sair
            </button>
          </div>
        </aside>

        {/* Overlay Mobile */}
        {isMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
