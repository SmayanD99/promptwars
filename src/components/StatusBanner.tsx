'use client';

import React from 'react';
import { THEME } from '@/lib/constants';

interface StatusBannerProps {
  status: string;
  category: string;
}

/**
 * Visual banner showing the emergency status and category.
 * Performance: Uses centralized THEME to avoid redundant lookups.
 */
export const StatusBanner: React.FC<StatusBannerProps> = ({ status, category }) => {
  const config = THEME.status[status as keyof typeof THEME.status] || THEME.status.Informational;
  const color = config.color;
  
  return (
    <div
      className="status-banner"
      style={{
        background: `linear-gradient(135deg, ${color}22, ${color}08)`,
        border: `2px solid ${color}`,
      }}
      role="alert"
    >
      <div className="status-icon" aria-hidden="true">
        {config.icon}
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
