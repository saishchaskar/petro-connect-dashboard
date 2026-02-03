// src/pages/DailyAccountingPage.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Form, Button, InputNumber, message, Switch, Badge, Tag, Space, Divider } from 'antd';
import { 
  LeftOutlined, RightOutlined, UnlockOutlined, SaveOutlined, 
  CalculatorOutlined, ShopOutlined, EditOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import debounce from 'lodash.debounce';
import { getDsrShift, saveDsrShift } from '../services/dsr';
import { getStationConfig } from '../services/config';
import type { DsrShift, FinancialSummary, StationConfig } from '../types';
import '../index.css';

// --- CONFIGURATION ---
const STATION_REGISTRATION_DATE = '2026-01-01'; 
const DENOMINATIONS = [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1] as const;

// Helper to format currency/numbers for display
const fmt = (val: number | undefined | null) => (val || 0).toFixed(2);
const fmtInt = (val: number | undefined | null) => (val || 0).toFixed(0);

const getInitialShift = (config: StationConfig, dateStr: string, shiftType: string): DsrShift => {
  const allNozzles = config.dispensingUnits.flatMap(du => 
    du.nozzles.map((n) => ({
      key: `${du.name}_${n.id}`, duName: du.name, nozzleId: n.id, productType: n.productType,
      startingReading: 0, endingReading: 0, testingSample: 0,
      rate: n.productType === 'Petrol' ? 104.52 : 91.04,
    }))
  );
  return {
    date: dayjs(dateStr), shiftType, isClubbed: false, salesman1: '', salesman2: '', nozzles: allNozzles,
    notes: DENOMINATIONS.map(d => ({ denomination: d, countPetrol: 0, countDiesel: 0 })),
    summary: { totalAmountPetrol: 0, onlinePetrol: 0, cardPetrol: 0, creditPetrol: 0, netCashPetrol: 0, coinsPetrol: 0, receivedCashPetrol: 0, balancePetrol: 0, cashTotalPetrol: 0, totalAmountDiesel: 0, onlineDiesel: 0, cardDiesel: 0, creditDiesel: 0, netCashDiesel: 0, coinsDiesel: 0, receivedCashDiesel: 0, balanceDiesel: 0, cashTotalDiesel: 0 },
    dips: [{ productType: 'Petrol', startingDip: 0, endingDip: 0, density: 0, temperature: 0, saleOrStock: 0 }, { productType: 'Diesel', startingDip: 0, endingDip: 0, density: 0, temperature: 0, saleOrStock: 0 }],
  };
};

const DailyAccountingPage: React.FC = () => {
  const [form] = Form.useForm<DsrShift>();
  const [config] = useState<StationConfig>(getStationConfig());
  const storedRegDate = localStorage.getItem('station_createdAt');
  const REGISTRATION_DATE = storedRegDate ? storedRegDate : STATION_REGISTRATION_DATE;
  const stationName = config.stationName;
 
  const [currentDate, setCurrentDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [currentShift, setCurrentShift] = useState<string>('Day');
  const [shiftData, setShiftData] = useState<DsrShift>(getInitialShift(getStationConfig(), dayjs().format('YYYY-MM-DD'), 'Day'));
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Rate State (Derived from nozzles for UI)
  const [petrolRate, setPetrolRate] = useState<number>(0);
  const [dieselRate, setDieselRate] = useState<number>(0);

  const debouncedSaveRef = useRef<ReturnType<typeof debounce> | null>(null);

  useEffect(() => { loadShift(currentDate, currentShift, config); }, [currentDate, currentShift]);

  // Sync internal rate state when shiftData loads
  useEffect(() => {
    const pRate = shiftData.nozzles.find(n => n.productType === 'Petrol')?.rate || 0;
    const dRate = shiftData.nozzles.find(n => n.productType === 'Diesel')?.rate || 0;
    setPetrolRate(pRate);
    setDieselRate(dRate);
  }, [shiftData.nozzles]);

  const loadShift = async (date: string, shift: string, cfg: StationConfig) => {
    try {
      const existingShift = await getDsrShift(date, shift);
      const skeleton = getInitialShift(cfg, date, shift);
      let loadedShift: DsrShift;

      if (existingShift) {
        setIsLocked(true);
        message.info({ content: `Loaded: ${date} ${shift}`, key: 'load', duration: 1 });
        const mergedNozzles = skeleton.nozzles.map(skel => {
             const saved = existingShift.nozzles?.find(n => n.nozzleId === skel.nozzleId);
             return saved ? { ...skel, ...saved, duName: skel.duName } : skel;
        });
        const mergedNotes = skeleton.notes.map(skel => {
             const saved = existingShift.notes?.find(n => n.denomination === skel.denomination);
             return saved ? { ...skel, ...saved } : skel;
        });
        const safeSummary = { ...skeleton.summary, ...(existingShift.summary || {}) };
        loadedShift = { ...skeleton, ...existingShift, date: dayjs(existingShift.date), nozzles: mergedNozzles, notes: mergedNotes, summary: safeSummary };
      } else {
        setIsLocked(false);
        const prevData = await getPreviousReadings(date, shift);
        if (prevData && prevData.nozzles) {
            skeleton.nozzles = skeleton.nozzles.map(n => {
                const prevN = prevData.nozzles?.find(p => p.nozzleId === n.nozzleId);
                return { ...n, startingReading: prevN ? prevN.endingReading : 0 };
            });
            message.success({ content: 'Readings carried forward', key: 'carry', duration: 1 });
        }
        loadedShift = skeleton;
      }
      const calculated = calculateAll(loadedShift);
      setShiftData(calculated);
      form.setFieldsValue(calculated);
    } catch (error) { console.error('Error loading:', error); }
  };

  const getPreviousReadings = async (date: string, shift: string) => {
      let prevDate = date;
      let prevShift = 'Day';
      if (shift === 'Night') { prevDate = date; prevShift = 'Day'; } 
      else { prevDate = dayjs(date).subtract(1, 'day').format('YYYY-MM-DD'); prevShift = 'Night'; }
      return await getDsrShift(prevDate, prevShift);
  }

  const handleGlobalRateChange = (type: 'Petrol'|'Diesel', newRate: number | null) => {
      if (!newRate) return;
      
      // Update local state for UI
      if (type === 'Petrol') setPetrolRate(newRate);
      else setDieselRate(newRate);

      // Update actual data model
      const updatedNozzles = shiftData.nozzles.map(n => {
          if (n.productType === type) {
              return { ...n, rate: newRate };
          }
          return n;
      });

      const newData = { ...shiftData, nozzles: updatedNozzles };
      const calculated = calculateAll(newData);
      setShiftData(calculated);
      form.setFieldsValue(calculated);
      
      // Trigger auto-save
      if (debouncedSaveRef.current) debouncedSaveRef.current();
  };

  const calculateAll = (data: DsrShift): DsrShift => {
      const updatedNozzles = data.nozzles.map(n => {
        const diff = (n.endingReading || 0) - (n.startingReading || 0);
        const netSale = diff - (n.testingSample || 0);
        return { ...n, readingDiff: diff, netSale, amount: netSale * (n.rate || 0) };
      });
      const updatedNotes = data.notes.map(n => ({ ...n, amountPetrol: (n.countPetrol || 0) * n.denomination, amountDiesel: (n.countDiesel || 0) * n.denomination }));
      const notesTotalPetrol = updatedNotes.reduce((sum, n) => sum + (n.amountPetrol || 0), 0);
      const notesTotalDiesel = updatedNotes.reduce((sum, n) => sum + (n.amountDiesel || 0), 0);
      const totalAmtPetrol = updatedNozzles.filter(n => n.productType === 'Petrol').reduce((sum, n) => sum + (n.amount || 0), 0);
      const totalAmtDiesel = updatedNozzles.filter(n => n.productType === 'Diesel').reduce((sum, n) => sum + (n.amount || 0), 0);
      const s = data.summary;
      let updatedSummary: FinancialSummary;
      
      if (data.isClubbed) {
          // CLUBBED LOGIC: We use the PETROL fields as the "Master" bucket for cash/expenses
          const grandTotal = totalAmtPetrol + totalAmtDiesel;
          // Note: using onlinePetrol, cardPetrol etc as the containers for combined data
          const netCash = grandTotal - (s.onlinePetrol||0) - (s.cardPetrol||0) - (s.creditPetrol||0);
          const recvCash = notesTotalPetrol + (s.coinsPetrol||0);
          
          updatedSummary = { 
              ...s, 
              totalAmountPetrol: totalAmtPetrol, 
              totalAmountDiesel: totalAmtDiesel, 
              // Map calculated clubbed values to the Petrol fields for display
              netCashPetrol: netCash, 
              receivedCashPetrol: recvCash, 
              balancePetrol: netCash - recvCash, 
              cashTotalPetrol: notesTotalPetrol 
          };
      } else {
          // SEPARATE LOGIC
          const netP = totalAmtPetrol - (s.onlinePetrol||0) - (s.cardPetrol||0) - (s.creditPetrol||0);
          const recvP = notesTotalPetrol + (s.coinsPetrol||0);
          const netD = totalAmtDiesel - (s.onlineDiesel||0) - (s.cardDiesel||0) - (s.creditDiesel||0);
          const recvD = notesTotalDiesel + (s.coinsDiesel||0);
          updatedSummary = { ...s, totalAmountPetrol: totalAmtPetrol, totalAmountDiesel: totalAmtDiesel, netCashPetrol: netP, receivedCashPetrol: recvP, balancePetrol: netP - recvP, cashTotalPetrol: notesTotalPetrol, netCashDiesel: netD, receivedCashDiesel: recvD, balanceDiesel: netD - recvD, cashTotalDiesel: notesTotalDiesel };
      }
      return { ...data, nozzles: updatedNozzles, notes: updatedNotes, summary: updatedSummary };
  };

  const prepareDataForSave = async () => {
      const formValues = await form.validateFields();
      const mergedNozzles = shiftData.nozzles.map((orig, idx) => ({ ...orig, ...(formValues.nozzles?.[idx] || {}) }));
      const mergedNotes = shiftData.notes.map((orig, idx) => ({ ...orig, ...(formValues.notes?.[idx] || {}) }));
      const mergedDips = shiftData.dips.map((orig, idx) => ({ ...orig, ...(formValues.dips?.[idx] || {}) }));
      // Ensure rates are preserved from state
      mergedNozzles.forEach(n => {
          if (n.productType === 'Petrol') n.rate = petrolRate;
          if (n.productType === 'Diesel') n.rate = dieselRate;
      });

      const payload: DsrShift = { ...shiftData, ...formValues, date: dayjs(currentDate).format('YYYY-MM-DD'), shiftType: currentShift, nozzles: mergedNozzles, notes: mergedNotes, dips: mergedDips, summary: { ...shiftData.summary, ...formValues.summary } };
      return calculateAll(payload);
  };

  const handleSaveImmediate = useCallback(async () => {
    setIsSaving(true);
    try {
      const finalPayload = await prepareDataForSave();
      setShiftData(finalPayload);
      form.setFieldsValue(finalPayload);
      await saveDsrShift(finalPayload);
      message.success('Shift Saved');
    } catch (e) { message.error('Save failed.'); } finally { setIsSaving(false); }
  }, [form, shiftData, currentDate, currentShift]);

  useEffect(() => {
    if (debouncedSaveRef.current) debouncedSaveRef.current.cancel();
    debouncedSaveRef.current = debounce(handleSaveImmediate, 1000);
    return () => debouncedSaveRef.current?.cancel();
  }, [handleSaveImmediate]);

  const handleSaveAndNext = async () => {
    setIsSaving(true);
    try {
        const finalPayload = await prepareDataForSave();
        await saveDsrShift(finalPayload);
        message.success('Shift Saved & Frozen');
        setIsLocked(true); 
        if (currentShift === 'Day') { setCurrentShift('Night'); } 
        else {
            const nextDay = dayjs(currentDate).add(1, 'day').format('YYYY-MM-DD');
            if (dayjs(nextDay).isAfter(dayjs())) { message.warning("Cannot navigate to future."); return; }
            setCurrentDate(nextDay); setCurrentShift('Day');
        }
    } catch (e) { message.error('Save failed.'); } finally { setIsSaving(false); }
  };

  // --- RENDER HELPERS ---
  const uniqueDUs = Array.from(new Set(shiftData.nozzles.map(n => n.duName)));
  const duHeaders = uniqueDUs.map(duName => ({ name: duName, span: shiftData.nozzles.filter(n => n.duName === duName).length }));
  const canGoBack = dayjs(currentDate).isAfter(REGISTRATION_DATE) || (dayjs(currentDate).isSame(REGISTRATION_DATE) && currentShift === 'Night');

  const CellInput = ({ name, precision = 0, style = {} }: { name: any, precision?: number, style?: React.CSSProperties }) => (
    <Form.Item name={name} style={{ margin: 0 }}>
        <InputNumber className="sheet-input" controls={false} precision={precision} style={style} disabled={isLocked} />
    </Form.Item>
  );

  return (
    <div style={{ background: '#f0f2f5' }}>
        <Form form={form} initialValues={shiftData} component={false} onValuesChange={() => { if (debouncedSaveRef.current) debouncedSaveRef.current(); }}>
            <div style={{ background: 'white', minHeight: '100vh' }}>
                <div style={{
                    padding: '10px 20px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: '1px solid #f0f0f0',
                    position: 'sticky', top: 0, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', zIndex: 100
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                        <Button type="default" icon={<LeftOutlined />} disabled={!canGoBack} onClick={() => {
                            if (currentShift === 'Night') setCurrentShift('Day');
                            else { setCurrentDate(dayjs(currentDate).subtract(1, 'day').format('YYYY-MM-DD')); setCurrentShift('Night'); }
                        }} />
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{dayjs(currentDate).format('ddd, DD MMM YYYY')}</div>
                            <Badge status={currentShift === 'Day' ? 'warning' : 'processing'} text={`${currentShift.toUpperCase()} SHIFT`} />
                        </div>
                        <Button type="default" icon={<RightOutlined />} disabled={!isLocked} onClick={() => {
                            if (currentShift === 'Day') setCurrentShift('Night');
                            else { setCurrentDate(dayjs(currentDate).add(1, 'day').format('YYYY-MM-DD')); setCurrentShift('Day'); }
                        }} />
                    </div>

                    <div
                        style={{ display: 'flex', gap: 10, fontSize: 18, fontWeight: 'bold', color: '#000000ff', textTransform:'uppercase'}}>
                       {stationName}
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                        {isLocked ? <Button danger icon={<UnlockOutlined />} onClick={() => setIsLocked(false)}>Unfreeze</Button> :
                            <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveAndNext} loading={isSaving} style={{ background: '#52c41a', border: 'none' }}>Close Shift</Button>}
                    </div>
                </div>
                
                {/* READINGS & RATE SETTINGS */}
                <div style={{ padding: '20px 20px 5px 20px' }}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 15, background: '#f9f9f9', padding: '10px', borderRadius: 6, border: '1px solid #eee'}}>
                        <div style={{fontSize: 14, fontWeight: 'bold', color: '#1890ff', textTransform:'uppercase'}}>
                            <CalculatorOutlined /> Pump Readings
                        </div>
                        
                        {/* EDITABLE RATES */}
                        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                            <div style={{display:'flex', alignItems:'center', gap: 8}}>
                                <span style={{fontWeight: 600, color: '#d97706'}}>Petrol Rate:</span>
                                <InputNumber 
                                    value={petrolRate} 
                                    onChange={(val) => handleGlobalRateChange('Petrol', val)}
                                    precision={2}
                                    prefix="₹"
                                    disabled={isLocked}
                                    style={{width: 100}}
                                />
                            </div>
                            <div style={{display:'flex', alignItems:'center', gap: 8}}>
                                <span style={{fontWeight: 600, color: '#0369a1'}}>Diesel Rate:</span>
                                <InputNumber 
                                    value={dieselRate} 
                                    onChange={(val) => handleGlobalRateChange('Diesel', val)}
                                    precision={2}
                                    prefix="₹"
                                    disabled={isLocked}
                                    style={{width: 100}}
                                />
                            </div>
                        </div>
                    </div>

                    <table className="accounting-table">
                        <thead>
                            <tr style={{borderTop: '2px solid #001529'}}>
                                <th rowSpan={2} style={{width: 160, textAlign:'left', paddingLeft: 15}}>Nozzle ID</th>
                                {duHeaders.filter(du => du.span > 0).map(du => (<th key={du.name} colSpan={du.span} style={{background:'#f1f5f9'}}>{du.name}</th>))}
                                <th rowSpan={2} style={{width: 100}}>Sale (L)</th>
                                <th rowSpan={2} style={{width: 120, background: '#fef3c7', borderTop: '3px solid #f59e0b'}}>Amount (₹)</th>
                            </tr>
                            <tr>{shiftData.nozzles.map((n) => (<th key={n.key} style={{fontSize: 10, color: n.productType === 'Petrol' ? '#d97706' : '#0369a1'}}>{n.nozzleId} <br/> {n.productType.substring(0,1)}</th>))}</tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="row-header">Opening Reading</td>
                                {shiftData.nozzles.map((n, idx) => (<td key={n.key}><CellInput name={['nozzles', idx, 'startingReading']} precision={2} /></td>))}
                                <td className="calc-cell" style={{background:'#f8fafc'}}></td>
                                <td className="calc-cell" style={{background:'#f8fafc'}}></td>
                            </tr>
                            {/* <tr>
                                <td className="row-header">Closing Reading</td>
                                {shiftData.nozzles.map((n, idx) => (<td key={n.key}><CellInput name={['nozzles', idx, 'endingReading']} precision={2} /></td>))}
                                <td className="calc-cell" style={{background:'#f8fafc'}}></td>
                                <td className="calc-cell" style={{background:'#f8fafc'}}></td>
                            </tr> */}
                            <tr>
                                <td className="row-header" style={{fontSize: 11}}>Less: Testing</td>
                                {shiftData.nozzles.map((n, idx) => (<td key={n.key}><CellInput name={['nozzles', idx, 'testingSample']} precision={2} style={{color:'#ef4444'}} /></td>))}
                                <td className="calc-cell" style={{background:'#f8fafc'}}></td>
                                <td className="calc-cell" style={{background:'#f8fafc'}}></td>
                            </tr>
                            <tr style={{borderTop: '2px solid #e2e8f0', background: '#f8fafc'}}>
                                <td className="row-header">Net Sale - Ltr</td>
                                {shiftData.nozzles.map((n) => (<td key={n.key} className="calc-cell">{fmt(n.readingDiff)}</td>))}
                                <td className="calc-cell bold" style={{color:'#1890ff'}}>{fmt(shiftData.nozzles.reduce((acc,curr)=> acc + (curr.netSale||0), 0))}</td>
                                <td className="calc-cell bold" style={{fontSize: 14}}>{fmt(shiftData.nozzles.reduce((acc,curr)=> acc + (curr.amount||0), 0))}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* --- TOGGLE BAR --- */}
                <div style={{ background: '#f0fdf4', border: '1px dashed #52c41a', margin: '20px', padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                     <Form.Item name="isClubbed" valuePropName="checked" style={{margin:0}}>
                         <Switch checkedChildren="CLUBBED ACCOUNTING (ON)" unCheckedChildren="Separate Accounting (OFF)" />
                     </Form.Item>
                </div>

                {/* --- CASH & EXPENSE GRID --- */}
                <div style={{ padding: '0 20px 20px 20px' }}>
                    
                    {shiftData.isClubbed ? (
                        /* CLUBBED VIEW: SINGLE CENTERED TABLE */
                        <div style={{ maxWidth: 800, margin: '0 auto' }}>
                            <div className="section-header-row" style={{display:'flex', justifyContent:'space-between', marginBottom: 5, borderBottom: '2px solid #52c41a', paddingBottom: 5}}>
                                <span style={{fontWeight:'bold', color: '#52c41a'}}>COMBINED COLLECTION</span>
                                <span style={{fontWeight:'bold'}}>Total Rev: ₹ {fmt((shiftData.summary.totalAmountPetrol||0) + (shiftData.summary.totalAmountDiesel||0))}</span>
                            </div>
                            {/* We pass 'Petrol' here because we store combined data in Petrol fields when clubbed */}
                            {renderCollectionTable('Petrol', shiftData, true)}
                        </div>
                    ) : (
                        /* SEPARATE VIEW: TWO COLUMNS */
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <div>
                                <div className="section-header-row" style={{display:'flex', justifyContent:'space-between', marginBottom: 5, borderBottom: '2px solid #faad14', paddingBottom: 5}}>
                                    <span style={{fontWeight:'bold', color: '#d97706'}}>PETROL COLLECTION</span>
                                    <span style={{fontWeight:'bold'}}>₹ {fmt(shiftData.summary.totalAmountPetrol)}</span>
                                </div>
                                {renderCollectionTable('Petrol', shiftData, false)}
                            </div>
                            <div>
                                <div className="section-header-row" style={{display:'flex', justifyContent:'space-between', marginBottom: 5, borderBottom: '2px solid #1890ff', paddingBottom: 5}}>
                                    <span style={{fontWeight:'bold', color: '#0369a1'}}>DIESEL COLLECTION</span>
                                    <span style={{fontWeight:'bold'}}>₹ {fmt(shiftData.summary.totalAmountDiesel)}</span>
                                </div>
                                {renderCollectionTable('Diesel', shiftData, false)}
                            </div>
                        </div>
                    )}
                </div>

                 {/* --- DIP READINGS --- */}
                 <div style={{ padding: 20 }}>
                    <Divider orientation="left" style={{margin: '10px 0'}}>Stock Management (Dip Reading)</Divider>
                    <table className="accounting-table">
                        <thead>
                            <tr>
                                <th style={{width: 200}}>Product</th>
                                <th>Opening Dip (mm)</th>
                                {/* <th>Closing Dip (mm)</th> */}
                                <th>Density (kg/m³)</th>
                                <th>Temperature (°C)</th>
                                <th>Stock/Sale calc</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="row-header" style={{borderLeft: '4px solid #faad14'}}>PETROL</td>
                                <td><CellInput name={['dips', 0, 'startingDip']} precision={0} /></td>
                                {/* <td><CellInput name={['dips', 0, 'endingDip']} precision={0} /></td> */}
                                <td><CellInput name={['dips', 0, 'density']} precision={1} /></td>
                                <td><CellInput name={['dips', 0, 'temperature']} precision={1} /></td>
                                <td><CellInput name={['dips', 0, 'saleOrStock']} precision={0} /></td>
                            </tr>
                            <tr>
                                <td className="row-header" style={{borderLeft: '4px solid #1890ff'}}>DIESEL</td>
                                <td><CellInput name={['dips', 1, 'startingDip']} precision={0} /></td>
                                {/* <td><CellInput name={['dips', 1, 'endingDip']} precision={0} /></td> */}
                                <td><CellInput name={['dips', 1, 'density']} precision={1} /></td>
                                <td><CellInput name={['dips', 1, 'temperature']} precision={1} /></td>
                                <td><CellInput name={['dips', 1, 'saleOrStock']} precision={0} /></td>
                            </tr>
                        </tbody>
                    </table>
                 </div>
                 <div style={{height: 100}}></div>
            </div>
        </Form>
    </div>
  );

  function renderCollectionTable(type: 'Petrol' | 'Diesel', data: DsrShift, isClubbedView: boolean) {
      return (
        <table className="accounting-table">
            <thead>
                <tr>
                    <th style={{width: '35%'}}>Mode</th>
                    <th style={{width: '30%'}}>Amount</th>
                    <th style={{width: '35%'}}>Cash Denom</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Online (UPI)</td>
                    <td><CellInput name={['summary', `online${type}`]} precision={2} /></td>
                    <td rowSpan={8} style={{verticalAlign: 'top', padding: 0}}>
                        <table style={{width: '100%', borderCollapse: 'collapse'}}>
                            <tbody>
                                {data.notes.map((note, idx) => (
                                    <tr key={note.denomination} style={{borderBottom: '1px solid #f0f0f0'}}>
                                        <td style={{padding: '2px 5px', fontSize: 11, color: '#888'}}>{note.denomination} x</td>
                                        <td style={{padding: 0}}>
                                            <CellInput name={['notes', idx, `count${type}`]} precision={0} style={{height: 24, fontSize: 12}} />
                                        </td>
                                        <td style={{textAlign:'right', padding: '2px 5px', fontSize: 11, width: 50}}>
                                            {fmtInt(type === 'Petrol' ? note.amountPetrol : note.amountDiesel)}
                                        </td>
                                    </tr>
                                ))}
                                <tr style={{background: '#fafafa'}}>
                                    <td style={{padding: '2px 5px', fontSize: 11, fontWeight: 'bold'}}>Coins</td>
                                    <td colSpan={2} style={{padding: 0}}>
                                         <CellInput name={['summary', `coins${type}`]} precision={2} style={{height: 24}} />
                                    </td>
                                </tr>
                                <tr style={{background: '#f0fdf4'}}>
                                    <td colSpan={2} style={{padding: '4px', fontWeight: 'bold', fontSize: 11}}>TOTAL CASH</td>
                                    <td style={{textAlign:'right', padding: '4px', fontWeight: 'bold', fontSize: 12}}>
                                        {fmt(type === 'Petrol' ? data.summary.cashTotalPetrol : data.summary.cashTotalDiesel)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td>Credit Card</td>
                    <td><CellInput name={['summary', `card${type}`]} precision={2} /></td>
                </tr>
                <tr>
                    <td>Credit (Udhaar)</td>
                    <td><CellInput name={['summary', `credit${type}`]} precision={2} /></td>
                </tr>
                <tr style={{background: '#f8fafc'}}>
                    <td style={{fontSize: 11}}>Expected Cash - ₹</td>
                    {/* @ts-ignore */}
                    <td className="calc-cell">{fmt(data.summary[`netCash${type}`])}</td>
                </tr>
                <tr style={{background: '#f8fafc'}}>
                    <td style={{fontSize: 11}}>Actual Cash - ₹</td>
                    {/* @ts-ignore */}
                    <td className="calc-cell bold">{fmt(data.summary[`receivedCash${type}`])}</td>
                </tr>
                <tr>
                    <td style={{fontWeight:'bold'}}>Short/Excess</td>
                    {/* @ts-ignore */}
                    <td className={`calc-cell bold`} style={{fontSize: 15, color: (data.summary[`balance${type}`] || 0) > 0 ? '#ef4444' : '#22c55e'}}>
                        {/* @ts-ignore */}
                        {fmt(data.summary[`balance${type}`])}
                    </td>
                </tr>
            </tbody>
        </table>
      );
  }
};

export default DailyAccountingPage;