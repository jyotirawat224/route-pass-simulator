import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, AlertCircle, BarChart3, Info, Loader2, ChevronDown } from 'lucide-react';

export default function App() {
  const availableCorridors = [
    'Delhi<>Dehradun',
    'Delhi<>Lucknow',
    'Bangalore<>Hyderabad',
    'Hyderabad<>Visakhapatnam',
    'Delhi<>Dharamshala',
    'Pune<>Nagpur',
    'Chennai<>Madurai',
    'Chennai<>Coimbatore',
    'Gurugram<>Dehradun',
    'Delhi<>Amritsar',
    'Chennai<>Bangalore',
    'Delhi<>Jaipur'
  ];

  const [selectedCorridor, setSelectedCorridor] = useState('Delhi<>Jaipur');
  const [fareSeater, setFareSeater] = useState(300);
  const [fareShared, setFareShared] = useState(450);
  const [fareSingle, setFareSingle] = useState(600);
  const [capSeater, setCapSeater] = useState(100);
  const [capShared, setCapShared] = useState(150);
  const [capSingle, setCapSingle] = useState(200);

  const [historicalData, setHistoricalData] = useState(null);
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Seater');

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch real data from FastAPI
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/historical-data?corridor=${encodeURIComponent(selectedCorridor)}`);
        const result = await response.json();
        if (result.error) {
          setError(result.error);
        } else {
          setHistoricalData(result.data);
          setMonths(result.months);
        }
      } catch (err) {
        setError("Failed to connect to backend API. Ensure api.py is running.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedCorridor]);

  const seatTypes = [
    { id: 'Seater', fare: fareSeater, cap: capSeater, color: '#2563eb', dot: 'bg-blue-500', bg: 'bg-blue-50' },
    { id: 'Shared Sleeper', fare: fareShared, cap: capShared, color: '#16a34a', dot: 'bg-green-500', bg: 'bg-green-50' },
    { id: 'Single Sleeper', fare: fareSingle, cap: capSingle, color: '#ea580c', dot: 'bg-orange-500', bg: 'bg-orange-50' },
  ];

  const chartData = useMemo(() => {
    if (!historicalData || months.length === 0) return [];
    return months.map((month, i) => {
      const entry = { month };
      seatTypes.forEach(type => {
        const asp = historicalData[type.id]?.asp[i] || 0;
        entry[`${type.id} OTA ASP`] = asp;
        // Don't show ceiling if context (ASP) is missing (indicates unlaunched month)
        entry[`${type.id} Ceiling`] = asp > 0 ? (type.fare + type.cap) : null;
      });
      return entry;
    });
  }, [historicalData, months, fareSeater, fareShared, fareSingle, capSeater, capShared, capSingle]);

  const getGapColor = (gapPct) => {
    if (gapPct >= 0) return 'text-green-600 font-bold';
    if (gapPct > -5) return 'text-amber-600 font-bold';
    return 'text-red-600 font-bold';
  };

  const renderTrendChart = () => {
    if (loading) return (
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-12 mb-12 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Fetching real OTA ASP data...</p>
      </div>
    );

    if (error) return (
      <div className="bg-white rounded-xl shadow-lg border border-red-200 p-8 mb-12 flex items-center gap-4 text-red-600">
        <AlertCircle className="w-6 h-6" />
        <p className="font-medium text-sm">{error}</p>
      </div>
    );

    return (
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 mb-12">
        <div className="flex items-center gap-2 mb-8">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-900">OTA ASP Performance (Category-wise)</h2>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid stroke="#e2e8f0" vertical={false} strokeDasharray="0" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                label={{ value: 'Amount (₹)', angle: -90, position: 'insideLeft', offset: -5, fill: '#64748b', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: '600', paddingBottom: '20px' }} />

              {seatTypes.map(type => (
                <React.Fragment key={type.id}>
                  <Line name={`${type.id} OTA ASP`} type="monotone" dataKey={`${type.id} OTA ASP`} stroke={type.color} strokeWidth={2.5} dot={{ r: 3, fill: type.color }} activeDot={{ r: 5 }} />
                  <Line name={`${type.id} Ceiling`} type="monotone" dataKey={`${type.id} Ceiling`} stroke={type.color} strokeWidth={2} strokeDasharray="3 3" dot={false} />
                </React.Fragment>
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderCompactTable = () => {
    if (loading || !historicalData) return null;

    return (
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 mb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Month-wise Comparison</h3>
            <p className="text-xs text-slate-500 mt-1">OTA ASP vs Input Ceiling Price for {selectedCorridor}</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {seatTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setActiveTab(type.id)}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition ${activeTab === type.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                {type.id.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left p-3 font-bold text-slate-900 w-24 border-r border-slate-200">Month</th>
                <th className="text-right p-3 font-semibold text-slate-700 border-r border-slate-200">OTA ASP</th>
                <th className="text-right p-3 font-semibold text-slate-700 w-20 border-r border-slate-200">Fare</th>
                <th className="text-right p-3 font-semibold text-slate-700 border-r border-slate-200">Ceiling Price</th>
                <th className="text-right p-3 font-semibold text-slate-700 border-r border-slate-200">Extra (₹)</th>
                <th className="text-right p-3 font-semibold text-slate-700 border-r border-slate-200">Payable Amount</th>
                <th className="text-right p-3 font-semibold text-slate-700">Discount (%)</th>
              </tr>
            </thead>
            <tbody>
              {months.map((month, i) => {
                const type = seatTypes.find(t => t.id === activeTab);
                const data = historicalData[type.id];
                if (!data) return null;
                const asp = data.asp[i] || 0;
                const fare = type.fare;
                const ceiling = type.fare + type.cap;
                const isLaunched = asp > 0;

                // Updated formula with condition
                const extra = asp > ceiling ? (asp - ceiling) : 0;
                const payable = fare + extra;
                const discountPct = asp > 0 ? ((asp - payable) / asp * 100) : 0;

                return (
                  <tr key={month} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-900 border-r border-slate-200">{month}</td>
                    <td className="text-right p-3 text-slate-600 font-medium tracking-tight border-r border-slate-200">
                      {isLaunched ? `₹${asp.toLocaleString()}` : "—"}
                    </td>
                    <td className="text-right p-3 text-slate-500 font-medium border-r border-slate-200">
                      {isLaunched ? `₹${fare.toLocaleString()}` : "—"}
                    </td>
                    <td className="text-right p-3 text-slate-900 font-bold tracking-tight border-r border-slate-200">
                      {isLaunched ? `₹${ceiling.toLocaleString()}` : "—"}
                    </td>
                    <td className={`text-right p-3 font-medium border-r border-slate-200 ${isLaunched ? (extra >= 0 ? 'text-green-600' : 'text-red-600') : 'text-slate-300'}`}>
                      {isLaunched ? `₹${extra.toLocaleString()}` : "—"}
                    </td>
                    <td className="text-right p-3 text-blue-700 font-bold tracking-tight border-r border-slate-200">
                      {isLaunched ? `₹${payable.toLocaleString()}` : "—"}
                    </td>
                    <td className={`text-right p-3 font-black ${isLaunched ? (discountPct >= 0 ? 'text-green-600' : 'text-red-600') : 'text-slate-300'}`}>
                      {isLaunched ? `${discountPct >= 0 ? '+' : ''}${discountPct.toFixed(1)}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Simulator <span className="text-blue-600">v2</span></h1>
            </div>
            <p className="text-slate-500 font-medium uppercase tracking-widest text-[10px]">Route Pass Pricing Strategy Dashboard</p>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
          <div className="lg:col-span-1 space-y-4">
            {/* Corridor Selector (Moved to Sidebar) */}
            <div className="relative" ref={dropdownRef}>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mb-2 px-1">Selected Corridor</p>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-between w-full bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs font-bold text-white focus:outline-none cursor-pointer hover:bg-slate-800 transition mb-4"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <span>{selectedCorridor}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-2xl z-[100] max-h-64 overflow-y-auto py-1 animate-in fade-in zoom-in-95 ring-4 ring-slate-900/5">
                  {availableCorridors.map(corridor => (
                    <button
                      key={corridor}
                      onClick={() => {
                        setSelectedCorridor(corridor);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-5 py-3 text-[11px] transition duration-150 hover:bg-blue-50 ${selectedCorridor === corridor ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600' : 'text-slate-600 font-medium'
                        }`}
                    >
                      {corridor}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xl border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-6 pb-2 border-b border-blue-500/30 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" /> Simulation Parameters
              </h3>

              <div className="space-y-4">
                {[
                  { label: 'Seater Fare', val: fareSeater, set: setFareSeater, cap: capSeater, setCap: setCapSeater, color: '#2563eb' },
                  { label: 'Shared Fare', val: fareShared, set: setFareShared, cap: capShared, setCap: setCapShared, color: '#16a34a' },
                  { label: 'Single Fare', val: fareSingle, set: setFareSingle, cap: capSingle, setCap: setCapSingle, color: '#ea580c' },
                ].map(group => (
                  <div key={group.label} className="space-y-2 pb-3 border-b border-slate-800 last:border-0">
                    <p className="text-[10px] font-bold" style={{ color: group.color }}>{group.label.split(' ')[0]} Category</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-800 rounded p-1.5">
                        <label className="text-[9px] text-slate-500 block mb-0.5">Fare</label>
                        <input
                          type="number"
                          value={group.val}
                          onChange={(e) => group.set(Number(e.target.value))}
                          className="w-full bg-transparent text-xs font-bold outline-none"
                        />
                      </div>
                      <div className="bg-slate-800 rounded p-1.5">
                        <label className="text-[9px] text-slate-500 block mb-0.5">Cap</label>
                        <input
                          type="number"
                          value={group.cap}
                          onChange={(e) => group.setCap(Number(e.target.value))}
                          className="w-full bg-transparent text-xs font-bold outline-none font-sans"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {/* Small Metric Cards Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {seatTypes.map(type => (
                <div key={type.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden group hover:border-blue-200 transition">
                  <div className="absolute top-0 right-0 w-16 h-16 opacity-5 group-hover:opacity-10 transition">
                    <TrendingUp className="w-full h-full text-blue-900" />
                  </div>
                  <h4 className="text-[10px] uppercase font-bold text-slate-400 mb-1">{type.id} Ceiling</h4>
                  <div className="text-3xl font-black text-slate-900 leading-tight">₹{(type.fare + type.cap).toLocaleString()}</div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-slate-500">Fare ₹{type.fare}</span>
                    <span className="text-slate-300">/</span>
                    <span className="text-[9px] font-bold text-slate-500">Cap ₹{type.cap}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Trend Chart */}
            {renderTrendChart()}
          </div>
        </div>

        {/* Condensed Table Comparison */}
        <div className="w-full">
          {renderCompactTable()}
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-200 pb-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-[11px] font-bold text-slate-400">
              <div className="mb-0.5">jyotirawat@zingbus.com</div>
              <div>ANALYTICS</div>
            </div>
            <div className="flex items-center gap-6 text-[10px] font-bold text-slate-400">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-600"></span> Critical Gap</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-600"></span> Warning Gap</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-600"></span> Healthy Gap</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
