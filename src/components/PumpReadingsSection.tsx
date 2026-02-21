import React, { memo } from 'react';
import { InputNumber, Form } from 'antd';
import { CalculatorOutlined } from '@ant-design/icons';
import type { DsrShift } from '../types';

// Helper for formatting Volume (Litres) - No Commas, just decimals
const fmtVol = (val: number | undefined) => (val || 0).toFixed(2);

// Helper for formatting Money - Commas + 2 decimals
const fmtMoney = (val: number | undefined) => (val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PumpReadingsSection = memo(({ 
  shiftData, 
  petrolRate, 
  dieselRate, 
  isLocked,
  onRateChange 
}: {
  shiftData: DsrShift;
  petrolRate: number;
  dieselRate: number;
  isLocked: boolean;
  onRateChange: (type: 'Petrol'|'Diesel', val: number | null) => void;
}) => {
  
  // Calculate DU grouping for headers
  const uniqueDUs = Array.from(new Set(shiftData.nozzles.map(n => n.duName)));
  const duHeaders = uniqueDUs.map(duName => ({ 
      name: duName, 
      span: shiftData.nozzles.filter(n => n.duName === duName).length 
  }));

  // Calculate shift totals
  const totalGrossVol = shiftData.nozzles.reduce((a,c)=>a+(c.readingDiff||0),0); // Total Difference
  const totalVol = shiftData.nozzles.reduce((a,c)=>a+(c.netSale||0),0);         // Total Net Sale
  const totalAmt = shiftData.nozzles.reduce((a,c)=>a+(c.amount||0),0);          // Total Amount

  return (
    <div className="industrial-card">
      <div className="section-header">
          <div className="title"><CalculatorOutlined /> Pump Readings</div>
          <div style={{display:'flex'}}>
              <div className="rate-group" style={{color: '#d97706'}}>
                  <span>PETROL:</span>
                  <InputNumber 
                      value={petrolRate} onChange={(val) => onRateChange('Petrol', val)}
                      precision={2} prefix="₹" disabled={isLocked} className="rate-input"
                  />
              </div>
              <div className="rate-group" style={{color: '#003399'}}>
                  <span>DIESEL:</span>
                  <InputNumber 
                      value={dieselRate} onChange={(val) => onRateChange('Diesel', val)}
                      precision={2} prefix="₹" disabled={isLocked} className="rate-input"
                  />
              </div>
          </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="accounting-table">
            <thead>
                <tr>
                    <th rowSpan={2} className="sticky-col" style={{width: 120}}>Nozzle ID</th>
                    {duHeaders.filter(d => d.span > 0).map(du => (
                        <th key={du.name} colSpan={du.span} style={{background: '#f8fafc'}}>{du.name}</th>
                    ))}
                    <th rowSpan={2} style={{width: 100}}>Total Sale (L)</th>
                    <th rowSpan={2} style={{width: 120}}>Total Amt (₹)</th>
                </tr>
                <tr>
                    {shiftData.nozzles.map((n) => (
                        <th key={n.key} className={`sub-header ${n.productType.toLowerCase()}`}>
                            {n.nozzleId}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {/* OPENING */}
                <tr>
                    <td className="row-label">Opening</td>
                    {shiftData.nozzles.map((n, idx) => (
                        <td key={n.key}>
                            <Form.Item name={['nozzles', idx, 'startingReading']} noStyle>
                                <InputNumber className="sheet-input" controls={false} disabled={isLocked} />
                            </Form.Item>
                        </td>
                    ))}
                    <td style={{background: '#f9f9f9'}}></td>
                    <td style={{background: '#f9f9f9'}}></td>
                </tr>

                {/* CLOSING */}
                <tr>
                    <td className="row-label">Closing</td>
                    {shiftData.nozzles.map((n, idx) => (
                        <td key={n.key} className={n.endingReading > 0 && n.endingReading < (n.startingReading||0) ? 'error-cell' : ''}>
                            <Form.Item name={['nozzles', idx, 'endingReading']} noStyle>
                                <InputNumber className="sheet-input" controls={false} disabled={isLocked} />
                            </Form.Item>
                        </td>
                    ))}
                    <td style={{background: '#f9f9f9'}}></td>
                    <td style={{background: '#f9f9f9'}}></td>
                </tr>

                {/* NEW ROW: READING DIFFERENCE (Closing - Opening) */}
                <tr style={{background: '#fff'}}>
                    <td className="row-label" style={{color: '#666', fontStyle: 'italic'}}>Difference</td>
                    {shiftData.nozzles.map((n) => (
                        <td key={n.key} className="calc-cell" style={{textAlign:'right', paddingRight: 8, color: '#888'}}>
                            {fmtVol(n.readingDiff)}
                        </td>
                    ))}
                    <td style={{textAlign:'right', paddingRight: 8, fontWeight:'bold', color: '#666'}}>{fmtVol(totalGrossVol)}</td>
                    <td style={{background: '#f9f9f9'}}></td>
                </tr>

                {/* TEST */}
                <tr>
                    <td className="row-label">Test (L)</td>
                    {shiftData.nozzles.map((n, idx) => (
                        <td key={n.key}>
                            <Form.Item name={['nozzles', idx, 'testingSample']} noStyle>
                                <InputNumber className="sheet-input" style={{color: '#E21D24'}} controls={false} disabled={isLocked} />
                            </Form.Item>
                        </td>
                    ))}
                    <td style={{background: '#f9f9f9'}}></td>
                    <td style={{background: '#f9f9f9'}}></td>
                </tr>

                {/* NET SALE (L) */}
                <tr style={{background: '#fdfdfd', borderTop: '2px solid #f0f0f0'}}>
                    <td className="row-label">Net Sale</td>
                    {shiftData.nozzles.map((n) => (
                        <td key={n.key} className="calc-cell" style={{textAlign:'right', paddingRight: 8, color: '#666'}}>
                            {fmtVol(n.netSale)}
                        </td>
                    ))}
                    <td style={{textAlign:'right', paddingRight: 8, fontWeight:'bold', color: '#003399'}}>{fmtVol(totalVol)}</td>
                    <td style={{background: '#f9f9f9'}}></td>
                </tr>

                {/* AMOUNT (₹) */}
                <tr style={{background: '#f0fdf4'}}> 
                    <td className="row-label" style={{color: '#166534'}}>Amount (₹)</td>
                    {shiftData.nozzles.map((n) => (
                        <td key={n.key} className="calc-cell" style={{textAlign:'right', paddingRight: 8, color: '#166534'}}>
                            {fmtMoney(n.amount)}
                        </td>
                    ))}
                    <td style={{background: '#f9f9f9'}}></td>
                    <td style={{textAlign:'right', paddingRight: 8, fontWeight:'bold', fontSize: 13, color: '#166534'}}>{fmtMoney(totalAmt)}</td>
                </tr>

                {/* DU TOTAL (₹) */}
                <tr style={{background: '#dcfce7', borderTop: '2px solid #bbf7d0'}}>
                    <td className="row-label" style={{color: '#14532d', fontWeight: 800}}>DU TOTAL</td>
                    {duHeaders.filter(d => d.span > 0).map(du => {
                        const duTotal = shiftData.nozzles
                            .filter(n => n.duName === du.name)
                            .reduce((sum, n) => sum + (n.amount || 0), 0);
                        return (
                            <td key={du.name} colSpan={du.span} className="calc-cell" style={{textAlign:'center', fontWeight: 800, color: '#14532d', borderLeft: '1px solid #bbf7d0'}}>
                                {fmtMoney(duTotal)}
                            </td>
                        );
                    })}
                    <td style={{background: '#f9f9f9'}}></td> 
                    <td style={{textAlign:'right', paddingRight: 8, fontWeight: 800, fontSize: 13, color: '#14532d'}}>{fmtMoney(totalAmt)}</td>
                </tr>
            </tbody>
        </table>
      </div>
    </div>
  );
}, (prev, next) => {
    // Only re-render if data or locked status changes
    return prev.shiftData === next.shiftData && prev.isLocked === next.isLocked;
});

export default PumpReadingsSection;