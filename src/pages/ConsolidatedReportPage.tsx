// src/pages/ConsolidatedReportPage.tsx
import React, { useState, useEffect } from 'react';
import { Table, DatePicker, Button, Typography, message, Card } from 'antd';
import { FilePdfOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getConsolidatedReport } from '../services/dsr';
import { getStationName } from '../services/auth';
import '../index.css';


const { Title, Text } = Typography;

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
        row.shiftType,
        row.petrolVolume?.toFixed(2),
        row.petrolRate?.toFixed(2),
        row.petrolAmount?.toFixed(2),
        row.dieselVolume?.toFixed(2),
        row.dieselRate?.toFixed(2),
        row.dieselAmount?.toFixed(2),
        row.totalAmount?.toFixed(2)
    ]);

    // Footer Row
    tableBody.push([
        'TOTAL', '',
        totalPVol.toFixed(2), '', totalPAmt.toFixed(2),
        totalDVol.toFixed(2), '', totalDAmt.toFixed(2),
        grandTotal.toFixed(2)
    ]);

    autoTable(doc, {
        head: [[
            { content: 'Date', rowSpan: 2, styles: { valign: 'middle' } },
            { content: 'Shift', rowSpan: 2, styles: { valign: 'middle' } },
            { content: 'Petrol', colSpan: 3, styles: { halign: 'center' } },
            { content: 'Diesel', colSpan: 3, styles: { halign: 'center' } },
            { content: 'Total', rowSpan: 2, styles: { valign: 'middle' } }
        ], [
            'Vol', 'Rate', 'Amt', 
            'Vol', 'Rate', 'Amt'
        ]],
        body: tableBody,
        startY: 30,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 0 },
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
        width: 100,
        render: (text: string) => dayjs(text).format('DD-MM-YYYY') 
    },
    {
      title: 'Petrol',
      children: [
        { title: 'SALE (L)', dataIndex: 'petrolVolume', key: 'pv', render: (v: number) => v?.toFixed(2), align: 'right' as const },
        { title: 'Avg Rate', dataIndex: 'petrolRate', key: 'pr', render: (v: number) => v?.toFixed(2), align: 'right' as const },
        { title: 'AMOUNT (₹)', dataIndex: 'petrolAmount', key: 'pa', render: (v: number) => v?.toFixed(2), align: 'right' as const },
      ]
    },
    {
      title: 'Diesel',
      children: [
        { title: 'SALE (L)', dataIndex: 'dieselVolume', key: 'dv', render: (v: number) => v?.toFixed(2), align: 'right' as const },
        { title: 'Avg Rate', dataIndex: 'dieselRate', key: 'dr', render: (v: number) => v?.toFixed(2), align: 'right' as const },
        { title: 'AMOUNT (₹)', dataIndex: 'dieselAmount', key: 'da', render: (v: number) => v?.toFixed(2), align: 'right' as const },
      ]
    },
    { 
        title: 'Total (₹)', 
        dataIndex: 'totalAmount', 
        key: 'total', 
        render: (v: number) => <strong>{v?.toFixed(2)}</strong>,
        align: 'right' as const 
    },
  ];

  return (
    <div style={{ padding: 0 }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <Title level={2} style={{ margin: 0 }}>{stationName}</Title>
          <Text type="secondary" style={{ fontSize: 16 }}>Month Sales Report</Text>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Text strong>Select Month:</Text>
          <DatePicker 
            picker="month" 
            value={selectedMonth} 
            onChange={(val) => val && setSelectedMonth(val)} 
            allowClear={false}
          />
          <Button type="primary" onClick={fetchData} loading={loading}>Load Data</Button>
        </div>
        <Button 
            type="primary" 
            danger 
            icon={<FilePdfOutlined />} 
            onClick={downloadPDF}
            disabled={data.length === 0}
        >
            Download PDF
        </Button>
      </div>
      
      <Card bodyStyle={{ padding: 0 }}>
        <Table 
            dataSource={data} 
            columns={columns} 
            rowKey={(record) => `${record.date}-${record.shiftType}`}
            bordered
            size="small"
            scroll={{ x: 800 }}
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
                    <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 'bold' }}>
                        <Table.Summary.Cell index={0} align="center">MONTH TOTAL</Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">{totalPVol.toFixed(2)}</Table.Summary.Cell>
                        <Table.Summary.Cell index={3} align="right">-</Table.Summary.Cell>
                        <Table.Summary.Cell index={3} align="right">{totalPAmt.toFixed(2)}</Table.Summary.Cell>
                        <Table.Summary.Cell index={5} align="right">{totalDVol.toFixed(2)}</Table.Summary.Cell>
                        <Table.Summary.Cell index={6} align="right">-</Table.Summary.Cell>
                        <Table.Summary.Cell index={6} align="right">{totalDAmt.toFixed(2)}</Table.Summary.Cell>
                        <Table.Summary.Cell index={8} align="right">{grandTotal.toFixed(2)}</Table.Summary.Cell>
                    </Table.Summary.Row>
                );
            }}
        />
      </Card>
    </div>
  );
};

export default ConsolidatedReportPage;