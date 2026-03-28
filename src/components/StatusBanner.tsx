'use client';

import React from 'react';

interface StatusBannerProps {
  status: string;
  category: string;
}

const statusColors: Record<string, string> = {
  Critical: '#ef4444',
  Urgent: '#f97316',
  Informational: '#60a5fa',
};

const statusIcons: Record<string, string> = {
  Critical: '🚨',
  Urgent: '⚠️',
  Informational: 'ℹ️',
};

/**
 * Visual banner showing the emergency status and category.
 */
export const StatusBanner: React.FC<StatusBannerProps> = ({ status, category }) => {
  const color = statusColors[status] || '#60a5fa';
  
  return (
    <div
      className="status-banner"
      style={{
        background: `linear-gradient(135deg, ${color}22, ${color}08)`,
        border: `2px solid ${color}`,
      }}
      role="alert"
    >
      <div className="status-icon">
        {statusIcons[status] || 'ℹ️'}
      </div>
      <div className="status-label" style={{ color }}>
        STATUS: {status}
      </div>
      <div className="status-category">
        {category}
      </div>
    </div>
  );
};
