import { useState } from 'react';
import { Upload, CheckCircle, Clock, AlertTriangle, FileText, Loader2, ArrowRight } from 'lucide-react';
import axios from 'axios';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

export const Documents = () => {
  const [file, setFile] = useState<File | null>(null);
  const [extraction, setExtraction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(false);
  const navigate = useNavigate();
  
  // Editable fields
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [currency, setCurrency] = useState('');
  const [date, setDate] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setLoading(true);
      const formData = new FormData();
      formData.append('file', selected);
      try {
        const res = await axios.post('http://localhost:8000/api/v1/documents/extract', formData);
        setExtraction(res.data);
        setMerchant(res.data.extraction.merchant || '');
        setAmount(res.data.extraction.amount || '');
        setCurrency(res.data.extraction.currency || '');
        setDate(res.data.extraction.date || '');
        setApproved(false);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await axios.post(`http://localhost:8000/api/v1/documents/${extraction.extraction_id}/approve`, {
        merchant,
        amount: Number(amount),
        currency,
        date
      });
      setApproved(true);
    } catch (err) {
      console.error(err);
      alert("Failed to approve document. Ensure amount is valid.");
    }
  };
  
  const handleAnalyze = () => {
    navigate(`/buy-or-wait?amount=${amount}&merchant=${merchant}&document_id=${extraction.extraction_id}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Invoice Extraction</h1>
        <p className="text-slate-500 mt-1">Upload invoices or bills. Our AI will extract the data for financial modeling.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Upload Section */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[400px]">
          <label className={clsx(
            "w-full h-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors p-12",
            file ? "border-blue-300 bg-blue-50/50" : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
          )}>
            <div className="bg-white p-4 rounded-full shadow-sm border border-slate-100 mb-4">
              <Upload className={clsx(file ? "text-blue-600" : "text-slate-400")} size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              {file ? file.name : "Upload Financial Document"}
            </h3>
            <p className="text-sm text-slate-500 text-center max-w-xs">
              {file ? "Click to replace file" : "Upload invoices, receipts, or bills. Supported formats: Images, PDF (Max 5MB)"}
            </p>
            <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleUpload} />
          </label>
          
          {loading && (
            <div className="mt-8 flex items-center space-x-3 text-blue-600 font-medium bg-blue-50 px-6 py-3 rounded-full">
              <Loader2 className="animate-spin" size={20} />
              <span>Extracting data securely...</span>
            </div>
          )}
        </div>

        {/* Extraction Results */}
        {extraction ? (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <FileText className="text-slate-400" size={24} />
                <h2 className="text-xl font-bold text-slate-800">Extraction Results</h2>
              </div>
              <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-200 text-sm">
                <span className="text-slate-500">Confidence:</span>
                <span className="font-bold text-slate-800">{Math.round(extraction.confidence * 100)}%</span>
              </div>
            </div>

            {extraction.requires_review && !approved && (
              <div className="bg-amber-50 text-amber-800 p-4 rounded-xl mb-6 flex items-start space-x-3 border border-amber-200">
                <AlertTriangle className="shrink-0 mt-0.5" size={20} />
                <div className="text-sm">
                  <strong className="block mb-1">Human Review Required</strong>
                  {extraction.warnings.join(' ')}
                </div>
              </div>
            )}

            <div className="space-y-5 flex-1">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Merchant Name</label>
                <input type="text" value={merchant} onChange={e => setMerchant(e.target.value)} disabled={approved} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-900 font-medium disabled:opacity-70" />
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
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date (YYYY-MM-DD)</label>
                <input type="text" value={date} onChange={e => setDate(e.target.value)} disabled={approved} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-900 font-medium disabled:opacity-70" />
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100">
              {!approved ? (
                <button onClick={handleApprove} className="w-full bg-slate-900 text-white font-bold p-4 rounded-xl hover:bg-slate-800 transition-colors shadow-sm flex justify-center items-center space-x-2">
                  <CheckCircle size={20} />
                  <span>Approve Document</span>
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-emerald-50 text-emerald-700 flex items-center justify-center space-x-2 p-4 rounded-xl font-bold border border-emerald-200">
                    <CheckCircle size={20} /> <span>Document Approved</span>
                  </div>
                  <button onClick={handleAnalyze} className="w-full bg-blue-600 text-white font-bold p-4 rounded-xl hover:bg-blue-700 transition-colors shadow-sm flex justify-center items-center space-x-2">
                    <span>Analyze Purchase</span>
                    <ArrowRight size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-slate-400 min-h-[400px]">
            <Clock size={48} className="mb-4 opacity-20" />
            <p className="font-medium text-lg">Awaiting Upload</p>
            <p className="text-sm mt-2 text-center max-w-xs">Upload a document to extract information and proceed with analysis.</p>
          </div>
        )}
      </div>
    </div>
  );
};
