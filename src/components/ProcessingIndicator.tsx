'use client';

import React from 'react';

export function ProcessingIndicator() {
  return (
    <div
      className="processing-indicator glass-card animate-fade-in"
      role="status"
      aria-live="polite"
      aria-label="Processing your input"
    >
      <div className="processing-spinner" aria-hidden="true" />
      <p className="processing-text">Analyzing your input with Gemini AI...</p>
      <p className="processing-sub-text">
        Understanding context, verifying facts, structuring actions
      </p>
    </div>
  );
}
