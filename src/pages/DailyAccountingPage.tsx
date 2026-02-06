import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Form, Button, InputNumber, message, Switch, Badge, Modal, Divider } from 'antd';
import { 
  LeftOutlined, RightOutlined, UnlockOutlined, SaveOutlined, 
  ShopOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import debounce from 'lodash.debounce';
import { getDsrShift, saveDsrShift } from '../services/dsr';
import { getStationConfig } from '../services/config';
import type { DsrShift, FinancialSummary, StationConfig } from '../types';
import PumpReadingsSection from '../components/PumpReadingsSection'; 
import '../index.css';

const STATION_REGISTRATION_DATE = '2026-01-01'; 
const DENOMINATIONS = [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1] as const;
const AUTO_SAVE_DELAY = 1000;

// Helper: Format currency with commas (e.g., 1,25,000.00)
const fmtMoney = (val: number | undefined | null) => 
    (val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtInt = (val: number | undefined | null) => (val || 0).toFixed(0);
const fmt = (val: number | undefined | null) => (val || 0).toFixed(2);

// --- HELPER: Formatter for Financial Inputs (Commas) ---
const formatFinancial = (value: number | string | undefined) => {
    if (value === undefined || value === null) return '';
    const list = `${value}`.split('.');
    const prefix = list[0].charAt(0) === '-' ? '-' : '';
    let num = prefix ? list[0].slice(1) : list[0];
    let result = '';
    while (num.length > 3) {
        result = `,${num.slice(-3)}${result}`;
        num = num.slice(0, num.length - 3);
    }
    if (num) { result = num + result; }
    return `${prefix}${result}${list[1] ? `.${list[1]}` : ''}`;
};

const parseFinancial = (value: string | undefined) => {
    return value ? value.replace(/,/g, '') : '';
};

// --- COMPONENT: CellInput ---
// Prop 'format' controls if we show commas or not.
const CellInput = ({ 
    name, 
    style = {}, 
    disabled,
    format = 'number' // 'number' = plain, 'financial' = commas
}: { 
    name: any, 
    style?: React.CSSProperties, 
    disabled?: boolean,
    format?: 'number' | 'financial'
}) => (
  <Form.Item name={name} style={{ margin: 0 }}>
      <InputNumber 
          className="sheet-input" 
          controls={false} 
          stringMode={false} 
          style={style} 
          disabled={disabled} 
          // Only apply comma formatter if it is a financial field
          formatter={format === 'financial' ? formatFinancial : undefined}
          parser={format === 'financial' ? (parseFinancial as any) : undefined}
          onFocus={(e) => e.target.select()} 
          onWheel={(e) => e.currentTarget.blur()} 
      />
  </Form.Item>
);

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
  
  const [petrolRate, setPetrolRate] = useState<number>(0);
  const [dieselRate, setDieselRate] = useState<number>(0);

  const debouncedSaveRef = useRef<ReturnType<typeof debounce> | null>(null);

  useEffect(() => { loadShift(currentDate, currentShift, config); }, [currentDate, currentShift]);

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

  const handleGlobalRateChange = useCallback((type: 'Petrol'|'Diesel', newRate: number | null) => {
      if (!newRate) return;
      if (type === 'Petrol') setPetrolRate(newRate); else setDieselRate(newRate);

      const updatedNozzles = shiftData.nozzles.map(n => {
          if (n.productType === type) return { ...n, rate: newRate };
          return n;
      });
      const newData = { ...shiftData, nozzles: updatedNozzles };
      const calculated = calculateAll(newData);
      setShiftData(calculated);
      form.setFieldsValue(calculated);
      if (debouncedSaveRef.current) debouncedSaveRef.current();
  }, [shiftData, form]);

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
          const grandTotal = totalAmtPetrol + totalAmtDiesel;
          const netCash = grandTotal - (s.onlinePetrol||0) - (s.cardPetrol||0) - (s.creditPetrol||0);
          const recvCash = notesTotalPetrol + (s.coinsPetrol||0);
          updatedSummary = { ...s, totalAmountPetrol: totalAmtPetrol, totalAmountDiesel: totalAmtDiesel, netCashPetrol: netCash, receivedCashPetrol: recvCash, balancePetrol: netCash - recvCash, cashTotalPetrol: notesTotalPetrol };
      } else {
          const netP = totalAmtPetrol - (s.onlinePetrol||0) - (s.cardPetrol||0) - (s.creditPetrol||0);
          const recvP = notesTotalPetrol + (s.coinsPetrol||0);
          const netD = totalAmtDiesel - (s.onlineDiesel||0) - (s.cardDiesel||0) - (s.creditDiesel||0);
          const recvD = notesTotalDiesel + (s.coinsDiesel||0);
          updatedSummary = { ...s, totalAmountPetrol: totalAmtPetrol, totalAmountDiesel: totalAmtDiesel, netCashPetrol: netP, receivedCashPetrol: recvP, balancePetrol: netP - recvP, cashTotalPetrol: notesTotalPetrol, netCashDiesel: netD, receivedCashDiesel: recvD, balanceDiesel: netD - recvD, cashTotalDiesel: notesTotalDiesel };
      }
      return { ...data, nozzles: updatedNozzles, notes: updatedNotes, summary: updatedSummary };
  };

  const handleValuesChange = (changedValues: any, allValues: any) => {
      const mergedNozzles = shiftData.nozzles.map((orig, idx) => ({ ...orig, ...(allValues.nozzles?.[idx] || {}) }));
      const mergedNotes = shiftData.notes.map((orig, idx) => ({ ...orig, ...(allValues.notes?.[idx] || {}) }));
      const mergedDips = shiftData.dips.map((orig, idx) => ({ ...orig, ...(allValues.dips?.[idx] || {}) }));

      mergedNozzles.forEach(n => {
          if (n.productType === 'Petrol') n.rate = petrolRate;
          if (n.productType === 'Diesel') n.rate = dieselRate;
      });

      const payload = { 
          ...shiftData, ...allValues, nozzles: mergedNozzles, notes: mergedNotes, dips: mergedDips,
          summary: { ...shiftData.summary, ...(allValues.summary || {}) } 
      };

      const calculated = calculateAll(payload);
      setShiftData(calculated);
      if (debouncedSaveRef.current) debouncedSaveRef.current();
  };

  const validateShiftBeforeSave = (data: DsrShift): boolean => {
    const errors: string[] = [];
    data.nozzles.forEach(n => {
        if (n.endingReading !== undefined && n.endingReading !== null && n.endingReading > 0) {
            if (n.endingReading < (n.startingReading || 0)) {
                errors.push(`<b>${n.nozzleId} (${n.productType}):</b> Closing (${n.endingReading}) < Opening (${n.startingReading}).`);
            }
        }
    });
    if (errors.length > 0) {
        Modal.error({
            title: <span style={{color: 'red'}}><ExclamationCircleOutlined /> Validation Failed</span>,
            content: (<div><p>Please check readings:</p><ul style={{color: '#d63031', paddingLeft: 20}}>{errors.map((err, i) => <li key={i} dangerouslySetInnerHTML={{__html: err}} />)}</ul></div>)
        });
        return false;
    }
    return true;
  };

  const prepareDataForSave = async () => {
      const formValues = await form.validateFields();
      const mergedNozzles = shiftData.nozzles.map((orig, idx) => ({ ...orig, ...(formValues.nozzles?.[idx] || {}) }));
      const mergedNotes = shiftData.notes.map((orig, idx) => ({ ...orig, ...(formValues.notes?.[idx] || {}) }));
      const mergedDips = shiftData.dips.map((orig, idx) => ({ ...orig, ...(formValues.dips?.[idx] || {}) }));
      
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
      if (!validateShiftBeforeSave(finalPayload)) { setIsSaving(false); return; }
      setShiftData(finalPayload); 
      form.setFieldsValue(finalPayload);
      await saveDsrShift(finalPayload);
      message.success('Auto-saved');
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  }, [form, shiftData, currentDate, currentShift]);

  useEffect(() => {
    if (debouncedSaveRef.current) debouncedSaveRef.current.cancel();
    debouncedSaveRef.current = debounce(handleSaveImmediate, AUTO_SAVE_DELAY);
    return () => debouncedSaveRef.current?.cancel();
  }, [handleSaveImmediate]);

  const handleSaveAndNext = async () => {
    setIsSaving(true);
    try {
        const finalPayload = await prepareDataForSave();
        if (!validateShiftBeforeSave(finalPayload)) { setIsSaving(false); return; }
        await saveDsrShift(finalPayload);
        message.success('Shift Frozen');
        setIsLocked(true); 
        if (currentShift === 'Day') { setCurrentShift('Night'); } 
        else {
            const nextDay = dayjs(currentDate).add(1, 'day').format('YYYY-MM-DD');
            if (dayjs(nextDay).isAfter(dayjs())) { message.warning("Cannot navigate to future."); return; }
            setCurrentDate(nextDay); setCurrentShift('Day');
        }
    } catch (e) { message.error('Save failed.'); } finally { setIsSaving(false); }
  };

  const canGoBack = dayjs(currentDate).isAfter(REGISTRATION_DATE) || (dayjs(currentDate).isSame(REGISTRATION_DATE) && currentShift === 'Night');

  const renderCollectionTable = (type: 'Petrol' | 'Diesel') => {
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
                    <td><CellInput name={['summary', `online${type}`]} disabled={isLocked} format="financial" /></td>
                    <td rowSpan={8} style={{verticalAlign: 'top', padding: 0}}>
                        <table style={{width: '100%', borderCollapse: 'collapse'}}>
                            <tbody>
                                {shiftData.notes.map((note, idx) => (
                                    <tr key={note.denomination} style={{borderBottom: '1px solid #f0f0f0'}}>
                                        <td style={{padding: '2px 5px', fontSize: 13, color: '#666'}}>{note.denomination} x</td>
                                        <td style={{padding: 0}}><CellInput name={['notes', idx, `count${type}`]} style={{height: 24, fontSize: 13}} disabled={isLocked} format="number" /></td>
                                        <td style={{textAlign:'right', padding: '2px 5px', fontSize: 13, width: 60}}>{fmtInt(type === 'Petrol' ? note.amountPetrol : note.amountDiesel)}</td>
                                    </tr>
                                ))}
                                <tr style={{background: '#f9f9f9'}}>
                                    <td style={{padding: '2px 5px', fontSize: 13, fontWeight: 'bold'}}>Coins</td>
                                    <td colSpan={2} style={{padding: 0}}><CellInput name={['summary', `coins${type}`]} style={{height: 24}} disabled={isLocked} format="financial" /></td>
                                </tr>
                                <tr style={{background: '#e6f7ff', borderTop: '1px solid #91d5ff'}}>
                                    <td colSpan={2} style={{padding: '4px', fontWeight: 'bold', fontSize: 13, color: '#0050b3'}}>TOTAL CASH</td>
                                    <td style={{textAlign:'right', padding: '4px', fontWeight: 'bold', fontSize: 13, color: '#0050b3'}}>{fmtMoney(type === 'Petrol' ? shiftData.summary.cashTotalPetrol : shiftData.summary.cashTotalDiesel)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
                <tr><td>Credit Card</td><td><CellInput name={['summary', `card${type}`]} disabled={isLocked} format="financial" /></td></tr>
                <tr><td>Credit (Udhaar)</td><td><CellInput name={['summary', `credit${type}`]} disabled={isLocked} format="financial" /></td></tr>
                <tr style={{background: '#f8fafc'}}><td style={{fontSize: 13}}>Expected Cash</td><td className="calc-cell">{fmtMoney(shiftData.summary[`netCash${type}` as keyof FinancialSummary] as number)}</td></tr>
                <tr style={{background: '#f8fafc'}}><td style={{fontSize: 13}}>Actual Cash</td><td className="calc-cell bold">{fmtMoney(shiftData.summary[`receivedCash${type}` as keyof FinancialSummary] as number)}</td></tr>
                <tr><td style={{fontWeight:'bold'}}>Short/Excess</td><td className="calc-cell bold" style={{fontSize: 14, color: (shiftData.summary[`balance${type}` as keyof FinancialSummary] as number) > 0 ? '#ef4444' : '#22c55e'}}>{fmtMoney(shiftData.summary[`balance${type}` as keyof FinancialSummary] as number)}</td></tr>
            </tbody>    
        </table>
      );
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', background: '#f0f2f5' }}>
        <Form form={form} initialValues={shiftData} component={false} onValuesChange={handleValuesChange}>
            
            <div className="sticky-header">
                <div style={{display:'flex', gap: 10}}>
                    <Button icon={<LeftOutlined />} disabled={!canGoBack} onClick={() => { if (currentShift === 'Night') setCurrentShift('Day'); else { setCurrentDate(dayjs(currentDate).subtract(1, 'day').format('YYYY-MM-DD')); setCurrentShift('Night'); }}} />
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{dayjs(currentDate).format('DD MMM YYYY')}</div>
                        <Badge status={currentShift === 'Day' ? 'warning' : 'processing'} text={currentShift} />
                    </div>
                    <Button icon={<RightOutlined />} disabled={!isLocked} onClick={() => { if (currentShift === 'Day') setCurrentShift('Night'); else { setCurrentDate(dayjs(currentDate).add(1, 'day').format('YYYY-MM-DD')); setCurrentShift('Day'); }}} />
                </div>
                
                <div style={{fontWeight: 'bold', fontSize: 16, color: '#001529', display:'flex', gap: 8, alignItems:'center'}}>
                    <ShopOutlined /> {stationName}
                </div>

                <div>
                    {isLocked ? <Button danger icon={<UnlockOutlined />} onClick={() => setIsLocked(false)}>Unfreeze</Button> :
                        <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveAndNext} loading={isSaving} style={{ background: '#389e0d', border: 'none' }}>Close Shift</Button>}
                </div>
            </div>

            <div style={{ padding: '24px' }}>
                <PumpReadingsSection 
                    shiftData={shiftData} 
                    petrolRate={petrolRate} 
                    dieselRate={dieselRate}
                    isLocked={isLocked}
                    onRateChange={handleGlobalRateChange}
                />

                <div className="industrial-card">
                    <div className="toggle-container">
                        <Form.Item name="isClubbed" valuePropName="checked" noStyle>
                            <Switch checkedChildren="CLUBBED ACCOUNTING" unCheckedChildren="SEPARATE ACCOUNTING" />
                        </Form.Item>
                    </div>

                    <div className="accounting-grid">
                        {shiftData.isClubbed ? (
                            <div className="full-width-panel">
                                <div className="panel-header revenue"><span>COMBINED REVENUE</span><span>₹ {fmtMoney((shiftData.summary.totalAmountPetrol||0) + (shiftData.summary.totalAmountDiesel||0))}</span></div>
                                {renderCollectionTable('Petrol')} 
                            </div>
                        ) : (
                            <>
                                <div>
                                    <div className="panel-header petrol"><span>PETROL REVENUE</span><span>₹ {fmtMoney(shiftData.summary.totalAmountPetrol)}</span></div>
                                    {renderCollectionTable('Petrol')}
                                </div>
                                <div>
                                    <div className="panel-header diesel"><span>DIESEL REVENUE</span><span>₹ {fmtMoney(shiftData.summary.totalAmountDiesel)}</span></div>
                                    {renderCollectionTable('Diesel')}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="industrial-card">
                    <Divider orientation="left" style={{margin: '10px 0', fontSize: 12}}>Stock Dip Reading</Divider>
                    <table className="accounting-table">
                        <thead>
                            <tr><th>Product</th><th>Opening (mm)</th><th>Density</th><th>Temp</th><th>Stock/Sale</th></tr>
                        </thead>
                        <tbody>
                            <tr><td className="row-header" style={{borderLeft: '4px solid #faad14'}}>PETROL</td>
                                <td><CellInput name={['dips', 0, 'startingDip']} disabled={isLocked} format="number" /></td><td><CellInput name={['dips', 0, 'density']} disabled={isLocked} format="number" /></td><td><CellInput name={['dips', 0, 'temperature']} disabled={isLocked} format="number" /></td><td><CellInput name={['dips', 0, 'saleOrStock']} disabled={isLocked} format="number" /></td></tr>
                            <tr><td className="row-header" style={{borderLeft: '4px solid #003399'}}>DIESEL</td>
                                <td><CellInput name={['dips', 1, 'startingDip']} disabled={isLocked} format="number" /></td><td><CellInput name={['dips', 1, 'density']} disabled={isLocked} format="number" /></td><td><CellInput name={['dips', 1, 'temperature']} disabled={isLocked} format="number" /></td><td><CellInput name={['dips', 1, 'saleOrStock']} disabled={isLocked} format="number" /></td></tr>
                        </tbody>
                    </table>
                 </div>
                 <div style={{height: 60}}></div>
            </div>
        </Form>
    </div>
  );
};

export default DailyAccountingPage;