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
  
  const uniqueDUs = Array.from(new Set(shiftData.nozzles.map(n => n.duName)));
  const duHeaders = uniqueDUs.map(duName => ({ 
      name: duName, 
      span: shiftData.nozzles.filter(n => n.duName === duName).length 
  }));

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
                    <th rowSpan={2} style={{width: 90}}>Sale (L)</th>
                    <th rowSpan={2} style={{width: 110}}>Amount (₹)</th>
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
                <tr>
                    <td className="row-label">Opening</td>
                    {shiftData.nozzles.map((n, idx) => (
                        <td key={n.key}>
                            <Form.Item name={['nozzles', idx, 'startingReading']} noStyle>
                                {/* No formatting for Readings */}
                                <InputNumber 
                                    className="sheet-input" 
                                    controls={false} 
                                    disabled={isLocked}
                                />
                            </Form.Item>
                        </td>
                    ))}
                    <td style={{background: '#f9f9f9'}}></td><td style={{background: '#f9f9f9'}}></td>
                </tr>
                <tr>
                    <td className="row-label">Closing</td>
                    {shiftData.nozzles.map((n, idx) => (
                        <td key={n.key} className={n.endingReading > 0 && n.endingReading < (n.startingReading||0) ? 'error-cell' : ''}>
                            <Form.Item name={['nozzles', idx, 'endingReading']} noStyle>
                                {/* No formatting for Readings */}
                                <InputNumber 
                                    className="sheet-input" 
                                    controls={false} 
                                    disabled={isLocked}
                                />
                            </Form.Item>
                        </td>
                    ))}
                    <td style={{background: '#f9f9f9'}}></td><td style={{background: '#f9f9f9'}}></td>
                </tr>
                <tr>
                    <td className="row-label">Test (L)</td>
                    {shiftData.nozzles.map((n, idx) => (
                        <td key={n.key}>
                            <Form.Item name={['nozzles', idx, 'testingSample']} noStyle>
                                {/* No formatting for Readings */}
                                <InputNumber 
                                    className="sheet-input" 
                                    style={{color: '#E21D24'}} 
                                    controls={false} 
                                    disabled={isLocked}
                                />
                            </Form.Item>
                        </td>
                    ))}
                    <td style={{background: '#f9f9f9'}}></td><td style={{background: '#f9f9f9'}}></td>
                </tr>
                <tr style={{background: '#fdfdfd', borderTop: '2px solid #f0f0f0'}}>
                    <td className="row-label">Net Sale</td>
                    {shiftData.nozzles.map((n) => (
                        <td key={n.key} className="calc-cell" style={{textAlign:'right', paddingRight: 8, color: '#666'}}>
                            {fmtVol(n.netSale)}
                        </td>
                    ))}
                    <td style={{textAlign:'right', paddingRight: 8, fontWeight:'bold', color: '#003399'}}>{fmtVol(shiftData.nozzles.reduce((a,c)=>a+(c.netSale||0),0))}</td>
                    {/* Amount Column uses Money Formatter (Commas) */}
                    <td style={{textAlign:'right', paddingRight: 8, fontWeight:'bold', fontSize: 13}}>{fmtMoney(shiftData.nozzles.reduce((a,c)=>a+(c.amount||0),0))}</td>
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