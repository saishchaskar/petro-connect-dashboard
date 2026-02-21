// src/pages/StationConfigPage.tsx
import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Space, Select, Typography, Divider, message, Row, Col, Modal, Spin } from 'antd';
import { PlusOutlined, MinusCircleOutlined, SaveOutlined, LoadingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { getStationConfig, saveStationConfig } from '../services/config';
import type { StationConfig } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;

let duIdCounter = Date.now();

const StationConfigPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isFirstDayOfMonth, setIsFirstDayOfMonth] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      const config = await getStationConfig();
      form.setFieldsValue(config);
      setLoading(false);
    };

    loadConfig();
    // Check if today is the 1st day of the month
    const today = dayjs();
    setIsFirstDayOfMonth(today.date() === 1);
  }, [form]);

  const onFinish = (values: StationConfig) => {
    Modal.confirm({
      title: 'Confirm Save Changes',
      content: 'Are you sure you want to save these station configuration changes?',
      okText: 'Save',
      cancelText: 'Cancel',
      onOk: async () => {
        // Ensure shifts are set if not in form
        const finalConfig = { ...values, shifts: ['Day', 'Night'] };
        await saveStationConfig(finalConfig);
        message.success('Station Configuration Saved Successfully!');
        navigate('/dashboard');
      },
      onCancel: () => {
        message.info('Save cancelled.');
      },
    });
  };

  return (
    <div style={{ padding: '40px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Card 
        title={<Title level={3}>Petrol Pump Configuration</Title>} 
        style={{ maxWidth: 900, margin: '0 auto' }}
      >
        {loading ? <div style={{ textAlign: 'center', padding: 50 }}><Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} /></div> : (
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ shifts: ['Day', 'Night'] }}
        >
          <Form.Item label="Station Name" name="stationName" rules={[{ required: true }]}>
            <Input placeholder="Enter Station Name" size="large" />
          </Form.Item>
          
          <Divider orientation="left">Dispensing Units (DUs) & Nozzles</Divider>
          {!isFirstDayOfMonth && (
            <Text type="warning" style={{ marginBottom: 15, display: 'block' }}>
              <MinusCircleOutlined /> DUs and Nozzles can only be removed on the 1st day of the month to ensure accurate daily sales report calculations.
            </Text>
          )}
          
          <Form.List name="dispensingUnits">
            {(fields, { add, remove }) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {fields.map((field, index) => (
                  <Card key={field.key} type="inner" title={`Dispensing Unit ${index + 1}`} extra={
                    <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} disabled={!isFirstDayOfMonth}>
                      Remove DU
                    </Button>
                  }>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          {...field}
                          label="DU Name"
                          name={[field.name, 'name']}
                          rules={[{ required: true, message: 'Missing DU name' }]}
                        >
                          <Input placeholder="e.g. DU 1 (Front)" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                         {/* Hidden ID field */}
                         <Form.Item name={[field.name, 'id']} initialValue={`new_${duIdCounter++}`} noStyle>
                            <Input type="hidden" />
                         </Form.Item>
                      </Col>
                    </Row>

                    {/* Nested Nozzles List */}
                    <Text strong>Nozzles:</Text>
                    <Form.List name={[field.name, 'nozzles']}>
                      {(nozzleFields, { add: addNozzle, remove: removeNozzle }) => (
                        <>
                          {nozzleFields.map((nf) => (
                            <Space key={nf.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                              <Form.Item
                                {...nf}
                                name={[nf.name, 'id']}
                                rules={[{ required: true, message: 'Missing ID' }]}
                              >
                                <Input placeholder="Nozzle ID (e.g. A1)" />
                              </Form.Item>
                              <Form.Item
                                {...nf}
                                name={[nf.name, 'productType']}
                                rules={[{ required: true, message: 'Missing Type' }]}
                                initialValue="Petrol"
                              >
                                <Select style={{ width: 120 }}>
                                  <Option value="Petrol">Petrol</Option>
                                  <Option value="Diesel">Diesel</Option>
                                </Select>
                              </Form.Item>
                              <MinusCircleOutlined onClick={() => removeNozzle(nf.name)} disabled={!isFirstDayOfMonth} />
                            </Space>
                          ))}
                          <Form.Item>
                            <Button type="dashed" onClick={() => addNozzle()} block icon={<PlusOutlined />}>
                              Add Nozzle
                            </Button>
                          </Form.Item>
                        </>
                      )}
                    </Form.List>
                  </Card>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} size="large">
                  Add Dispensing Unit (DU)
                </Button>
              </div>
            )}
          </Form.List>

          <Divider />

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large" block>
              Save Configuration & Go to Dashboard
            </Button>
          </Form.Item>
        </Form>
        )}
      </Card>
    </div>
  );
};

export default StationConfigPage;