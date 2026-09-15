import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Documents } from './pages/Documents';
import { Messages } from './pages/Messages';
import { CashFlow } from './pages/CashFlow';
import { BuyOrWait } from './pages/BuyOrWait';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/buy-or-wait" element={<BuyOrWait />} />
          <Route path="/cash-flow" element={<CashFlow />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/messages" element={<Messages />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
