import React from 'react';
import { Layout, Menu, Button, Typography, Space, Avatar, Dropdown } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  LogoutOutlined, DashboardOutlined, SettingOutlined, ShopOutlined,
  FileTextOutlined, BarChartOutlined, UserOutlined, DownOutlined
} from '@ant-design/icons';
import { logoutUser, getStationName } from '../services/auth';

// Define Header height constant for calculations
const HEADER_HEIGHT = 64;
const FOOTER_HEIGHT = 40;

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const stationName = getStationName();

  const handleLogout = () => logoutUser();

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Daily Accounting' },
    { key: '/consolidated', icon: <FileTextOutlined />, label: 'Sales Report' },
    { key: '/analytics', icon: <BarChartOutlined />, label: 'Analytics' },
    { key: '/config', icon: <SettingOutlined />, label: 'Station Setup' },
  ];

  const userMenu = (
    <Menu items={[
      { key: '3', label: 'Logout', icon: <LogoutOutlined />, danger: true, onClick: handleLogout }
    ]} />
  );

  return (
    // Allow outer layout to expand and let body handle scroll
    <Layout style={{ minHeight: '100vh' }}> {/* minHeight to ensure footer is at bottom if content is short */}
      
      {/* HEADER - Fixed top anchor */}
      <Header 
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px',
          background: 'var(--bpcl-blue)', // Keep the strong brand anchor
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)', // Sharper shadow
          height: HEADER_HEIGHT,
          lineHeight: `${HEADER_HEIGHT}px`,
          zIndex: 10
        }}
      >
         {/* Branding Area */}
        <div style={{ display: 'flex', alignItems: 'center', minWidth: 240 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 20 }}>
             {/* Orange accent for the logo mark */}
            <div style={{ background: 'var(--iocl-orange)', height: 28, width: 28, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShopOutlined style={{ color: 'white', fontSize: 16 }} />
            </div>
            <Text strong style={{ color: 'white', fontSize: 18, letterSpacing: 0.5, fontFamily: 'Inter' }}>PetroConnect</Text>
          </div>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.3)', marginRight: 20 }}></div>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }} ellipsis>{stationName}</Text>
        </div>

        {/* Navigation */}
        <Menu
          theme="dark" mode="horizontal" selectedKeys={[location.pathname]} items={menuItems} onClick={(e) => navigate(e.key)}
          className="enterprise-nav"
          style={{ background: 'transparent', borderBottom: 'none', flex: 1, justifyContent: 'center' }}
        />

        {/* User Profile */}
        <div style={{ minWidth: 150, display: 'flex', justifyContent: 'flex-end' }}>
          <Dropdown overlay={userMenu} trigger={['click']}>
            <Button type="text" style={{ color: 'white', height: HEADER_HEIGHT }}>
              <Space>
                <Avatar size="small" style={{ backgroundColor: 'var(--iocl-orange)' }}>M</Avatar>
                <Text style={{ color: 'white', fontSize: 13 }}>Manager</Text>
                <DownOutlined style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }} />
              </Space>
            </Button>
          </Dropdown>
        </div>
      </Header>

      {/* CONTENT BODY - This area scrolls independently */}
      <Content style={{
          // Content will now expand naturally, body will scroll
          overflowX: 'hidden',
          padding: '16px 24px', // Fixed padding instead of huge margins
          position: 'relative'
      }}>
        {/* A container that allows full width but prevents extreme stretching on 4k screens */}
        <div style={{ width: '100%', maxWidth: '1800px', margin: '0 auto' }}>
             <Outlet /> 
        </div>
      </Content>
      
      {/* FOOTER - Fixed at bottom */}
       <Footer style={{ 
           textAlign: 'center', color: '#666', fontSize: 11, 
           padding: '0px', height: FOOTER_HEIGHT, lineHeight: `${FOOTER_HEIGHT}px`,
           background: '#e1e6eb', borderTop: '1px solid #d0d7e0'
       }}>
        PetroConnect Enterprise v2.5 | © {new Date().getFullYear()}
      </Footer>
    </Layout>
  );
};

export default AppLayout;