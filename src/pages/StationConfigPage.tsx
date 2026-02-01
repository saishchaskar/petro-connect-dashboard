// src/pages/StationConfigPage.tsx
import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Space, Select, Typography, Divider, message, Row, Col } from 'antd';
import { PlusOutlined, MinusCircleOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getStationConfig, saveStationConfig } from '../services/config';
import type { StationConfig } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;

const StationConfigPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    const config = getStationConfig();
    form.setFieldsValue(config);
  }, [form]);

  const onFinish = (values: StationConfig) => {
    // Ensure shifts are set if not in form
    const finalConfig = { ...values, shifts: ['Day', 'Night'] };
    saveStationConfig(finalConfig);
    message.success('Station Configuration Saved Successfully!');
    navigate('/dashboard');
  };

  return (
    <div style={{ padding: '40px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Card 
        title={<Title level={3}>Petrol Pump Configuration</Title>} 
        style={{ maxWidth: 900, margin: '0 auto' }}
      >
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
          
          <Form.List name="dispensingUnits">
            {(fields, { add, remove }) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {fields.map((field, index) => (
                  <Card key={field.key} type="inner" title={`Dispensing Unit ${index + 1}`} extra={
                    <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(field.name)}>
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
                         <Form.Item name={[field.name, 'id']} initialValue={Date.now() + index} noStyle>
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
                              <MinusCircleOutlined onClick={() => removeNozzle(nf.name)} />
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
      </Card>
    </div>
  );
};

export default StationConfigPage;