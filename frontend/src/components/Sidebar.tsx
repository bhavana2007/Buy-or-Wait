import { Link } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Activity, FileText, MessageSquare } from 'lucide-react';

export const Sidebar = () => (
  <div className="w-64 bg-slate-900 h-screen text-white flex flex-col p-4 fixed">
    <h1 className="text-2xl font-bold mb-8 text-blue-400">Buy or Wait?</h1>
    <nav className="flex flex-col space-y-4">
      <Link to="/" className="flex items-center space-x-2 hover:text-blue-300"><LayoutDashboard size={20} /><span>Dashboard</span></Link>
      <Link to="/buy-or-wait" className="flex items-center space-x-2 hover:text-blue-300"><ShoppingCart size={20} /><span>Buy or Wait</span></Link>
      <Link to="/cash-flow" className="flex items-center space-x-2 hover:text-blue-300"><Activity size={20} /><span>Cash Flow</span></Link>
      <Link to="/documents" className="flex items-center space-x-2 hover:text-blue-300"><FileText size={20} /><span>Documents</span></Link>
      <Link to="/messages" className="flex items-center space-x-2 hover:text-blue-300"><MessageSquare size={20} /><span>Messages</span></Link>
    </nav>
  </div>
);
