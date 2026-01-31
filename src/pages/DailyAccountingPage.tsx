// src/pages/DailyAccountingPage.tsx
import React, { useState, useEffect } from 'react';
import { Form, Button, DatePicker, Select, InputNumber, message, Typography } from 'antd';
import dayjs from 'dayjs';
import { debounce } from 'lodash';
import { saveDsrShift } from '../services/dsr';
import type { DsrShift, NozzleEntry, NoteEntry, DipEntry } from '../types';
import '../index.css';

const { Title } = Typography;

const DENOMINATIONS = [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1] as const;

// Helper to create empty shift data
const getInitialShift = (): DsrShift => ({
  date: dayjs(),
  salesman1: 'Nikil',
  salesman2: 'Elvis',
  nozzles: [
    { key: 1, nozzleId: 'A1', productType: 'Petrol', startingReading: 0, endingReading: 0, testingSample: 0, rate: 104.52 },
    { key: 2, nozzleId: 'A2', productType: 'Petrol', startingReading: 0, endingReading: 0, testingSample: 0, rate: 104.52 },
    { key: 3, nozzleId: 'V1', productType: 'Diesel', startingReading: 0, endingReading: 0, testingSample: 0, rate: 91.04 },
    { key: 4, nozzleId: 'V2', productType: 'Diesel', startingReading: 0, endingReading: 0, testingSample: 0, rate: 91.04 },
  ],
  notes: DENOMINATIONS.map(d => ({ denomination: d, countPetrol: 0, countDiesel: 0 })),
  summary: {
    totalAmountPetrol: 0, onlinePetrol: 0, cardPetrol: 0, creditPetrol: 0,
    netCashPetrol: 0, receivedCashPetrol: 0, balancePetrol: 0, cashTotalPetrol: 0,
    totalAmountDiesel: 0, onlineDiesel: 0, cardDiesel: 0, creditDiesel: 0,
    netCashDiesel: 0, receivedCashDiesel: 0, balanceDiesel: 0, cashTotalDiesel: 0,
  },
  dips: [
    { productType: 'Petrol', startingDip: 0, endingDip: 0, density: 0, temperature: 0 },
    { productType: 'Diesel', startingDip: 0, endingDip: 0, density: 0, temperature: 0 },
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
      // Create new shift for the selected date
      const fresh = getInitialShift();
      fresh.date = dayjs(date);
      setShiftData(fresh);
      form.setFieldsValue(fresh);
      message.info('New shift created for ' + date);
    } catch (error) {
      console.error('Error loading shift:', error);
      message.error('Failed to load shift');
    }
  };

  const debouncedSave = debounce(async (values: DsrShift) => {
    try {
      const toSave = { 
        ...values, 
        date: dayjs(values.date).format('YYYY-MM-DD'),
        salesman1: values.salesman1,
        salesman2: values.salesman2,
      };
      await saveDsrShift(toSave);
      message.success({ content: 'Saved', key: 'save', duration: 1 });
    } catch (err) {
      console.error('Save error:', err);
      message.error({ content: 'Save failed', key: 'save' });
    }
  }, 1000);

  const handleValuesChange = (_: any, allValues: DsrShift) => {
    // 1. Calculate Nozzles
    const updatedNozzles = allValues.nozzles.map(n => {
      const diff = (n.endingReading || 0) - (n.startingReading || 0);
      const netSale = diff - (n.testingSample || 0);
      const amount = netSale * (n.rate || 0);
      return { ...n, readingDiff: diff, netSale, amount };
    });

    // 2. Calculate Denominations
    const updatedNotes = allValues.notes.map(n => ({
      ...n,
      amountPetrol: (n.countPetrol || 0) * n.denomination,
      amountDiesel: (n.countDiesel || 0) * n.denomination,
    }));

    const totalCashPetrol = updatedNotes.reduce((sum, n) => sum + (n.amountPetrol || 0), 0);
    const totalCashDiesel = updatedNotes.reduce((sum, n) => sum + (n.amountDiesel || 0), 0);

    // 3. Calculate Summaries
    const petrolNozzles = updatedNozzles.filter(n => n.productType === 'Petrol');
    const dieselNozzles = updatedNozzles.filter(n => n.productType === 'Diesel');

    const totalAmtPetrol = petrolNozzles.reduce((sum, n) => sum + (n.amount || 0), 0);
    const totalAmtDiesel = dieselNozzles.reduce((sum, n) => sum + (n.amount || 0), 0);

    const s = allValues.summary;
    
    // Petrol Math
    const netCashP = totalAmtPetrol - (s.onlinePetrol || 0) - (s.cardPetrol || 0) - (s.creditPetrol || 0);
    const balanceP = (s.receivedCashPetrol || 0) - netCashP;

    // Diesel Math
    const netCashD = totalAmtDiesel - (s.onlineDiesel || 0) - (s.cardDiesel || 0) - (s.creditDiesel || 0);
    const balanceD = (s.receivedCashDiesel || 0) - netCashD;

    const updatedSummary = {
      ...s,
      totalAmountPetrol: totalAmtPetrol,
      totalAmountDiesel: totalAmtDiesel,
      netCashPetrol: netCashP,
      balancePetrol: balanceP,
      cashTotalPetrol: totalCashPetrol,
      netCashDiesel: netCashD,
      balanceDiesel: balanceD,
      cashTotalDiesel: totalCashDiesel,
    };

    const newData = {
      ...allValues,
      nozzles: updatedNozzles,
      notes: updatedNotes,
      summary: updatedSummary,
    };

    setShiftData(newData);
    // Note: We don't setFieldsValue here to avoid cursor jumping, 
    // unless we need to update calculated read-only fields which we render directly from state below.
    debouncedSave(newData);
  };

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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <strong>Date:</strong>
                <Form.Item name="date" style={{ margin: 0 }}>
                   <DatePicker format="DD/MM/YYYY" allowClear={false} onChange={(d) => d && loadShift(d.format('YYYY-MM-DD'))} />
                </Form.Item>
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  <strong>Salesman 1 (Petrol):</strong>
                  <Form.Item name="salesman1" style={{ margin: 0, width: 120 }}>
                    <Select options={[{ value: 'Nikil' }, { value: 'Elvis' }]} />
                  </Form.Item>
                </div>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  <strong>Salesman 2 (Diesel):</strong>
                  <Form.Item name="salesman2" style={{ margin: 0, width: 120 }}>
                    <Select options={[{ value: 'Nikil' }, { value: 'Elvis' }]} />
                  </Form.Item>
                </div>
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
              {/* --- NOZZLE READINGS SECTION --- */}
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
              
              {/* Calculated Difference */}
              <tr>
                <td>Reading Difference</td>
                {shiftData.nozzles.map((n) => (
                  <td key={n.key} style={{textAlign: 'right'}}>{n.readingDiff?.toFixed(2)}</td>
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

              {/* Calculated Total Sale */}
              <tr>
                <td><strong>Total Sale (L)</strong></td>
                {shiftData.nozzles.map((n) => (
                  <td key={n.key} style={{textAlign: 'right', fontWeight: 'bold'}}>{n.netSale?.toFixed(2)}</td>
                ))}
              </tr>

              {/* Rate */}
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

              {/* Calculated Amount */}
              <tr>
                <td><strong>Amount (₹)</strong></td>
                {shiftData.nozzles.map((n) => (
                  <td key={n.key} style={{textAlign: 'right', fontWeight: 'bold'}}>{n.amount?.toFixed(2)}</td>
                ))}
              </tr>
            </tbody>
          </table>

          {/* --- ACCOUNTING SPLIT SECTION --- */}
          <table className="ledger-table section-divider">
            <thead>
              <tr>
                <th colSpan={4} width="50%">Petrol Accounting</th>
                <th colSpan={4} width="50%">Diesel Accounting</th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1: Total Amount Header */}
              <tr>
                <td><strong>Total Amount</strong></td>
                <td colSpan={3} style={{textAlign: 'right', fontWeight: 'bold', fontSize: 16}}>
                  ₹ {shiftData.summary.totalAmountPetrol.toFixed(2)}
                </td>
                <td><strong>Total Amount</strong></td>
                <td colSpan={3} style={{textAlign: 'right', fontWeight: 'bold', fontSize: 16}}>
                  ₹ {shiftData.summary.totalAmountDiesel.toFixed(2)}
                </td>
              </tr>

              {/* Row 2: Header for Denominations */}
              <tr>
                <td colSpan={2}><strong>Expenses / Receipts</strong></td>
                <td style={{textAlign:'center'}}><strong>Note</strong></td>
                <td style={{textAlign:'center'}}><strong>Amt</strong></td>
                <td colSpan={2}><strong>Expenses / Receipts</strong></td>
                <td style={{textAlign:'center'}}><strong>Note</strong></td>
                <td style={{textAlign:'center'}}><strong>Amt</strong></td>
              </tr>

              {/* Complex Row Merging:
                 The list of expenses (Online, Card, Credit...) is shorter than the list of Notes (2000, 500, 200, 100...).
                 We iterate through the Notes array (longer) and conditionally render the Expense fields on the left.
              */}
              {shiftData.notes.map((note, idx) => {
                // Map expense fields to specific indices of the loop
                const expenseLabels = [
                  { label: 'Online Transaction', field: 'online' },
                  { label: 'Card Transaction', field: 'card' },
                  { label: 'Credit Given', field: 'credit' },
                  { label: 'Net Cash Amount', field: 'netCash', readOnly: true },
                  { label: 'Received Cash', field: 'receivedCash' },
                  { label: 'Balance (+/-)', field: 'balance', readOnly: true },
                ];
                
                const expenseItem = expenseLabels[idx]; // May be undefined for lower rows

                return (
                  <tr key={note.denomination}>
                    {/* --- PETROL LEFT --- */}
                    {expenseItem ? (
                      <>
                        <td>{expenseItem.label}</td>
                        <td>
                          {expenseItem.readOnly ? (
                            <div style={{textAlign: 'right', fontWeight: 'bold'}}>
                              {(shiftData.summary as any)[`${expenseItem.field}Petrol`]?.toFixed(2)}
                            </div>
                          ) : (
                            <Form.Item name={['summary', `${expenseItem.field}Petrol`]} style={{ margin: 0 }}>
                              <InputNumber className="ledger-input" controls={false} />
                            </Form.Item>
                          )}
                        </td>
                      </>
                    ) : (
                      <td colSpan={2} style={{background: '#f9f9f9'}}></td> // Empty filler
                    )}

                    {/* --- PETROL NOTES --- */}
                    <td style={{textAlign: 'center'}}>{note.denomination}</td>
                    <td>
                      <Form.Item name={['notes', idx, 'countPetrol']} style={{ margin: 0 }}>
                        <InputNumber className="ledger-input" placeholder="Count" controls={false} />
                      </Form.Item>
                    </td>

                    {/* --- DIESEL LEFT --- */}
                    {expenseItem ? (
                      <>
                        <td>{expenseItem.label}</td>
                        <td>
                          {expenseItem.readOnly ? (
                            <div style={{textAlign: 'right', fontWeight: 'bold'}}>
                              {(shiftData.summary as any)[`${expenseItem.field}Diesel`]?.toFixed(2)}
                            </div>
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

                    {/* --- DIESEL NOTES --- */}
                    <td style={{textAlign: 'center'}}>{note.denomination}</td>
                    <td>
                      <Form.Item name={['notes', idx, 'countDiesel']} style={{ margin: 0 }}>
                         <InputNumber className="ledger-input" placeholder="Count" controls={false} />
                      </Form.Item>
                    </td>
                  </tr>
                );
              })}

              {/* Total Row for Notes */}
              <tr>
                <td colSpan={2}></td>
                <td><strong>Total</strong></td>
                <td style={{textAlign: 'right'}}><strong>{shiftData.summary.cashTotalPetrol}</strong></td>
                <td colSpan={2}></td>
                <td><strong>Total</strong></td>
                <td style={{textAlign: 'right'}}><strong>{shiftData.summary.cashTotalDiesel}</strong></td>
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
                <th>Description</th>
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
                <td>Density / Temp</td>
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