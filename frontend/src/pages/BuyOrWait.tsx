import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { analyzePurchase, createPurchase } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ShoppingBag, Loader2, Info, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

export const BuyOrWait = () => {
  const [searchParams] = useSearchParams();
  const [amount, setAmount] = useState(searchParams.get('amount') || '');
  const [merchant, setMerchant] = useState(searchParams.get('merchant') || '');
  const [documentId] = useState(searchParams.get('document_id') || '');
  
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!amount) return;
    setLoading(true);
    setResult(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      const purchaseRes = await createPurchase({
        document_id: documentId || "manual",
        amount: Number(amount),
        currency: "INR",
        merchant: merchant || "Manual Purchase",
        purchase_date: today
      });
      
      const analyzeRes = await analyzePurchase({
        request_id: purchaseRes.request_id,
        user_id: 'test_user',
        request_date: today,
        requested_amount: Number(amount),
        desired_completion_date: today,
        allows_partial_payment: true,
        request_type: 'purchase',
        payment_options: []
      });
      
      setResult(analyzeRes);
    } catch (e) {
      console.error(e);
      alert("Failed to analyze. Please check inputs.");
    }
    setLoading(false);
  };

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'affordable_now': 
        return { label: 'SAFE TO BUY', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: ShieldCheck };
      case 'affordable_with_plan':
        return { label: 'AFFORDABLE WITH PLAN', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Info };
      case 'affordable_later':
      case 'not_affordable':
      default:
        return { label: 'WAIT', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: AlertTriangle };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-2xl mb-4 text-blue-600">
          <ShoppingBag size={32} />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">Can I safely afford this?</h1>
        <p className="text-lg text-slate-500">Run a complete 90-day simulation to see if you can make this purchase without dropping below your safety reserve.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 max-w-2xl mx-auto">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Merchant / Item (Optional)</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                value={merchant} 
                onChange={e => setMerchant(e.target.value)} 
                placeholder="e.g. New Laptop"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Purchase Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₹</span>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pl-8 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium text-slate-900"
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                  placeholder="25000"
                />
              </div>
            </div>
          </div>
          
          <button 
            onClick={analyze}
            disabled={loading || !amount}
            className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center space-x-2 shadow-sm"
          >
            {loading ? (
              <><Loader2 className="animate-spin" size={24} /> <span>Running Simulation...</span></>
            ) : (
              <><span>Analyze Purchase</span> <ArrowRight size={20} /></>
            )}
          </button>
        </div>
      </div>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 pt-8 border-t border-slate-200">
          
          {/* Result Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className={clsx("p-6 rounded-3xl border shadow-sm", getStatusConfig(result.affordability_status).bg, getStatusConfig(result.affordability_status).border)}>
              <div className="flex items-center space-x-3 mb-6">
                {(() => {
                  const Icon = getStatusConfig(result.affordability_status).icon;
                  return <Icon size={32} className={getStatusConfig(result.affordability_status).text} />;
                })()}
                <h2 className={clsx("text-2xl font-black tracking-wide", getStatusConfig(result.affordability_status).text)}>
                  {getStatusConfig(result.affordability_status).label}
                </h2>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white/60 p-4 rounded-2xl flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Amount Requested</span>
                  <span className="font-bold text-slate-900 text-lg">₹{Number(amount).toLocaleString()}</span>
                </div>
                
                <div className="bg-white/60 p-4 rounded-2xl flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Safe to Pay Today</span>
                  <span className="font-bold text-slate-900 text-lg">₹{result.amount_safe_to_pay.toLocaleString()}</span>
                </div>

                <div className="bg-white/60 p-4 rounded-2xl flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Recommended Action</span>
                  <span className="font-bold text-slate-900 text-lg capitalize">{result.recommended_payment_method.replace(/_/g, ' ')}</span>
                </div>

                {result.earliest_date_for_full_payment && (
                  <div className="bg-white/60 p-4 rounded-2xl flex justify-between items-center">
                    <span className="text-slate-600 font-medium">Earliest Safe Date</span>
                    <span className="font-bold text-slate-900 text-lg">{result.earliest_date_for_full_payment}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-2 flex items-center"><Info size={18} className="mr-2 text-blue-500"/> Recommendation Details</h3>
              <p className="text-slate-600 leading-relaxed">
                {result.decision_explanation}
              </p>
            </div>
          </div>
          
          {/* Visualization */}
          <div className="lg:col-span-3 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
            <div className="mb-6">
              <h3 className="font-bold text-slate-900 text-xl mb-1">Impact Visualization</h3>
              <p className="text-slate-500">Projected 90-day balance comparison</p>
            </div>
            
            <div className="flex-1 min-h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.chart_data} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{fontSize: 12}} minTickGap={30} axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" tick={{fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                    labelFormatter={(label) => `Date: ${label}`}
                    formatter={(value: any, name: any) => [`₹${Number(value).toLocaleString()}`, name === 'baseline' ? 'Without Purchase' : 'With Purchase']}
                  />
                  <ReferenceLine y={30000} stroke="#ef4444" strokeDasharray="4 4" opacity={0.6} />
                  <Line type="monotone" dataKey="baseline" name="baseline" stroke="#cbd5e1" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="with_purchase" name="with_purchase" stroke="#2563eb" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-6 flex flex-wrap gap-4 items-center justify-center text-sm font-medium text-slate-600">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                <span>Without Purchase</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                <span>With Purchase</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 border-t-2 border-dashed border-red-400"></div>
                <span>Minimum Reserve</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
