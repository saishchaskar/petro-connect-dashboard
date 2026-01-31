import { Table, InputNumber, Form } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { NozzleEntry } from '../types';

interface Props {
  nozzles: NozzleEntry[];
}

const NozzleReadingsTable: React.FC<Props> = ({ nozzles }) => {
  const columns: ColumnsType<NozzleEntry> = [
    { title: 'Nozzle', dataIndex: 'nozzleId', width: 80, fixed: 'left' },
    {
      title: 'Starting Reading',
      dataIndex: 'startingReading',
      render: (_, record, index) => (
        <Form.Item name={['nozzles', index, 'startingReading']} noStyle>
          <InputNumber min={0} precision={3} style={{ width: '100%' }} />
        </Form.Item>
      ),
    },
    {
      title: 'Ending Reading',
      dataIndex: 'endingReading',
      render: (_, record, index) => (
        <Form.Item name={['nozzles', index, 'endingReading']} noStyle>
          <InputNumber min={0} precision={3} style={{ width: '100%' }} />
        </Form.Item>
      ),
    },
    {
      title: 'Testing Sample',
      dataIndex: 'testingSample',
      render: (_, record, index) => (
        <Form.Item name={['nozzles', index, 'testingSample']} noStyle>
          <InputNumber min={0} precision={3} style={{ width: '100%' }} />
        </Form.Item>
      ),
    },
    {
      title: 'Net Sale (L)',
      render: (_, record) => {
        const net = (record.endingReading || 0) - (record.startingReading || 0) - (record.testingSample || 0);
        return <strong>{net.toFixed(3)}</strong>;
      },
    },
    {
      title: 'Rate/Litre',
      dataIndex: 'rate',
      render: (_, record, index) => (
        <Form.Item name={['nozzles', index, 'rate']} noStyle>
          <InputNumber min={0} precision={2} style={{ width: '100%' }} />
        </Form.Item>
      ),
    },
    {
      title: 'Amount (₹)',
      render: (_, record) => {
        const net = (record.endingReading || 0) - (record.startingReading || 0) - (record.testingSample || 0);
        const amount = net * (record.rate || 0);
        return <strong>{amount.toFixed(2)}</strong>;
      },
    },
  ];

  return (
    <div style={{ marginTop: 24 }}>
      <h3>Nozzle Readings & Sales</h3>
      <Table
        dataSource={nozzles}
        columns={columns}
        pagination={false}
        bordered
        scroll={{ x: 800 }}
        rowKey="key"
      />
    </div>
  );
};

export default NozzleReadingsTable;