'use client';

import React from 'react';
import type { BridgeOutput } from '@/types';
import { ActionCard } from './ActionCard';
import { MapView } from './MapView';

interface ResultsPanelProps {
  result: BridgeOutput;
  onReset: () => void;
}

export function ResultsPanel({ result, onReset }: ResultsPanelProps) {
  return (
    <section
      className="results-panel glass-card animate-fade-in"
      aria-label="Analysis results"
      aria-live="polite"
    >
      {/* Header */}
      <div className="results-header">
        <h2 className="results-title">Analysis Complete</h2>
        <span
          className={`severity-badge severity-${result.severity}`}
          role="status"
          aria-label={`Severity level: ${result.severity}`}
        >
          {result.severity === 'critical' ? '🚨' :
           result.severity === 'high' ? '⚠️' :
           result.severity === 'medium' ? '🔶' :
           result.severity === 'low' ? '✅' : 'ℹ️'}{' '}
          {result.severity.toUpperCase()}
        </span>
        <span className="category-badge">{result.category}</span>
        <button
          type="button"
          className="reset-btn"
          onClick={onReset}
          aria-label="Start a new analysis"
          style={{ marginLeft: 'auto' }}
        >
          ↻ New Query
        </button>
      </div>

      {/* Summary */}
      <div className="summary-section">
        <p className="summary-text">{result.summary}</p>
      </div>

      {/* Key Facts */}
      {result.keyFacts.length > 0 && (
        <div className="key-facts">
          <h3 className="key-facts-title">Key Facts</h3>
          <ul className="key-facts-list" role="list">
            {result.keyFacts.map((fact, i) => (
              <li key={i} className="key-fact-item" role="listitem">
                {fact}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      {result.actions.length > 0 && (
        <div className="actions-section">
          <h3 className="actions-title">
            Recommended Actions ({result.actions.length})
          </h3>
          <div className="stagger-children" role="list" aria-label="Action items">
            {result.actions.map((action, i) => (
              <ActionCard key={i} action={action} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="warnings-section" role="alert">
          <h3 className="actions-title">⚠️ Important Warnings</h3>
          {result.warnings.map((warning, i) => (
            <div key={i} className="warning-item">
              <span className="warning-icon" aria-hidden="true">⚠️</span>
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Map */}
      <MapView locations={result.locations} />

      {/* Source Verification */}
      <div className="verification-section">
        <h3 className="verification-title">🔍 Source Verification</h3>
        <p className="verification-text">{result.sourceVerification}</p>
      </div>

      {/* Timestamp */}
      <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'right' }}>
        Analyzed at {new Date(result.timestamp).toLocaleString()}
      </p>
    </section>
  );
}
