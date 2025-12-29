import React from 'react';

export default function DashboardCard({ title, description, onClick, colors }) {
  return (
    <div
      onClick={onClick}
      style={{
        cursor: 'pointer',
        backgroundColor: colors.white,
        borderRadius: '16px',
        padding: '20px',
        margin: '10px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        flex: '1 1 200px',
        minWidth: '200px',
        transition: 'transform 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <h3 style={{ color: colors.deepCharcoal, marginBottom: '10px' }}>{title}</h3>
      <p style={{ color: '#666', fontSize: '0.9rem' }}>{description}</p>
    </div>
  );
}
