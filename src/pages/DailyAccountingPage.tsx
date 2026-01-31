// src/pages/DailyAccountingPage.tsx
import React, { useState, useEffect } from 'react';
import { Form, Button, DatePicker, Input, InputNumber, message, Typography, Switch } from 'antd';
import dayjs from 'dayjs';
import debounce from 'lodash.debounce';
import { getDsrShift, saveDsrShift } from '../services/dsr';
import type { DsrShift, FinancialSummary } from '../types';
import '../index.css';

const { Title } = Typography;

const DENOMINATIONS = [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1] as const;

const getInitialShift = (): DsrShift => ({
  date: dayjs(),
  isClubbed: false, // Default to separate accounting
  salesman1: '',
  salesman2: '',
  nozzles: [
    { key: 1, nozzleId: 'A1', productType: 'Petrol', startingReading: 0, endingReading: 0, testingSample: 0, rate: 104.52 },
    { key: 2, nozzleId: 'A2', productType: 'Petrol', startingReading: 0, endingReading: 0, testingSample: 0, rate: 104.52 },
    { key: 3, nozzleId: 'V1', productType: 'Diesel', startingReading: 0, endingReading: 0, testingSample: 0, rate: 91.04 },
    { key: 4, nozzleId: 'V2', productType: 'Diesel', startingReading: 0, endingReading: 0, testingSample: 0, rate: 91.04 },
  ],
  notes: DENOMINATIONS.map(d => ({ denomination: d, countPetrol: 0, countDiesel: 0 })),
  summary: {
    totalAmountPetrol: 0, onlinePetrol: 0, cardPetrol: 0, creditPetrol: 0,
    netCashPetrol: 0, coinsPetrol: 0, receivedCashPetrol: 0, balancePetrol: 0, cashTotalPetrol: 0,
    totalAmountDiesel: 0, onlineDiesel: 0, cardDiesel: 0, creditDiesel: 0,
    netCashDiesel: 0, coinsDiesel: 0, receivedCashDiesel: 0, balanceDiesel: 0, cashTotalDiesel: 0,
  },
  dips: [
    { productType: 'Petrol', startingDip: 0, endingDip: 0, density: 0, temperature: 0, saleOrStock: 0 },
    { productType: 'Diesel', startingDip: 0, endingDip: 0, density: 0, temperature: 0, saleOrStock: 0 },
  ],
});

const DailyAccountingPage: React.FC = () => {
  const [form] = Form.useForm<DsrShift>();
  const [shiftData, setShiftData] = useState<DsrShift>(getInitialShift());

  useEffect(() => {
    loadShift(dayjs().format('YYYY-MM-DD'));
  }, []);

  const loadShift = async (date: string) => {
    try {
      const existingShift = await getDsrShift(date);
      const initial = getInitialShift();
      
      const loadedShift = existingShift ? {
        ...initial,
        ...existingShift,
        date: dayjs(existingShift.date),
        nozzles: existingShift.nozzles?.length ? existingShift.nozzles : initial.nozzles,
        notes: existingShift.notes?.length ? existingShift.notes : initial.notes,
        summary: { ...initial.summary, ...existingShift.summary },
        dips: existingShift.dips?.length ? existingShift.dips : initial.dips,
      } : { ...initial, date: dayjs(date) };

      const calculated = calculateAll(loadedShift);
      setShiftData(calculated);
      form.setFieldsValue(calculated);
      
      if (!existingShift) message.info('New shift created for ' + date);
    } catch (error) {
      console.error('Error loading shift:', error);
      message.error('Failed to load shift');
    }
  };

  const calculateAll = (data: DsrShift): DsrShift => {
    // 1. Calculate Nozzles
    const updatedNozzles = data.nozzles.map(n => {
      const diff = (n.endingReading || 0) - (n.startingReading || 0);
      const netSale = diff - (n.testingSample || 0);
      const amount = netSale * (n.rate || 0);
      return { ...n, readingDiff: diff, netSale, amount };
    });

    // 2. Calculate Notes (Cash)
    const updatedNotes = data.notes.map(n => ({
      ...n,
      amountPetrol: (n.countPetrol || 0) * n.denomination,
      amountDiesel: (n.countDiesel || 0) * n.denomination,
    }));

    const notesTotalPetrol = updatedNotes.reduce((sum, n) => sum + (n.amountPetrol || 0), 0);
    const notesTotalDiesel = updatedNotes.reduce((sum, n) => sum + (n.amountDiesel || 0), 0);

    // 3. Calculate Summaries
    const petrolNozzles = updatedNozzles.filter(n => n.productType === 'Petrol');
    const dieselNozzles = updatedNozzles.filter(n => n.productType === 'Diesel');

    const totalAmtPetrol = petrolNozzles.reduce((sum, n) => sum + (n.amount || 0), 0);
    const totalAmtDiesel = dieselNozzles.reduce((sum, n) => sum + (n.amount || 0), 0);

    const s = data.summary;
    let updatedSummary: FinancialSummary;

    if (data.isClubbed) {
      // --- CLUBBED MODE ---
      // We use the "Petrol" fields as the "Global/Combined" fields
      
      // 1. Total Revenue = Petrol Sales + Diesel Sales
      const grandTotalRevenue = totalAmtPetrol + totalAmtDiesel;
      
      // 2. Net Cash Expected = Grand Total - (Global Online + Global Card + Global Credit)
      // Note: We use s.onlinePetrol, s.cardPetrol etc. as the input fields for Global values
      const netCashGlobal = grandTotalRevenue - (s.onlinePetrol || 0) - (s.cardPetrol || 0) - (s.creditPetrol || 0);
      
      // 3. Received Cash = Global Notes + Global Coins
      const receivedCashGlobal = notesTotalPetrol + (s.coinsPetrol || 0);
      
      // 4. Balance
      const balanceGlobal = netCashGlobal - receivedCashGlobal;

      updatedSummary = {
        ...s,
        totalAmountPetrol: totalAmtPetrol,
        totalAmountDiesel: totalAmtDiesel,
        
        // Map Global calculations to Petrol fields
        netCashPetrol: netCashGlobal,
        receivedCashPetrol: receivedCashGlobal,
        balancePetrol: balanceGlobal,
        cashTotalPetrol: notesTotalPetrol,

        // Zero out Diesel fields for display safety
        netCashDiesel: 0,
        receivedCashDiesel: 0,
        balanceDiesel: 0,
        cashTotalDiesel: 0
      };

    } else {
      // --- SEPARATE MODE (Existing Logic) ---
      
      // Petrol Math
      const netCashP = totalAmtPetrol - (s.onlinePetrol || 0) - (s.cardPetrol || 0) - (s.creditPetrol || 0);
      const receivedCashP = notesTotalPetrol + (s.coinsPetrol || 0);
      const balanceP = netCashP - receivedCashP; 

      // Diesel Math
      const netCashD = totalAmtDiesel - (s.onlineDiesel || 0) - (s.cardDiesel || 0) - (s.creditDiesel || 0);
      const receivedCashD = notesTotalDiesel + (s.coinsDiesel || 0);
      const balanceD = netCashD - receivedCashD;

      updatedSummary = {
        ...s,
        totalAmountPetrol: totalAmtPetrol,
        totalAmountDiesel: totalAmtDiesel,
        netCashPetrol: netCashP,
        receivedCashPetrol: receivedCashP,
        balancePetrol: balanceP,
        cashTotalPetrol: notesTotalPetrol,
        
        netCashDiesel: netCashD,
        receivedCashDiesel: receivedCashD,
        balanceDiesel: balanceD,
        cashTotalDiesel: notesTotalDiesel,
      };
    }

    return {
      ...data,
      nozzles: updatedNozzles,
      notes: updatedNotes,
      summary: updatedSummary,
    };
  };

  const debouncedSave = debounce(async (values: DsrShift) => {
    try {
      const toSave = { ...values, date: dayjs(values.date).format('YYYY-MM-DD') };
      await saveDsrShift(toSave);
      message.success({ content: 'Saved', key: 'save', duration: 1 });
    } catch (err) {
      console.error(err);
    }
  }, 1000);

  const handleValuesChange = (_: any, allValues: DsrShift) => {
    const mergedNozzles = shiftData.nozzles.map((oldN, idx) => ({
      ...oldN,
      ...((allValues.nozzles && allValues.nozzles[idx]) || {})
    }));

    const mergedNotes = shiftData.notes.map((oldN, idx) => ({
      ...oldN,
      ...((allValues.notes && allValues.notes[idx]) || {})
    }));
    
    const mergedDips = shiftData.dips.map((oldD, idx) => ({
      ...oldD,
      ...((allValues.dips && allValues.dips[idx]) || {})
    }));

    const mergedData = {
        ...shiftData,
        ...allValues,
        nozzles: mergedNozzles,
        notes: mergedNotes,
        dips: mergedDips,
        summary: { ...shiftData.summary, ...allValues.summary },
        // Explicitly preserve isClubbed if it's not in allValues (switch might handle differently)
        isClubbed: allValues.isClubbed !== undefined ? allValues.isClubbed : shiftData.isClubbed
    };

    const recalculated = calculateAll(mergedData);
    setShiftData(recalculated);
    debouncedSave(recalculated);
  };

  const RenderNumber = ({ value, bold = false }: { value: number | undefined, bold?: boolean }) => (
    <span style={{ fontWeight: bold ? 'bold' : 'normal', display: 'block', textAlign: 'right' }}>
      {typeof value === 'number' ? value.toFixed(2) : '0.00'}
    </span>
  );

  return (
    <div style={{ padding: '20px', background: '#555', minHeight: '100vh' }}>
      <Form
        form={form}
        initialValues={shiftData}
        onValuesChange={handleValuesChange}
        component={false}
      >
        <div className="ledger-container">
          {/* --- HEADER --- */}
          <div className="ledger-header">
            <Title level={3} style={{ margin: 0 }}>Om Sai Siddhi Petroleum, Kadewadi</Title>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
              <Form.Item name="date" style={{ margin: 0 }}>
                 <DatePicker format="DD/MM/YYYY" allowClear={false} onChange={(d) => d && loadShift(d.format('YYYY-MM-DD'))} />
              </Form.Item>
              <div style={{ display: 'flex', gap: 20 }}>
                  <Form.Item name="salesman1" style={{ margin: 0, width: 150 }}>
                    <Input className="ledger-input" placeholder="Petrol Salesman" style={{borderBottom: '1px solid #ccc !important'}} />
                  </Form.Item>
                  <Form.Item name="salesman2" style={{ margin: 0, width: 150 }}>
                    <Input className="ledger-input" placeholder="Diesel Salesman" style={{borderBottom: '1px solid #ccc !important'}} />
                  </Form.Item>
              </div>
            </div>
          </div>

          <table className="ledger-table">
            <thead>
              <tr>
                <th rowSpan={2} width="15%">Description</th>
                <th colSpan={2}>Petrol</th>
                <th colSpan={2}>Diesel</th>
              </tr>
              <tr>
                <th>A1</th>
                <th>A2</th>
                <th>V1</th>
                <th>V2</th>
              </tr>
            </thead>
            <tbody>
              {/* --- NOZZLE INPUTS --- */}
              {['startingReading', 'endingReading'].map((field) => (
                <tr key={field}>
                  <td>{field === 'startingReading' ? 'Starting Reading' : 'Ending Reading'}</td>
                  {shiftData.nozzles.map((n, idx) => (
                    <td key={n.key}>
                      <Form.Item name={['nozzles', idx, field]} style={{ margin: 0 }}>
                         <InputNumber className="ledger-input" controls={false} />
                      </Form.Item>
                    </td>
                  ))}
                </tr>
              ))}
              
              <tr>
                <td>Reading Difference</td>
                {shiftData.nozzles.map((n) => (
                  <td key={n.key}><RenderNumber value={n.readingDiff} /></td>
                ))}
              </tr>

              <tr>
                <td>Testing Sample</td>
                {shiftData.nozzles.map((n, idx) => (
                  <td key={n.key}>
                    <Form.Item name={['nozzles', idx, 'testingSample']} style={{ margin: 0 }}>
                        <InputNumber className="ledger-input" controls={false} />
                    </Form.Item>
                  </td>
                ))}
              </tr>

              <tr>
                <td><strong>Total Sale (L)</strong></td>
                {shiftData.nozzles.map((n) => (
                  <td key={n.key}><RenderNumber value={n.netSale} bold /></td>
                ))}
              </tr>

              <tr>
                <td>Rate / Litre</td>
                {shiftData.nozzles.map((n, idx) => (
                  <td key={n.key}>
                    <Form.Item name={['nozzles', idx, 'rate']} style={{ margin: 0 }}>
                        <InputNumber className="ledger-input" controls={false} precision={2} />
                    </Form.Item>
                  </td>
                ))}
              </tr>

              <tr>
                <td><strong>Amount (₹)</strong></td>
                {shiftData.nozzles.map((n) => (
                  <td key={n.key}><RenderNumber value={n.amount} bold /></td>
                ))}
              </tr>
            </tbody>
          </table>
            
           {/* --- GRAND TOTAL ROW --- */}
           <div style={{border: '1px solid #000', borderTop: 'none', padding: '10px', background: '#e6f7ff', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px'}}>
                <span style={{fontSize: '16px', fontWeight: 'bold'}}>
                    GRAND TOTAL SALE: ₹ {(shiftData.summary.totalAmountPetrol + shiftData.summary.totalAmountDiesel).toFixed(2)}
                </span>
                
                {/* --- TOGGLE BUTTON FOR CLUBBED ACCOUNTING --- */}
                <div style={{display: 'flex', alignItems: 'center', gap: 8, background: '#fff', padding: '4px 10px', border: '1px solid #ccc', borderRadius: 4}}>
                   <span style={{fontWeight: 500}}>Club Accounting</span>
                   <Form.Item name="isClubbed" valuePropName="checked" style={{margin:0}}>
                     <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                   </Form.Item>
                </div>
           </div>

          {/* --- ACCOUNTING SPLIT SECTION --- */}
          <table className="ledger-table section-divider">
            <thead>
              {shiftData.isClubbed ? (
                <tr>
                  <th colSpan={8} style={{background: '#d9f7be', fontSize: 16}}>
                    COMBINED ACCOUNTING (Petrol + Diesel)
                  </th>
                </tr>
              ) : (
                <tr>
                  <th colSpan={4} width="50%">Petrol Accounting</th>
                  <th colSpan={4} width="50%">Diesel Accounting</th>
                </tr>
              )}
            </thead>
            <tbody>
              {/* Row 1: Total Amount Headers */}
              <tr>
                <td><strong>Total Revenue</strong></td>
                {shiftData.isClubbed ? (
                  // CLUBBED VIEW: Show Grand Total in the Left Block, merge Right Block
                   <>
                    <td colSpan={3} style={{textAlign: 'right', fontWeight: 'bold', fontSize: 16}}>
                      ₹ {(shiftData.summary.totalAmountPetrol + shiftData.summary.totalAmountDiesel).toFixed(2)}
                    </td>
                    <td colSpan={4} style={{background: '#f0f0f0', textAlign: 'center', color: '#999'}}>
                      (Combined)
                    </td>
                   </>
                ) : (
                  // SEPARATE VIEW
                  <>
                    <td colSpan={3} style={{textAlign: 'right', fontWeight: 'bold', fontSize: 16}}>
                      ₹ {shiftData.summary.totalAmountPetrol.toFixed(2)}
                    </td>
                    <td><strong>Total Revenue</strong></td>
                    <td colSpan={3} style={{textAlign: 'right', fontWeight: 'bold', fontSize: 16}}>
                      ₹ {shiftData.summary.totalAmountDiesel.toFixed(2)}
                    </td>
                  </>
                )}
              </tr>

              {/* Row 2: Columns Headers */}
              <tr>
                <td colSpan={2}><strong>Expenses / Receipts</strong></td>
                <td colSpan={2} style={{textAlign:'center'}}><strong>Notes x Count = Amt</strong></td>
                {shiftData.isClubbed ? (
                   <td colSpan={4} style={{background: '#f0f0f0'}}></td>
                ) : (
                   <>
                    <td colSpan={2}><strong>Expenses / Receipts</strong></td>
                    <td colSpan={2} style={{textAlign:'center'}}><strong>Notes x Count = Amt</strong></td>
                   </>
                )}
              </tr>

              {/* ROWS for Expenses and Notes */}
              {shiftData.notes.map((note, idx) => {
                const expenseLabels = [
                  { label: 'Online Transaction', field: 'online' },
                  { label: 'Card Transaction', field: 'card' },
                  { label: 'Credit Given', field: 'credit' },
                  { label: <strong key="nc">Net Cash (Expected)</strong>, field: 'netCash', readOnly: true, highlight: true },
                  { label: <strong key="rc">Received Cash</strong>, field: 'receivedCash', readOnly: true }, 
                  { 
                    label: (
                      <strong key="bal">
                        {(shiftData.summary as any)[`${shiftData.isClubbed ? 'balancePetrol' : 'balancePetrol'}`] >= 0 ? 'Shortage (-)' : 'Excess (+)'}
                      </strong>
                    ), 
                    field: 'balance', 
                    readOnly: true, 
                    highlight: true },
                ];
                
                const expenseItem = expenseLabels[idx];

                return (
                  <tr key={note.denomination}>
                    {/* --- LEFT SIDE (Petrol OR Global) --- */}
                    {expenseItem ? (
                      <>
                        <td>{expenseItem.label}</td>
                        <td>
                          {expenseItem.readOnly ? (
                            <RenderNumber 
                              value={expenseItem.field === 'balance' 
                                ? Math.abs((shiftData.summary as any).balancePetrol) 
                                : (shiftData.summary as any)[`${expenseItem.field}Petrol`]
                              } 
                              bold={!!expenseItem.highlight} 
                            />
                          ) : (
                            <Form.Item name={['summary', `${expenseItem.field}Petrol`]} style={{ margin: 0 }}>
                              <InputNumber className="ledger-input" controls={false} />
                            </Form.Item>
                          )}
                        </td>
                      </>
                    ) : (
                      <td colSpan={2} style={{background: '#f9f9f9'}}></td>
                    )}

                    {/* --- LEFT NOTES (Petrol OR Global) --- */}
                    <td colSpan={2} style={{padding: 0}}>
                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px'}}>
                            <span style={{width: '40px', fontWeight: 'bold'}}>{note.denomination}</span>
                            <span>x</span>
                            <Form.Item name={['notes', idx, 'countPetrol']} style={{ margin: 0, width: '60px' }}>
                                <InputNumber className="ledger-input" style={{textAlign: 'center', borderBottom: '1px solid #ddd !important'}} controls={false} />
                            </Form.Item>
                            <span>=</span>
                            <span style={{width: '60px', textAlign: 'right'}}>{(note.amountPetrol || 0).toFixed(0)}</span>
                        </div>
                    </td>

                    {/* --- RIGHT SIDE (Diesel - Hidden if Clubbed) --- */}
                    {shiftData.isClubbed ? (
                      <td colSpan={4} style={{background: '#f0f0f0'}}></td>
                    ) : (
                      <>
                        {expenseItem ? (
                          <>
                            <td>{expenseItem.label}</td>
                            <td style={{ color: expenseItem.field === 'balance' ? (shiftData.summary.balanceDiesel >= 0 ? 'red' : 'green') : 'inherit' }}>
                              {expenseItem.readOnly ? (
                                <RenderNumber 
                                    value={expenseItem.field === 'balance' 
                                      ? Math.abs((shiftData.summary as any).balanceDiesel) 
                                      : (shiftData.summary as any)[`${expenseItem.field}Diesel`]
                                    } 
                                    bold={!!expenseItem.highlight} 
                                />
                              ) : (
                                <Form.Item name={['summary', `${expenseItem.field}Diesel`]} style={{ margin: 0 }}>
                                  <InputNumber className="ledger-input" controls={false} />
                                </Form.Item>
                              )}
                            </td>
                          </>
                        ) : (
                          <td colSpan={2} style={{background: '#f9f9f9'}}></td>
                        )}

                        <td colSpan={2} style={{padding: 0}}>
                            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px'}}>
                                <span style={{width: '40px', fontWeight: 'bold'}}>{note.denomination}</span>
                                <span>x</span>
                                <Form.Item name={['notes', idx, 'countDiesel']} style={{ margin: 0, width: '60px' }}>
                                    <InputNumber className="ledger-input" style={{textAlign: 'center', borderBottom: '1px solid #ddd !important'}} controls={false} />
                                </Form.Item>
                                <span>=</span>
                                <span style={{width: '60px', textAlign: 'right'}}>{(note.amountDiesel || 0).toFixed(0)}</span>
                            </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}

              {/* Coins Row */}
              <tr>
                <td colSpan={2}></td>
                <td colSpan={2} style={{padding: 0}}>
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px'}}>
                        <span style={{fontWeight: 'bold'}}>Coins</span>
                        <Form.Item name={['summary', 'coinsPetrol']} style={{ margin: 0, flex: 1 }}>
                            <InputNumber className="ledger-input" controls={false} />
                        </Form.Item>
                    </div>
                </td>
                {shiftData.isClubbed ? (
                  <td colSpan={4} style={{background: '#f0f0f0'}}></td>
                ) : (
                  <>
                    <td colSpan={2}></td>
                    <td colSpan={2} style={{padding: 0}}>
                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px'}}>
                            <span style={{fontWeight: 'bold'}}>Coins</span>
                            <Form.Item name={['summary', 'coinsDiesel']} style={{ margin: 0, flex: 1 }}>
                                <InputNumber className="ledger-input" controls={false} />
                            </Form.Item>
                        </div>
                    </td>
                  </>
                )}
              </tr>

              {/* Total Row for Notes + Coins */}
              <tr style={{background: '#eee'}}>
                <td colSpan={2}></td>
                <td colSpan={2} style={{textAlign: 'right'}}>
                    <strong>Total Cash: ₹ {shiftData.summary.receivedCashPetrol.toFixed(2)}</strong>
                </td>
                {shiftData.isClubbed ? (
                   <td colSpan={4}></td>
                ) : (
                   <>
                    <td colSpan={2}></td>
                    <td colSpan={2} style={{textAlign: 'right'}}>
                        <strong>Total Cash: ₹ {shiftData.summary.receivedCashDiesel.toFixed(2)}</strong>
                    </td>
                   </>
                )}
              </tr>
            </tbody>
          </table>

          {/* --- DIP DATA SECTION --- */}
          <div className="ledger-header" style={{borderTop: 'none'}}>
            <strong>DSR Data (Dip Reading)</strong>
          </div>
          <table className="ledger-table">
            <thead>
              <tr>
                <th width="30%">Description</th>
                <th>Petrol</th>
                <th>Diesel</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Starting Dip</td>
                <td>
                    <Form.Item name={['dips', 0, 'startingDip']} style={{margin:0}}>
                        <InputNumber className="ledger-input" controls={false} />
                    </Form.Item>
                </td>
                <td>
                    <Form.Item name={['dips', 1, 'startingDip']} style={{margin:0}}>
                        <InputNumber className="ledger-input" controls={false} />
                    </Form.Item>
                </td>
              </tr>
              <tr>
                <td>Ending Dip</td>
                <td>
                    <Form.Item name={['dips', 0, 'endingDip']} style={{margin:0}}>
                        <InputNumber className="ledger-input" controls={false} />
                    </Form.Item>
                </td>
                <td>
                    <Form.Item name={['dips', 1, 'endingDip']} style={{margin:0}}>
                        <InputNumber className="ledger-input" controls={false} />
                    </Form.Item>
                </td>
              </tr>
              <tr>
                <td>Density / Temperature</td>
                <td>
                    <div style={{display:'flex'}}>
                        <Form.Item name={['dips', 0, 'density']} style={{margin:0, flex:1}}>
                            <InputNumber className="ledger-input" placeholder="Den" controls={false} />
                        </Form.Item>
                        <span style={{padding: '0 5px'}}>/</span>
                        <Form.Item name={['dips', 0, 'temperature']} style={{margin:0, flex:1}}>
                            <InputNumber className="ledger-input" placeholder="Tmp" controls={false} />
                        </Form.Item>
                    </div>
                </td>
                <td>
                    <div style={{display:'flex'}}>
                        <Form.Item name={['dips', 1, 'density']} style={{margin:0, flex:1}}>
                            <InputNumber className="ledger-input" placeholder="Den" controls={false} />
                        </Form.Item>
                        <span style={{padding: '0 5px'}}>/</span>
                        <Form.Item name={['dips', 1, 'temperature']} style={{margin:0, flex:1}}>
                            <InputNumber className="ledger-input" placeholder="Tmp" controls={false} />
                        </Form.Item>
                    </div>
                </td>
              </tr>
              <tr>
                <td><strong>SALE / STOCK</strong></td>
                <td>
                    <Form.Item name={['dips', 0, 'saleOrStock']} style={{margin:0}}>
                        <InputNumber className="ledger-input" controls={false} />
                    </Form.Item>
                </td>
                <td>
                    <Form.Item name={['dips', 1, 'saleOrStock']} style={{margin:0}}>
                        <InputNumber className="ledger-input" controls={false} />
                    </Form.Item>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Footer Buttons */}
          <div style={{ padding: 20, textAlign: 'right' }}>
            <Button type="primary" size="large" onClick={() => debouncedSave.flush()}>
              Force Save Shift
            </Button>
          </div>

        </div>
      </Form>
    </div>
  );
};

export default DailyAccountingPage;