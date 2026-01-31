import { Table, InputNumber, Form, Typography, type FormInstance } from 'antd';
import type { ColumnsType } from 'antd/es/table/interface';
import type { NoteEntry, FinancialSummary } from '../types';
import { useEffect } from 'react';

const { Text } = Typography;

// Define denominations as a constant at the TOP of the file
// This is hoisting-safe and single source of truth
const DENOMINATIONS = [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1] as const;

interface Props {
  form: FormInstance<any>;
  notes: NoteEntry[];
  summary: FinancialSummary;
  onChange: (updatedNotes: NoteEntry[], updatedSummary: FinancialSummary) => void;
}

const FinancialReconciliation: React.FC<Props> = ({ form, notes, summary, onChange }) => {
 


  const columns: ColumnsType<NoteEntry> = [
    {
      title: 'Notes',
      dataIndex: 'denomination',
      width: 100,
      render: (value) => `${value}x`,
    },
    {
      title: 'Petrol Count',
      dataIndex: 'countPetrol',
      width: 130,
      render: (_, __, index) => (
        <Form.Item name={['notes', index, 'countPetrol']} noStyle>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
      ),
    },
    {
      title: 'Petrol Amount',
      dataIndex: 'amountPetrol',
      width: 140,
      render: (value) => `₹ ${(value || 0).toLocaleString('en-IN')}`,
    },
    {
      title: 'Diesel Count',
      dataIndex: 'countDiesel',
      width: 130,
      render: (_, __, index) => (
        <Form.Item name={['notes', index, 'countDiesel']} noStyle>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
      ),
    },
    {
      title: 'Diesel Amount',
      dataIndex: 'amountDiesel',
      width: 140,
      render: (value) => `₹ ${(value || 0).toLocaleString('en-IN')}`,
    },
  ];

  return (
    <div style={{ marginTop: 32 }}>
      <Text strong style={{ fontSize: 18, display: 'block', marginBottom: 12 }}>
        Cash Denomination & Reconciliation (Both Nozzles)
      </Text>
      <Table
        dataSource={notes}
        columns={columns}
        pagination={false}
        bordered
        size="middle"
        rowKey="denomination"
      />
      <div style={{ marginTop: 16, fontWeight: 'bold', textAlign: 'right' }}>
        <Text>Total Petrol Cash: ₹ {summary.totalAmountPetrol?.toLocaleString('en-IN') || '0'}</Text>
        <br />
        <Text>Total Diesel Cash: ₹ {summary.totalAmountDiesel?.toLocaleString('en-IN') || '0'}</Text>
      </div>
    </div>
  );
};

export default FinancialReconciliation;