import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { BarChart3 } from 'lucide-react';

const TrendChart = ({ chartData, seatTypes }) => {
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
                            formatter={(value, name) => {
                                if (name.includes('Ceiling')) return null;
                                return [value, name];
                            }}
                        />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: '600', paddingBottom: '20px' }} />

                        {seatTypes.map(type => (
                            <Line
                                key={type.id}
                                name={`${type.id} OTA ASP`}
                                type="monotone"
                                dataKey={`${type.id} OTA ASP`}
                                stroke={type.color}
                                strokeWidth={2.5}
                                dot={{ r: 3, fill: type.color }}
                                activeDot={{ r: 5 }}
                                legendType="circle"
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TrendChart;
