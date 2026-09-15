import { useState } from 'react';
import { CheckCircle, MessageSquare, Loader2, ArrowRight, Activity, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export const Messages = () => {
  const [message, setMessage] = useState('');
  const [extraction, setExtraction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(false);
  
  // Editable
  const [eventType, setEventType] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [currency, setCurrency] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');

  const handleExtract = async () => {
    if (!message.trim()) return;
    setLoading(true);
    setExtraction(null);
    try {
      const res = await axios.post('http://localhost:8000/api/v1/messages/extract', { text: message });
      setExtraction(res.data);
      setEventType(res.data.extraction.event_type || '');
      setAmount(res.data.extraction.amount || '');
      setCurrency(res.data.extraction.currency || '');
      setEffectiveDate(res.data.extraction.effective_date || '');
      setApproved(false);
    } catch (err) {
      console.error(err);
      alert("Failed to extract data. Please try again.");
    }
    setLoading(false);
  };

  const handleApprove = async () => {
    try {
      await axios.post(`http://localhost:8000/api/v1/messages/${extraction.extraction_id}/approve`, {
        event_type: eventType,
        amount: Number(amount),
        currency,
        effective_date: effectiveDate
      });
      setApproved(true);
    } catch (err) {
      console.error(err);
      alert("Failed to approve. Please check dates and amounts.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Extract Financial Event</h1>
        <p className="text-slate-500 mt-1">Paste a message or notification to safely update your cash flow projections.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Input Section */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full">
          <div className="flex items-center space-x-3 mb-6">
            <MessageSquare className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-slate-800">Paste Message</h2>
          </div>
          
          <div className="flex-1 flex flex-col mb-6">
            <textarea 
              className="w-full flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none font-medium text-slate-700 min-h-[200px]"
              placeholder="e.g. Hi, just confirming your rent will increase to ₹18,000 per month starting 2026-10-01."
              value={message}
              onChange={e => setMessage(e.target.value)}
            ></textarea>
          </div>

          <button 
            onClick={handleExtract}
            disabled={loading || !message.trim()}
            className="w-full bg-slate-900 text-white font-bold p-4 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 flex justify-center items-center space-x-2 shadow-sm"
          >
            {loading ? (
              <><Loader2 className="animate-spin" size={20} /> <span>Extracting Event...</span></>
            ) : (
              <><span>Extract Data</span> <ArrowRight size={20} /></>
            )}
          </button>
        </div>

        {/* Extraction Results */}
        {extraction ? (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800">Detected Event</h2>
              <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-200 text-sm">
                <span className="text-slate-500">Confidence:</span>
                <span className="font-bold text-slate-800">{Math.round(extraction.confidence * 100)}%</span>
              </div>
            </div>

            {extraction.requires_review && !approved && (
              <div className="bg-amber-50 text-amber-800 p-4 rounded-xl mb-6 flex items-start space-x-3 border border-amber-200">
                <AlertTriangle className="shrink-0 mt-0.5" size={20} />
                <div className="text-sm">
                  <strong className="block mb-1">Needs Review</strong>
                  {extraction.warnings.join(' ')}
                </div>
              </div>
            )}

            <div className="space-y-5 flex-1">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Event Type</label>
                <input type="text" value={eventType} onChange={e => setEventType(e.target.value)} disabled={approved} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-900 font-medium disabled:opacity-70 capitalize" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Amount</label>
                  <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} disabled={approved} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-900 font-medium disabled:opacity-70" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Currency</label>
                  <input type="text" value={currency} onChange={e => setCurrency(e.target.value)} disabled={approved} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-900 font-medium disabled:opacity-70" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Effective Date (YYYY-MM-DD)</label>
                <input type="text" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} disabled={approved} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-900 font-medium disabled:opacity-70" />
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100">
              {!approved ? (
                <button onClick={handleApprove} className="w-full bg-blue-600 text-white font-bold p-4 rounded-xl hover:bg-blue-700 transition-colors shadow-sm flex justify-center items-center space-x-2">
                  <CheckCircle size={20} />
                  <span>Approve & Update Forecast</span>
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-emerald-50 text-emerald-700 flex items-center justify-center space-x-2 p-4 rounded-xl font-bold border border-emerald-200">
                    <CheckCircle size={20} /> <span>Event Safely Applied</span>
                  </div>
                  <Link to="/cash-flow" className="w-full bg-slate-900 text-white font-bold p-4 rounded-xl hover:bg-slate-800 transition-colors shadow-sm flex justify-center items-center space-x-2">
                    <Activity size={20} />
                    <span>View New Cash Flow</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-slate-400 min-h-[400px]">
            <Activity size={48} className="mb-4 opacity-20" />
            <p className="font-medium text-lg">Awaiting Extraction</p>
            <p className="text-sm mt-2 text-center max-w-xs">Paste text to see structured event details.</p>
          </div>
        )}
      </div>
    </div>
  );
};
