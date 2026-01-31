// src/pages/RegistrationPage.tsx
import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Steps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { registerStation } from '../services/auth';
import { UserOutlined, HomeOutlined, LockOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const RegistrationPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await registerStation(values);

      localStorage.setItem('station_configured', 'true');
      localStorage.setItem('station_name', values.stationName);

      message.success('Station Registered Successfully!');
      
      // 2. Redirect to Login
      navigate('/login');
    } catch (error) {
      message.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      background: '#f0f2f5' 
    }}>
      <Card style={{ width: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2}>Welcome to PetroConnect</Title>
          <Text type="secondary">First-time Setup & Station Configuration</Text>
        </div>

        <Form
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Title level={5}><HomeOutlined /> Station Details</Title>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item label="Station Name" name="stationName" rules={[{ required: true }]}>
              <Input placeholder="e.g. Om Sai Siddhi Petroleum" />
            </Form.Item>
            <Form.Item label="Station Code" name="stationCode" rules={[{ required: true }]}>
              <Input placeholder="e.g. OSP-001" />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item label="Dealer Name" name="dealerName" rules={[{ required: true }]}>
              <Input placeholder="Owner Name" />
            </Form.Item>
            <Form.Item label="Contact Number" name="contactNumber" rules={[{ required: true }]}>
              <Input placeholder="+91 98765 43210" />
            </Form.Item>
          </div>

          <Form.Item label="Email Address" name="email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="station@example.com" />
          </Form.Item>

          <Form.Item label="Station Address" name="address" rules={[{ required: true }]}>
            <Input.TextArea rows={2} placeholder="Full address of the petrol pump" />
          </Form.Item>

          <div style={{ margin: '24px 0', borderTop: '1px solid #f0f0f0' }}></div>

          <Title level={5}><LockOutlined /> Admin Account Setup</Title>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item label="Username" name="username" rules={[{ required: true }]}>
              <Input prefix={<UserOutlined />} placeholder="Create a username" />
            </Form.Item>
            <Form.Item label="Password" name="password" rules={[{ required: true }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="Create a password" />
            </Form.Item>
          </div>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              Complete Setup & Register
            </Button>
          </Form.Item>
          <Text type="secondary">
            Already have a station configured?{' '}
            <Typography.Link onClick={() => navigate('/login')}>Go to Login</Typography.Link>
          </Text>
        </Form>
      </Card>
    </div>
  );
};

export default RegistrationPage;