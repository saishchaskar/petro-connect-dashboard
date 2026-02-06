import React, { useState, useEffect } from 'react';
import { Card, Row, Col, DatePicker, Typography, Statistic, Spin, Radio, Empty } from 'antd';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import dayjs from 'dayjs';
import { getAnalyticsData } from '../services/dsr';
import { 
  FireOutlined, 
  ThunderboltOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  RiseOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import type { AnalyticsData } from '../types';
import '../index.css';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

// --- THEME CONSTANTS ---
const COLORS = {
  petrol: '#d97706', // Industrial Orange
  diesel: '#003399', // Industrial Blue
  revenue: '#389e0d', // Money Green
  grid: '#e0e0e0',
  text: '#666'
};

// --- HELPERS ---
const fmtMoney = (val: number) => `₹ ${(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const fmtVol = (val: number) => `${(val || 0).toLocaleString('en-IN')} L`;
const fmtK = (val: number) => {
    if (val >= 10000000) return `${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return val.toString();
};

const AnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [viewMode, setViewMode] = useState<'volume' | 'revenue'>('volume');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'days'), 
    dayjs()
  ]);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const start = dateRange[0].format('YYYY-MM-DD');
      const end = dateRange[1].format('YYYY-MM-DD');
      const result = await getAnalyticsData(start, end);
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- KPI CALCULATIONS ---
  const totalRev = data.reduce((acc, curr) => acc + curr.totalRevenue, 0);
  const totalPetrolVol = data.reduce((acc, curr) => acc + curr.petrolVolume, 0);
  const totalDieselVol = data.reduce((acc, curr) => acc + curr.dieselVolume, 0);
  const totalVol = totalPetrolVol + totalDieselVol;
  
  // Averages
  const days = data.length || 1;
  const avgRev = totalRev / days;
  const avgVol = totalVol / days;

  // Pie Chart Data
  const pieData = [
    { name: 'Petrol', value: totalPetrolVol, color: COLORS.petrol },
    { name: 'Diesel', value: totalDieselVol, color: COLORS.diesel },
  ];

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'rgba(255, 255, 255, 0.96)', border: '1px solid #ddd', padding: '10px', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          <p style={{ margin: 0, fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: 5, marginBottom: 5 }}>{dayjs(label).format('DD MMM YYYY')}</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} style={{ margin: 0, color: p.color, fontSize: 13 }}>
              {p.name}: <b>{viewMode === 'volume' ? fmtVol(p.value) : fmtMoney(p.value)}</b>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="page-container" style={{background: '#f0f2f5', minHeight: '100vh'}}>
      
      {/* STICKY HEADER */}
      <div className="sticky-header">
         <div style={{display:'flex', alignItems: 'center', gap: 12}}>
            <RiseOutlined style={{fontSize: 22, color: '#faad14'}} />
            <div>
                <div style={{fontWeight: 800, fontSize: 18, color: '#001529', lineHeight: 1.2}}>Business Analytics</div>
                <div style={{fontSize: 12, color: '#666'}}>Performance Insights & Trends</div>
            </div>
         </div>
         
         <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Radio.Group value={viewMode} onChange={e => setViewMode(e.target.value)} buttonStyle="solid">
                <Radio.Button value="volume"><BarChartOutlined /> Volume</Radio.Button>
                <Radio.Button value="revenue"><LineChartOutlined /> Revenue</Radio.Button>
            </Radio.Group>
            <div style={{background: '#fff', padding: '4px 12px', borderRadius: 6, border: '1px solid #d9d9d9', display:'flex', alignItems:'center', gap: 8}}>
                <CalendarOutlined style={{color: '#999'}} />
                <RangePicker 
                    value={dateRange} 
                    onChange={(dates) => dates && setDateRange([dates[0]!, dates[1]!])} 
                    allowClear={false}
                    bordered={false}
                    suffixIcon={null}
                    style={{padding: 0, width: 220}}
                    format="DD MMM YYYY"
                />
            </div>
         </div>
      </div>

      <div style={{ padding: '24px' }}>
        {loading ? <div style={{textAlign:'center', padding: 100}}><Spin size="large" /></div> : data.length === 0 ? <Empty description="No data for selected range" style={{marginTop: 50}} /> : (
            <>
                {/* KPI ROW */}
                <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={8}>
                        <Card bordered={false} className="industrial-card" style={{ borderTop: `4px solid ${COLORS.revenue}` }}>
                            <Statistic 
                                title={<span style={{fontWeight:600}}>Total Revenue</span>}
                                value={totalRev} 
                                formatter={(val) => fmtMoney(Number(val))}
                                valueStyle={{ color: COLORS.revenue, fontWeight: 800, fontSize: 26 }}
                            />
                            <div style={{fontSize: 12, color: '#888', marginTop: 8, display:'flex', justifyContent:'space-between'}}>
                                <span>Daily Avg:</span>
                                <b>{fmtMoney(avgRev)}</b>
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card bordered={false} className="industrial-card" style={{ borderTop: `4px solid ${COLORS.petrol}` }}>
                            <Statistic 
                                title={<span style={{fontWeight:600}}>Total Petrol Sold</span>}
                                value={totalPetrolVol} 
                                formatter={(val) => fmtVol(Number(val))}
                                prefix={<FireOutlined />} 
                                valueStyle={{ color: COLORS.petrol, fontWeight: 700 }}
                            />
                            <div style={{fontSize: 12, color: '#888', marginTop: 8, display:'flex', justifyContent:'space-between'}}>
                                <span>Daily Avg:</span>
                                <b>{fmtVol(totalPetrolVol/days)}</b>
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card bordered={false} className="industrial-card" style={{ borderTop: `4px solid ${COLORS.diesel}` }}>
                            <Statistic 
                                title={<span style={{fontWeight:600}}>Total Diesel Sold</span>} 
                                value={totalDieselVol} 
                                formatter={(val) => fmtVol(Number(val))}
                                prefix={<ThunderboltOutlined />} 
                                valueStyle={{ color: COLORS.diesel, fontWeight: 700 }}
                            />
                            <div style={{fontSize: 12, color: '#888', marginTop: 8, display:'flex', justifyContent:'space-between'}}>
                                <span>Daily Avg:</span>
                                <b>{fmtVol(totalDieselVol/days)}</b>
                            </div>
                        </Card>
                    </Col>
                </Row>

                {/* MAIN CHARTS ROW */}
                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={16}>
                        <div className="industrial-card" style={{padding: 20}}>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20}}>
                                <Title level={5} style={{margin: 0}}>{viewMode === 'volume' ? "Daily Sales Volume Trend" : "Daily Revenue Trend"}</Title>
                                <Text type="secondary" style={{fontSize: 12}}>Last {days} Days</Text>
                            </div>
                            
                            <div style={{ height: 350, width: '100%' }}>
                                <ResponsiveContainer>
                                    {viewMode === 'volume' ? (
                                        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis dataKey="date" tickFormatter={(d) => dayjs(d).format('DD MMM')} tick={{fontSize: 12}} />
                                            <YAxis tickFormatter={fmtK} tick={{fontSize: 12}} />
                                            <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(0,0,0,0.02)'}} />
                                            <Legend iconType="circle" />
                                            {/* Stacked Bars for better total visibility */}
                                            <Bar name="Petrol" dataKey="petrolVolume" stackId="a" fill={COLORS.petrol} radius={[0,0,0,0]} barSize={20} />
                                            <Bar name="Diesel" dataKey="dieselVolume" stackId="a" fill={COLORS.diesel} radius={[4, 4, 0, 0]} barSize={20} />
                                        </BarChart>
                                    ) : (
                                        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorPetrol" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={COLORS.petrol} stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor={COLORS.petrol} stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="colorDiesel" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={COLORS.diesel} stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor={COLORS.diesel} stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis dataKey="date" tickFormatter={(d) => dayjs(d).format('DD MMM')} tick={{fontSize: 12}} />
                                            <YAxis tickFormatter={fmtK} tick={{fontSize: 12}} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend iconType="circle" />
                                            <Area type="monotone" name="Petrol" dataKey="petrolAmount" stroke={COLORS.petrol} strokeWidth={2} fill="url(#colorPetrol)" />
                                            <Area type="monotone" name="Diesel" dataKey="dieselAmount" stroke={COLORS.diesel} strokeWidth={2} fill="url(#colorDiesel)" />
                                        </AreaChart>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </Col>
                    
                    <Col xs={24} lg={8}>
                        <div className="industrial-card" style={{padding: 20, height: '100%'}}>
                            <Title level={5} style={{margin: '0 0 20px 0'}}>Fuel Sales Mix (Volume)</Title>
                            <div style={{ height: 250, width: '100%', position:'relative' }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(val: number) => fmtVol(val)} />
                                        <Legend verticalAlign="bottom" height={36}/>
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Centered Text in Donut */}
                                <div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -80%)', textAlign: 'center'}}>
                                    <div style={{fontSize: 12, color: '#999'}}>Total Vol</div>
                                    <div style={{fontWeight: 'bold', fontSize: 16}}>{fmtK(totalVol)}</div>
                                </div>
                            </div>

                            <div style={{marginTop: 20, borderTop: '1px solid #f0f0f0', paddingTop: 15}}>
                                <div style={{display:'flex', justifyContent:'space-between', marginBottom: 8}}>
                                    <Text type="secondary"><PieChartOutlined /> Petrol Share</Text>
                                    <Text strong>{((totalPetrolVol / totalVol) * 100).toFixed(1)}%</Text>
                                </div>
                                <div style={{display:'flex', justifyContent:'space-between'}}>
                                    <Text type="secondary"><PieChartOutlined /> Diesel Share</Text>
                                    <Text strong>{((totalDieselVol / totalVol) * 100).toFixed(1)}%</Text>
                                </div>
                            </div>
                        </div>
                    </Col>
                </Row>
            </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;