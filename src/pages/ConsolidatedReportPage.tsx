import React, { useState, useEffect } from 'react';
import { Table, DatePicker, Button, Typography, message, Card } from 'antd';
import { FilePdfOutlined, CalendarOutlined, BarChartOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getConsolidatedReport } from '../services/dsr';
import { getStationName } from '../services/auth';
import '../index.css';

const { Title, Text } = Typography;

// Helper for currency formatting (Commas + 2 decimals)
const fmtMoney = (val: number | undefined) => 
    (val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Helper for volume (No commas, just 2 decimals)
const fmtVol = (val: number | undefined) => (val || 0).toFixed(2);

const ConsolidatedReportPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const stationName = getStationName();

  const fetchData = async () => {
    setLoading(true);
    try {
      const month = selectedMonth.month() + 1; 
      const year = selectedMonth.year();
      const response = await getConsolidatedReport(month, year);
      setData(response.data);
    } catch (error) {
      message.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  // --- PDF GENERATION ---
  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text(stationName || 'Petrol Station', 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Monthly Sales Report - ${selectedMonth.format('MMMM YYYY')}`, 105, 25, { align: 'center' });

    // Calculate Totals for PDF
    let totalPVol = 0, totalPAmt = 0, totalDVol = 0, totalDAmt = 0, grandTotal = 0;
    data.forEach(d => {
        totalPVol += d.petrolVolume;
        totalPAmt += d.petrolAmount;
        totalDVol += d.dieselVolume;
        totalDAmt += d.dieselAmount;
        grandTotal += d.totalAmount;
    });

    // Table Data
    const tableBody = data.map(row => [
        dayjs(row.date).format('DD/MM'),
        fmtVol(row.petrolVolume),
        fmtVol(row.petrolRate),
        fmtMoney(row.petrolAmount),
        fmtVol(row.dieselVolume),
        fmtVol(row.dieselRate),
        fmtMoney(row.dieselAmount),
        fmtMoney(row.totalAmount)
    ]);

    // Footer Row
    tableBody.push([
        'TOTAL',
        fmtVol(totalPVol), '', fmtMoney(totalPAmt),
        fmtVol(totalDVol), '', fmtMoney(totalDAmt),
        fmtMoney(grandTotal)
    ]);

    autoTable(doc, {
        head: [[
            { content: 'Date', rowSpan: 2, styles: { valign: 'middle' } },
            { content: 'Petrol', colSpan: 3, styles: { halign: 'center', fillColor: [255, 230, 204], textColor: 0 } }, // Light Orange
            { content: 'Diesel', colSpan: 3, styles: { halign: 'center', fillColor: [204, 224, 255], textColor: 0 } }, // Light Blue
            { content: 'Total', rowSpan: 2, styles: { valign: 'middle' } }
        ], [
            'Vol', 'Rate', 'Amt', 
            'Vol', 'Rate', 'Amt'
        ]],
        body: tableBody,
        startY: 30,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 8, cellPadding: 2 },
        // Highlight the Total row
        didParseCell: (data) => {
            if (data.row.index === tableBody.length - 1) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [240, 240, 240];
            }
        }
    });

    doc.save(`Sales_Report_${selectedMonth.format('MM_YYYY')}.pdf`);
  };

 const columns = [
    { 
        title: 'Date', 
        dataIndex: 'date', 
        key: 'date', 
        width: 110,
        fixed: 'left' as const,
        render: (text: string) => <span style={{fontWeight: 600}}>{dayjs(text).format('DD MMM')}</span> 
    },
    {
      title: <span style={{color: '#d97706'}}>PETROL</span>,
      className: 'sub-header petrol', // Utilizes index.css styles
      children: [
        { title: 'Vol (L)', dataIndex: 'petrolVolume', key: 'pv', render: (v: number) => fmtVol(v), align: 'right' as const, width: 100 },
        { title: 'Rate', dataIndex: 'petrolRate', key: 'pr', render: (v: number) => fmtVol(v), align: 'right' as const, width: 80, className: 'text-muted' },
        { title: 'Amount (₹)', dataIndex: 'petrolAmount', key: 'pa', render: (v: number) => <b>{fmtMoney(v)}</b>, align: 'right' as const, width: 120 },
      ]
    },
    {
      title: <span style={{color: '#003399'}}>DIESEL</span>,
      className: 'sub-header diesel', // Utilizes index.css styles
      children: [
        { title: 'Vol (L)', dataIndex: 'dieselVolume', key: 'dv', render: (v: number) => fmtVol(v), align: 'right' as const, width: 100 },
        { title: 'Rate', dataIndex: 'dieselRate', key: 'dr', render: (v: number) => fmtVol(v), align: 'right' as const, width: 80, className: 'text-muted' },
        { title: 'Amount (₹)', dataIndex: 'dieselAmount', key: 'da', render: (v: number) => <b>{fmtMoney(v)}</b>, align: 'right' as const, width: 120 },
      ]
    },
    { 
        title: 'TOTAL (₹)', 
        dataIndex: 'totalAmount', 
        key: 'total', 
        width: 140,
        fixed: 'right' as const,
        render: (v: number) => <span style={{fontWeight: 'bold', fontSize: 15, color: '#108ee9'}}>{fmtMoney(v)}</span>,
        align: 'right' as const 
    },
  ];

  return (
    <div className="page-container" style={{background: '#f0f2f5', minHeight: '100vh'}}>
      {/* Header Section */}
      <div className="sticky-header">
         <div style={{display:'flex', alignItems: 'center', gap: 12}}>
            <BarChartOutlined style={{fontSize: 20, color: '#1890ff'}} />
            <div>
                <div style={{fontWeight: 800, fontSize: 16, color: '#001529', lineHeight: 1.2}}>{stationName}</div>
                <div style={{fontSize: 12, color: '#666'}}>Monthly Consolidated Report</div>
            </div>
         </div>
         
         <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{background: '#fff', padding: '4px 12px', borderRadius: 6, border: '1px solid #d9d9d9', display:'flex', alignItems:'center', gap: 8}}>
                <CalendarOutlined style={{color: '#999'}} />
                <DatePicker 
                    picker="month" 
                    value={selectedMonth} 
                    onChange={(val) => val && setSelectedMonth(val)} 
                    allowClear={false}
                    bordered={false}
                    suffixIcon={null}
                    style={{padding: 0, width: 100, fontWeight: 600}}
                    format="MMMM YYYY"
                />
            </div>
            
            <Button 
                type="primary" 
                danger 
                icon={<FilePdfOutlined />} 
                onClick={downloadPDF}
                disabled={data.length === 0}
            >
                PDF
            </Button>
         </div>
      </div>
      
      <div style={{ padding: 24 }}>
          <Card bodyStyle={{ padding: 0 }} bordered={false} className="industrial-card">
            <Table 
                dataSource={data} 
                columns={columns} 
                rowKey={(record) => `${record.date}-${record.shiftType}`}
                bordered
                size="middle"
                pagination={false}
                scroll={{ x: 1000, y: 'calc(100vh - 220px)' }} // Sticky header for long lists
                className="accounting-table"
                summary={(pageData) => {
                    let totalPVol = 0;
                    let totalPAmt = 0;
                    let totalDVol = 0;
                    let totalDAmt = 0;
                    let grandTotal = 0;

                    pageData.forEach((row) => {
                        totalPVol += row.petrolVolume || 0;
                        totalPAmt += row.petrolAmount || 0;
                        totalDVol += row.dieselVolume || 0;
                        totalDAmt += row.dieselAmount || 0;
                        grandTotal += row.totalAmount || 0;
                    });

                    return (
                        <Table.Summary.Row style={{ background: '#fafafa' }}>
                            <Table.Summary.Cell index={0} colSpan={1} align="center">
                                <span style={{fontWeight: 800, color: '#001529'}}>MONTH TOTAL</span>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={1} align="right" style={{fontWeight: 700}}>{fmtVol(totalPVol)}</Table.Summary.Cell>
                            <Table.Summary.Cell index={2} align="right">-</Table.Summary.Cell>
                            <Table.Summary.Cell index={3} align="right" style={{fontWeight: 700, color: '#d97706'}}>{fmtMoney(totalPAmt)}</Table.Summary.Cell>
                            <Table.Summary.Cell index={4} align="right" style={{fontWeight: 700}}>{fmtVol(totalDVol)}</Table.Summary.Cell>
                            <Table.Summary.Cell index={5} align="right">-</Table.Summary.Cell>
                            <Table.Summary.Cell index={6} align="right" style={{fontWeight: 700, color: '#003399'}}>{fmtMoney(totalDAmt)}</Table.Summary.Cell>
                            <Table.Summary.Cell index={7} align="right" style={{fontWeight: 800, fontSize: 16, color: '#108ee9', background: '#e6f7ff'}}>{fmtMoney(grandTotal)}</Table.Summary.Cell>
                        </Table.Summary.Row>
                    );
                }}
            />
          </Card>
      </div>
    </div>
  );
};

export default ConsolidatedReportPage;