import React, { useState, useEffect } from 'react';
import { Card, Row, Col, DatePicker, Typography, Statistic, Spin, Radio } from 'antd';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import dayjs from 'dayjs';
import { getAnalyticsData } from '../services/dsr';
import { 
  FireOutlined, 
  ThunderboltOutlined,
  LineChartOutlined,
  BarChartOutlined,
  RiseOutlined
} from '@ant-design/icons';
import type { AnalyticsData } from '../types';
import '../index.css';


const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const COLORS = {
  petrol: '#FF6600', // IOCL Saffron
  diesel: '#003399', // BPCL Blue
  revenue: '#52c41a', // Keep Green for Money
  bg: '#f4f7f9',
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

  // KPI Calculations
  const totalRev = data.reduce((acc, curr) => acc + curr.totalRevenue, 0);
  const totalPetrolVol = data.reduce((acc, curr) => acc + curr.petrolVolume, 0);
  const totalDieselVol = data.reduce((acc, curr) => acc + curr.dieselVolume, 0);
  const avgPetrolDaily = totalPetrolVol / (data.length || 1);
  const avgDieselDaily = totalDieselVol / (data.length || 1);

  // Chart Formatter
  const formatCurrency = (val: number) => `₹${(val / 1000).toFixed(1)}k`;
  const formatVolume = (val: number) => `${val.toFixed(0)} L`;

  return (
    <div style={{ padding: '24px', background: '#f4f5f7', minHeight: '100vh' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
            <Title level={2} style={{ margin: 0, color: '#001529' }}>Station Analytics</Title>
            <Text type="secondary">Sales Volume (Litres) & Revenue Analysis</Text>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
            <Radio.Group value={viewMode} onChange={e => setViewMode(e.target.value)} buttonStyle="solid">
                <Radio.Button value="volume"><BarChartOutlined /> Volume (Litres)</Radio.Button>
                <Radio.Button value="revenue"><LineChartOutlined /> Revenue (₹)</Radio.Button>
            </Radio.Group>
            <RangePicker 
                value={dateRange} 
                onChange={(dates) => dates && setDateRange([dates[0]!, dates[1]!])} 
                allowClear={false}
                style={{width: 260}}
            />
        </div>
      </div>

      {loading ? <div style={{textAlign:'center', padding: 100}}><Spin size="large" /></div> : (
        <>
            {/* KPI ROW */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <Card bordered={false} style={{ borderRadius: 8, borderTop: `4px solid ${COLORS.revenue}` }}>
                        <Statistic 
                            title="Total Revenue" 
                            value={totalRev} 
                            precision={2} 
                            prefix="₹" 
                            valueStyle={{ color: COLORS.revenue, fontWeight: 'bold' }}
                        />
                        <div style={{fontSize: 12, color: '#888', marginTop: 5}}>Net collections for period</div>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} style={{ borderRadius: 8, borderTop: `4px solid ${COLORS.petrol}` }}>
                        <Statistic 
                            title="Total Petrol Sold" 
                            value={totalPetrolVol} 
                            precision={0} 
                            suffix="L"
                            prefix={<FireOutlined />} 
                            valueStyle={{ color: COLORS.petrol }}
                        />
                        <div style={{fontSize: 12, color: '#888', marginTop: 5}}>Daily Avg: {avgPetrolDaily.toFixed(0)} L</div>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} style={{ borderRadius: 8, borderTop: `4px solid ${COLORS.diesel}` }}>
                        <Statistic 
                            title="Total Diesel Sold" 
                            value={totalDieselVol} 
                            precision={0} 
                            suffix="L"
                            prefix={<ThunderboltOutlined />} 
                            valueStyle={{ color: COLORS.diesel }}
                        />
                        <div style={{fontSize: 12, color: '#888', marginTop: 5}}>Daily Avg: {avgDieselDaily.toFixed(0)} L</div>
                    </Card>
                </Col>
            </Row>

            {/* MAIN CHART */}
            <Row gutter={[24, 24]}>
                <Col span={24}>
                    <Card 
                        title={viewMode === 'volume' ? "Daily Sales Volume (Litres)" : "Daily Revenue (Rupees)"} 
                        bordered={false} 
                        style={{ borderRadius: 8 }}
                        extra={<RiseOutlined style={{color: '#1890ff'}} />}
                    >
                        <div style={{ height: 400, width: '100%' }}>
                            <ResponsiveContainer>
                                {viewMode === 'volume' ? (
                                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="date" tickFormatter={(d) => dayjs(d).format('DD MMM')} />
                                        <YAxis tickFormatter={formatVolume} />
                                        <RechartsTooltip 
                                            labelFormatter={(l) => dayjs(l).format('DD MMM YYYY')}
                                            formatter={(val: number) => [`${val.toFixed(2)} Litres`, 'Volume']}
                                        />
                                        <Legend />
                                        <Bar name="Petrol (L)" dataKey="petrolVolume" fill={COLORS.petrol} radius={[4, 4, 0, 0]} />
                                        <Bar name="Diesel (L)" dataKey="dieselVolume" fill={COLORS.diesel} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                ) : (
                                    <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <defs>
                                            <linearGradient id="colorPetrol" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={COLORS.petrol} stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor={COLORS.petrol} stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorDiesel" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={COLORS.diesel} stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor={COLORS.diesel} stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="date" tickFormatter={(d) => dayjs(d).format('DD MMM')} />
                                        <YAxis tickFormatter={formatCurrency} />
                                        <RechartsTooltip 
                                            labelFormatter={(l) => dayjs(l).format('DD MMM YYYY')}
                                            formatter={(val: number) => [`₹ ${val.toFixed(2)}`, 'Revenue']}
                                        />
                                        <Legend />
                                        <Area type="monotone" name="Petrol (₹)" dataKey="petrolAmount" stroke={COLORS.petrol} fill="url(#colorPetrol)" />
                                        <Area type="monotone" name="Diesel (₹)" dataKey="dieselAmount" stroke={COLORS.diesel} fill="url(#colorDiesel)" />
                                    </AreaChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* SECONDARY INSIGHTS */}
            <Row gutter={[16, 16]} style={{marginTop: 24}}>
                 <Col xs={24} md={12}>
                    <Card title="Petrol vs Diesel (Volume Split)" bordered={false} style={{height: 300}}>
                         <div style={{height: 200, width: '100%', display:'flex', justifyContent:'center', alignItems:'center'}}>
                            {/* Simple ratio visualizer */}
                            <div style={{display:'flex', gap: 20, alignItems:'flex-end'}}>
                                <div style={{textAlign:'center'}}>
                                    <div style={{height: 150, width: 60, background: '#f0f0f0', position:'relative', borderRadius: 4, overflow:'hidden'}}>
                                        <div style={{
                                            position:'absolute', bottom:0, width:'100%', 
                                            height: `${(totalPetrolVol / (totalPetrolVol + totalDieselVol) * 100)}%`,
                                            background: COLORS.petrol,
                                            transition: 'height 1s'
                                        }} />
                                    </div>
                                    <div style={{fontWeight:'bold', marginTop: 10}}>Petrol</div>
                                    <div>{((totalPetrolVol / (totalPetrolVol + totalDieselVol)) * 100).toFixed(0)}%</div>
                                </div>
                                <div style={{textAlign:'center'}}>
                                    <div style={{height: 150, width: 60, background: '#f0f0f0', position:'relative', borderRadius: 4, overflow:'hidden'}}>
                                        <div style={{
                                            position:'absolute', bottom:0, width:'100%', 
                                            height: `${(totalDieselVol / (totalPetrolVol + totalDieselVol) * 100)}%`,
                                            background: COLORS.diesel,
                                            transition: 'height 1s'
                                        }} />
                                    </div>
                                    <div style={{fontWeight:'bold', marginTop: 10}}>Diesel</div>
                                    <div>{((totalDieselVol / (totalPetrolVol + totalDieselVol)) * 100).toFixed(0)}%</div>
                                </div>
                            </div>
                         </div>
                    </Card>
                 </Col>
                 <Col xs={24} md={12}>
                     <Card title="Business Health" bordered={false} style={{height: 300}}>
                        <div style={{display: 'flex', flexDirection: 'column', gap: 15}}>
                             <div style={{display:'flex', justifyContent:'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: 10}}>
                                 <Text type="secondary">Revenue / Litre (Avg)</Text>
                                 <Text strong>₹ {(totalRev / (totalPetrolVol + totalDieselVol || 1)).toFixed(2)}</Text>
                             </div>
                             <div style={{display:'flex', justifyContent:'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: 10}}>
                                 <Text type="secondary">Best Selling Day</Text>
                                 <Text strong>{dayjs(data.reduce((prev, current) => (prev.totalRevenue > current.totalRevenue) ? prev : current, data[0] || {}).date).format('DD MMM YYYY')}</Text>
                             </div>
                             <div style={{display:'flex', justifyContent:'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: 10}}>
                                 <Text type="secondary">Days Tracked</Text>
                                 <Text strong>{data.length} Days</Text>
                             </div>
                        </div>
                     </Card>
                 </Col>
            </Row>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;