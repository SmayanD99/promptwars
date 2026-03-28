'use client';

import React from 'react';

export function Header() {
  return (
    <header className="app-header" role="banner">
      <div className="header-inner">
        <div className="header-brand">
          <div className="header-logo" aria-hidden="true" style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)' }}>
            ⚡
          </div>
          <div>
            <h1 className="header-title">BridgeAI</h1>
            <p className="header-subtitle">Powered by PulseBridge</p>
          </div>
        </div>
        <span className="header-badge" aria-label="Powered by Gemini AI">
          ⚡ Gemini 3 Flash
        </span>
      </div>
    </header>
  );
}
