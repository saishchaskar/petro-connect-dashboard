// src/components/AppLayout.tsx
import React from 'react';
import { Layout, Button, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { logout as serviceLogout } from '../services/auth';

const { Header, Content } = Layout;
const { Title } = Typography;

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const handleLogout = () => {
    serviceLogout();
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <Link to="/dashboard">
          <Title level={4} style={{ margin: 0 }}>PetroConnect</Title>
        </Link>
        <Button type="primary" onClick={handleLogout}>
          Logout
        </Button>
      </Header>
      <Content style={{ padding: '24px' }}>
        {children}
      </Content>
    </Layout>
  );
};

export default AppLayout;