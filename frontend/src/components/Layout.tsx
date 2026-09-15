import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Activity, FileText, MessageSquare, Settings, Menu, X } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

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
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">B</span>
          </div>
          <span className="font-bold text-xl text-slate-800 tracking-tight">Buy or Wait?</span>
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
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-lg">B</span>
          </div>
          <span className="font-bold text-xl text-slate-800 tracking-tight">Buy or Wait?</span>
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
                      ? "bg-blue-50 text-blue-700" 
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <item.icon size={20} className={clsx(isActive ? "text-blue-600" : "text-slate-400")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100">
          <button className="flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors duration-200 font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 w-full">
            <Settings size={20} className="text-slate-400" />
            <span>Settings</span>
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
