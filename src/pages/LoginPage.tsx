// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Divider } from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
  UserOutlined, 
  LockOutlined, 
  SafetyCertificateTwoTone, 
  RightOutlined 
} from '@ant-design/icons';
import { loginUser } from '../services/auth';
import '../index.css';


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

      if(response.station_created_at) {
        localStorage.setItem('station_createdAt', response.station_created_at);
      }

      message.success('Login Successful');
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
      minHeight: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      // Premium Dark Gradient Background
      background: 'radial-gradient(circle at 50% 10%, #1e293b 0%, #0f172a 100%)',
      padding: '20px'
    }}>
      
      {/* Decorative Background Blur Elements */}
      <div style={{
          position: 'absolute', top: '20%', left: '20%', width: '300px', height: '300px',
          background: 'rgba(24, 144, 255, 0.15)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none'
      }} />
      <div style={{
          position: 'absolute', bottom: '20%', right: '20%', width: '250px', height: '250px',
          background: 'rgba(250, 173, 20, 0.1)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none'
      }} />

      <Card 
        bordered={false}
        style={{ 
          width: 420, 
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          background: 'rgba(255, 255, 255, 0.98)',
          overflow: 'hidden'
        }}
        bodyStyle={{ padding: '40px 32px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 35 }}>
            {/* Logo Section */}
            <div style={{ 
                width: 56, height: 56, margin: '0 auto 16px', 
                background: '#f0f9ff', borderRadius: '14px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
                <SafetyCertificateTwoTone twoToneColor="#1890ff" style={{ fontSize: '32px' }} />
            </div>
            
            <Title level={2} style={{ marginBottom: 4, letterSpacing: '-0.5px', color: '#0f172a' }}>
              PetroConnect
            </Title>
            <Text style={{ color: '#64748b', fontSize: '15px' }}>
              Secure Station Management
            </Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          requiredMark={false}
        >
          <Form.Item
            name="username"
            label={<span style={{ fontWeight: 500, color: '#475569' }}>Username / Station ID</span>}
            rules={[{ required: true, message: 'Please enter your username' }]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: '#94a3b8' }} />} 
              placeholder="admin@station" 
              style={{ borderRadius: '8px', padding: '10px 14px', fontSize: '15px' }}
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            label={<span style={{ fontWeight: 500, color: '#475569' }}>Password</span>}
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: '#94a3b8' }} />} 
              placeholder="••••••••" 
              style={{ borderRadius: '8px', padding: '10px 14px', fontSize: '15px' }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 30 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              loading={loading}
              style={{ 
                height: '48px', 
                borderRadius: '8px', 
                fontSize: '16px', 
                fontWeight: 600,
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                border: 'none',
                boxShadow: '0 4px 14px rgba(24, 144, 255, 0.3)'
              }}
            >
              Sign In
            </Button>
          </Form.Item>

          <Divider plain style={{ color: '#94a3b8', fontSize: '13px' }}>New to PetroConnect?</Divider>

          <div style={{ textAlign: 'center' }}>
            <Button 
              type="text" 
              onClick={() => navigate('/register')}
              style={{ color: '#1890ff', fontWeight: 500 }}
            >
              Register your Station <RightOutlined style={{ fontSize: '12px' }} />
            </Button>
          </div>
        </Form>
      </Card>
      
      {/* Footer Copyright */}
      <div style={{ 
          position: 'absolute', bottom: 20, width: '100%', textAlign: 'center', 
          color: 'rgba(255,255,255,0.4)', fontSize: '12px' 
      }}>
          © {new Date().getFullYear()} PetroConnect Systems. All rights reserved.
      </div>
    </div>
  );
};

export default LoginPage;