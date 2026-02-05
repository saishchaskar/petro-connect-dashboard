// src/pages/RegistrationPage.tsx
import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Divider } from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
  UserOutlined, 
  ShopOutlined, 
  LockOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  EnvironmentOutlined,
  RocketTwoTone,
  LeftOutlined
} from '@ant-design/icons';
import { registerStation } from '../services/auth';


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
      navigate('/login');
    } catch (error) {
      message.error('Registration failed. Please try again.');
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
      // Premium Dark Gradient Background (Matches Login)
      background: 'radial-gradient(circle at 50% 10%, #1e293b 0%, #0f172a 100%)',
      padding: '40px 20px'
    }}>
      
      {/* Decorative Background Blur Elements */}
      <div style={{
          position: 'absolute', top: '10%', left: '15%', width: '400px', height: '400px',
          background: 'rgba(24, 144, 255, 0.15)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none'
      }} />
      <div style={{
          position: 'absolute', bottom: '10%', right: '15%', width: '300px', height: '300px',
          background: 'rgba(250, 173, 20, 0.1)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none'
      }} />

      <Card 
        bordered={false}
        style={{ 
          width: 700, 
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          background: 'rgba(255, 255, 255, 0.98)',
          overflow: 'hidden'
        }}
        bodyStyle={{ padding: '40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
           <div style={{ 
                width: 64, height: 64, margin: '0 auto 16px', 
                background: '#f0f9ff', borderRadius: '16px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
                <RocketTwoTone twoToneColor="#1890ff" style={{ fontSize: '36px' }} />
            </div>
          <Title level={2} style={{ marginBottom: 4, letterSpacing: '-0.5px', color: '#0f172a' }}>
            Setup Your Station
          </Title>
          <Text style={{ color: '#64748b', fontSize: '15px' }}>
            One-time configuration to get your dashboard ready
          </Text>
        </div>

        <Form
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          requiredMark={false}
          size="large"
        >
          {/* SECTION 1: BUSINESS DETAILS */}
          <div style={{ marginBottom: 25 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15, color: '#1890ff', fontWeight: 600 }}>
                <ShopOutlined /> BUSINESS DETAILS
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
                <Form.Item 
                    label={<span style={{ fontWeight: 500, fontSize: 13, color: '#64748b' }}>STATION NAME</span>} 
                    name="stationName" 
                    rules={[{ required: true, message: 'Required' }]}
                >
                    <Input placeholder="e.g. Om Sai Petroleum" style={{borderRadius: 8}} />
                </Form.Item>
                <Form.Item 
                    label={<span style={{ fontWeight: 500, fontSize: 13, color: '#64748b' }}>STATION CODE / ID</span>} 
                    name="stationCode" 
                    rules={[{ required: true, message: 'Required' }]}
                >
                    <Input placeholder="e.g. OSP-001" style={{borderRadius: 8}} />
                </Form.Item>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <Form.Item 
                    label={<span style={{ fontWeight: 500, fontSize: 13, color: '#64748b' }}>DEALER NAME</span>} 
                    name="dealerName" 
                    rules={[{ required: true, message: 'Required' }]}
                >
                    <Input prefix={<UserOutlined style={{color:'#bfbfbf'}}/>} placeholder="Owner Name" style={{borderRadius: 8}} />
                </Form.Item>
                <Form.Item 
                    label={<span style={{ fontWeight: 500, fontSize: 13, color: '#64748b' }}>CONTACT NUMBER</span>} 
                    name="contactNumber" 
                    rules={[{ required: true, message: 'Required' }]}
                >
                    <Input prefix={<PhoneOutlined style={{color:'#bfbfbf'}}/>} placeholder="+91 98765 00000" style={{borderRadius: 8}} />
                </Form.Item>
            </div>

            <Form.Item 
                label={<span style={{ fontWeight: 500, fontSize: 13, color: '#64748b' }}>OFFICIAL EMAIL</span>} 
                name="email" 
                rules={[{ required: true, type: 'email', message: 'Valid email required' }]}
            >
                <Input prefix={<MailOutlined style={{color:'#bfbfbf'}}/>} placeholder="billing@station.com" style={{borderRadius: 8}} />
            </Form.Item>

            <Form.Item 
                label={<span style={{ fontWeight: 500, fontSize: 13, color: '#64748b' }}>ADDRESS</span>} 
                name="address" 
                rules={[{ required: true, message: 'Address required' }]}
            >
                <Input.TextArea rows={2} placeholder="Full address" style={{borderRadius: 8}} />
            </Form.Item>
          </div>

          <Divider style={{ margin: '30px 0' }} />

          {/* SECTION 2: ADMIN SETUP */}
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15, color: '#faad14', fontWeight: 600 }}>
                <LockOutlined /> ADMIN ACCOUNT SETUP
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <Form.Item 
                    label={<span style={{ fontWeight: 500, fontSize: 13, color: '#64748b' }}>USERNAME</span>} 
                    name="username" 
                    rules={[{ required: true, message: 'Required' }]}
                    style={{marginBottom: 0}}
                >
                    <Input prefix={<UserOutlined style={{color:'#bfbfbf'}}/>} placeholder="Create username" style={{borderRadius: 8}} />
                </Form.Item>
                <Form.Item 
                    label={<span style={{ fontWeight: 500, fontSize: 13, color: '#64748b' }}>PASSWORD</span>} 
                    name="password" 
                    rules={[{ required: true, message: 'Required' }]}
                    style={{marginBottom: 0}}
                >
                    <Input.Password prefix={<LockOutlined style={{color:'#bfbfbf'}}/>} placeholder="Create password" style={{borderRadius: 8}} />
                </Form.Item>
            </div>
          </div>

          <Form.Item style={{ marginTop: 32, marginBottom: 10 }}>
            <Button 
                type="primary" 
                htmlType="submit" 
                block 
                size="large" 
                loading={loading}
                style={{ 
                    height: '50px', 
                    borderRadius: '8px', 
                    fontSize: '16px', 
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                    border: 'none',
                    boxShadow: '0 4px 14px rgba(24, 144, 255, 0.3)'
                }}
            >
              Initialize System
            </Button>
          </Form.Item>
          
          <div style={{ textAlign: 'center' }}>
            <Button type="link" onClick={() => navigate('/login')} style={{color: '#64748b'}}>
               <LeftOutlined /> Back to Login
            </Button>
          </div>
        </Form>
      </Card>
      
      {/* Footer Copyright */}
      <div style={{ 
          position: 'absolute', bottom: 10, width: '100%', textAlign: 'center', 
          color: 'rgba(255,255,255,0.4)', fontSize: '12px' 
      }}>
          © {new Date().getFullYear()} PetroConnect Systems.
      </div>
    </div>
  );
};

export default RegistrationPage;