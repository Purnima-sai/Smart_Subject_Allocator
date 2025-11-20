import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminHeader() {
  const navigate = useNavigate();

  return (
    <div style={{
      padding: '1rem',
      backgroundColor: '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
      marginBottom: '1rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
    </div>
  );
}