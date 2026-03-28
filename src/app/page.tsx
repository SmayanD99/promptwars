'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { InputPanel } from '@/components/InputPanel';
import { ResultsPanel } from '@/components/ResultsPanel';
import { ProcessingIndicator } from '@/components/ProcessingIndicator';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useBridge } from '@/hooks/useBridge';
import type { BridgeInput } from '@/types';

export default function Home() {
  const { isLoading, error, result, sendRequest, reset } = useBridge();

  const handleSubmit = (input: BridgeInput) => {
    sendRequest(input);
  };

  return (
    <ErrorBoundary>
      <Header />
      <main id="main-content" className="main-container" role="main">
        {/* Hero */}
        <section className="hero-section" aria-label="Welcome">
          <h2 className="hero-title">
            Transform Chaos into{' '}
            <span className="hero-title-accent">Clarity</span>
          </h2>
          <p className="hero-description">
            Throw anything at BridgeAI — a photo, a voice note, a messy document —
            and get structured, verified, actionable intelligence in seconds.
          </p>
        </section>

        {/* Main Content Grid */}
        <div className="main-grid">
          {/* Input Side */}
          <div>
            <InputPanel onSubmit={handleSubmit} isLoading={isLoading} />
          </div>

          {/* Output Side */}
          <div>
            {isLoading && <ProcessingIndicator />}

            {error && (
              <div className="error-display glass-card animate-fade-in" role="alert">
                <div className="error-icon" aria-hidden="true">❌</div>
                <p className="error-message">{error}</p>
                <button
                  type="button"
                  className="error-retry-btn"
                  onClick={reset}
                >
                  Try Again
                </button>
              </div>
            )}

            {result && !isLoading && (
              <ResultsPanel result={result} onReset={reset} />
            )}

            {!isLoading && !error && !result && (
              <div className="glass-card animate-fade-in" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }} aria-hidden="true">
                  🌉
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
                  Ready to Bridge
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  Your structured results will appear here. BridgeAI analyzes any input
                  and converts it into clear, prioritized actions with verified information.
                </p>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 'var(--space-sm)',
                  justifyContent: 'center',
                  marginTop: 'var(--space-lg)',
                }}>
                  {[
                    { icon: '🏥', label: 'Medical' },
                    { icon: '📄', label: 'Documents' },
                    { icon: '🌪️', label: 'Emergency' },
                    { icon: '🚌', label: 'Transit' },
                    { icon: '⚖️', label: 'Legal' },
                    { icon: '💰', label: 'Finance' },
                  ].map(({ icon, label }) => (
                    <span key={label} className="key-fact-item" style={{ fontSize: '0.78rem' }}>
                      {icon} {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer" role="contentinfo">
        <p>
          BridgeAI — Powered by{' '}
          <a href="https://ai.google.dev" target="_blank" rel="noopener noreferrer">
            Google Gemini
          </a>{' '}
          | Built for societal benefit 🌍
        </p>
        <p style={{ marginTop: '0.25rem' }}>
          Uses OpenStreetMap for mapping • Respects your privacy • No data stored
        </p>
      </footer>
    </ErrorBoundary>
  );
}
