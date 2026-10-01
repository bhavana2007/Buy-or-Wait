import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Activity, FileText, MessageSquare, Settings, Menu, X, LogOut, User } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { useAuth } from '../contexts/AuthContext';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Buy or Wait', path: '/buy-or-wait', icon: ShoppingCart },
    { name: 'Cash Flow', path: '/cash-flow', icon: Activity },
    { name: 'Documents', path: '/documents', icon: FileText },
    { name: 'Messages', path: '/messages', icon: MessageSquare },
  ];

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-50">
        <div className="flex items-center space-x-2">
          <img src="/branding/favicon.png" alt="Buy Or Wait logo" className="w-8 h-8 object-contain" />
          <span className="font-bold text-xl text-brand-navy tracking-tight">Buy Or Wait</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation (Desktop & Mobile Drawer) */}
      <div className={clsx(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col",
        isMobileMenuOpen ? "translate-x-0 pt-16" : "-translate-x-full"
      )}>
        <div className="hidden lg:flex items-center space-x-3 px-6 h-20 border-b border-slate-100 mb-4">
          <img src="/branding/favicon.png" alt="Buy Or Wait logo" className="w-8 h-8 object-contain shadow-sm rounded-lg" />
          <span className="font-bold text-xl text-brand-navy tracking-tight">Buy Or Wait</span>
        </div>
        
        <div className="px-6 mb-6">
          <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="w-10 h-10 bg-brand-lavender text-brand-blue rounded-lg flex items-center justify-center font-bold text-lg">
              {user?.name?.charAt(0).toUpperCase() || <User size={20} />}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-medium text-slate-900 truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 py-4 lg:py-0 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={closeMenu}
                  className={clsx(
                    "flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors duration-200 font-medium",
                    isActive 
                      ? "bg-brand-lavender text-brand-blue" 
                      : "text-slate-600 hover:bg-slate-100 hover:text-brand-navy"
                  )}
                >
                  <item.icon size={20} className={clsx(isActive ? "text-brand-blue" : "text-slate-400")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 space-y-1">
          <button className="flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors duration-200 font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 w-full">
            <Settings size={20} className="text-slate-400" />
            <span>Settings</span>
          </button>
          <button onClick={logout} className="flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors duration-200 font-medium text-red-600 hover:bg-red-50 hover:text-red-700 w-full">
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden pt-16 lg:pt-0">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 z-30 lg:hidden backdrop-blur-sm"
          onClick={closeMenu}
        />
      )}
    </div>
  );
};
