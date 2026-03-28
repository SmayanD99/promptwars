'use client';

import React from 'react';

export function Header() {
  return (
    <header className="app-header" role="banner">
      <div className="header-inner">
        <div className="header-brand">
          <div className="header-logo" aria-hidden="true">
            B
          </div>
          <div>
            <h1 className="header-title">BridgeAI</h1>
            <p className="header-subtitle">Universal Intent-to-Action</p>
          </div>
        </div>
        <span className="header-badge" aria-label="Powered by Gemini AI">
          ⚡ Gemini-Powered
        </span>
      </div>
    </header>
  );
}
