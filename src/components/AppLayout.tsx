// src/components/AppLayout.tsx
import React from 'react';
import { Layout, Menu, Button, Typography, theme } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  LogoutOutlined, 
  DashboardOutlined, 
  SettingOutlined, 
  ShopOutlined 
} from '@ant-design/icons';
import { logoutUser, getStationName } from '../services/auth';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const stationName = getStationName();

  const handleLogout = () => {
    logoutUser();
  };

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Daily Accounting',
    },
    {
      key: '/config',
      icon: <SettingOutlined />,
      label: 'Station Setup', // This is the link to the configuration page
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '0 24px',
          background: '#001529'
        }}
      >
        {/* Brand / Logo Area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ShopOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          <Title level={4} style={{ margin: 0, color: 'white' }}>
            {stationName}
          </Title>
        </div>

        {/* Top Navigation Menu */}
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={(e) => navigate(e.key)}
          style={{ flex: 1, minWidth: 300, marginLeft: 40 }}
        />

        {/* Right Side: Logout */}
        <div>
          <Button 
            type="primary" 
            danger 
            icon={<LogoutOutlined />} 
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </Header>

      <Content style={{ padding: '24px 50px', marginTop: 16 }}>
        <div style={{ background: colorBgContainer, minHeight: 280, padding: 24, borderRadius: 8 }}>
          {/* This renders the child page (Dashboard or Config) */}
          <Outlet /> 
        </div>
      </Content>

      <Footer style={{ textAlign: 'center' }}>
        PetroConnect ©{new Date().getFullYear()} Created by Deccan Software Pvt. Ltd.
      </Footer>
    </Layout>
  );
};

export default AppLayout;