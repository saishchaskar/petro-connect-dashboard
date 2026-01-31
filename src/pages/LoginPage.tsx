// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/auth';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await loginUser(values);
      if (response && response.token) {
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('username', response.username);
        if (response.station_configured) {
          localStorage.setItem('station_configured', 'true');
        }
      }

      message.success('Login Successful');
      // Hard redirect to ensure all components re-evaluate auth state
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Login error:', error);
      message.error('Invalid Username or Password');
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
      background: '#e6f7ff' 
    }}>
      <Card style={{ width: 400, textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: 32 }}>
            {/* You can add a Logo here */}
          <Title level={3}>PetroConnect Login</Title>
          <Text type="secondary">Sign in to manage your station</Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please input your Username!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Username" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your Password!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Log in
            </Button>
          </Form.Item>
          <Text type="secondary">
            First time setup?{' '}
            <Typography.Link onClick={() => navigate('/register')}>Register here</Typography.Link>
          </Text>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;