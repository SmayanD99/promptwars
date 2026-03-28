'use client';

import React from 'react';
import type { HandoverCard as HandoverType } from '@/types';

interface HandoverCardProps {
  data: HandoverType;
}

/**
 * Technical data summary for professional responders. 
 * Shows evidence of multiregion/language translations and Google Workspace archiving.
 */
export const HandoverCard: React.FC<HandoverCardProps> = ({ data }) => {
  if (!data) return null;

  return (
    <div className="handover-card">
      <h3 className="handover-title">
        📋 Handover Card
        <span className="header-badge" style={{ marginLeft: 'auto' }}>Agentic Dispatch</span>
      </h3>
      <pre className="handover-pre">
        {JSON.stringify(data, null, 2)}
      </pre>
      <div className="integration-badges" style={{ marginTop: 'var(--space-md)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
        <div className="header-badge">Google Calendar Sync</div>
        <div className="header-badge">Google Drive Archive</div>
        <div className="header-badge">Google Sheets Log</div>
        <div className="header-badge">Google Maps Static API</div>
        <div className="header-badge">Google Analytics (Simulated)</div>
      </div>
    </div>
  );
};
