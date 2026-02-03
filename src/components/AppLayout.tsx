// src/components/AppLayout.tsx
import React from 'react';
import { Layout, Menu, Button, Typography } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  LogoutOutlined, 
  DashboardOutlined, 
  SettingOutlined, 
  ShopOutlined,
  FileTextOutlined 
} from '@ant-design/icons';
import { logoutUser, getStationName } from '../services/auth';
import { Footer } from 'antd/es/layout/layout';

const { Header, Content } = Layout;
const { Title } = Typography;

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
      key: '/consolidated',
      icon: <FileTextOutlined />, // Import FileTextOutlined from icons
      label: 'Daily Sales Report',
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
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '0 24px',
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'saturate(180%) blur(10px)',
          borderBottom: '1px solid #e8e8e8'
        }}
      >
        {/* Brand / Logo Area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ShopOutlined style={{ fontSize: 24, color: '#001529' }} />
          <Title level={4} style={{ margin: 0, color: '#001529' }}>
            {stationName}
          </Title>
        </div>

        {/* Top Navigation Menu */}
        <Menu
          theme="light"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={(e) => navigate(e.key)}
          style={{ flex: 1, minWidth: 300, marginLeft: 40, background: 'transparent', borderBottom: 'none' }}
        />

        {/* Right Side: Logout */}
        <div>
          <Button 
            type="default"
            icon={<LogoutOutlined />} 
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </Header>

      {/* The key is crucial for triggering the animation on route change */}
      <Content style={{ animation: 'page-fade-in 0.4s ease-out', padding: '24px' }} key={location.pathname}>
        <Outlet /> 
      </Content>
      
       <Footer style={{ textAlign: 'center' }}>
        PetroConnect ©{new Date().getFullYear()} Created by Deccan Software Pvt. Ltd.
      </Footer>
    </Layout>
  );
};

export default AppLayout;