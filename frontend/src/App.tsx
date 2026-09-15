import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { BuyOrWait } from './pages/BuyOrWait';
import { CashFlow } from './pages/CashFlow';
import { Documents } from './pages/Documents';
import { Messages } from './pages/Messages';

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="p-8">
    <h1 className="text-3xl font-bold mb-6">{title}</h1>
    <p className="text-gray-500">Implemented via components.</p>
  </div>
);

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
        <Sidebar />
        <div className="ml-64 flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/buy-or-wait" element={<BuyOrWait />} />
            <Route path="/cash-flow" element={<CashFlow />} />
            <Route path="/expenses" element={<PlaceholderPage title="Expenses" />} />
            <Route path="/income" element={<PlaceholderPage title="Income" />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
