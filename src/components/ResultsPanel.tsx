'use client';

import React, { useEffect, useCallback } from 'react';
import type { BridgeOutput } from '@/types';
import { ActionCard } from './ActionCard';
import { MapView } from './MapView';

interface ResultsPanelProps {
  result: BridgeOutput;
  onReset: () => void;
}

/**
 * PulseBridge Emergency Dispatch Results Panel.
 * Displays: STATUS → IMMEDIATE INSTRUCTION → ACTION TABLE → HANDOVER CARD
 * Includes Text-to-Speech for immediate instructions.
 */
export function ResultsPanel({ result, onReset }: ResultsPanelProps) {
  // Text-to-Speech for immediate instruction
  const speakInstruction = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Auto-speak immediate instruction on critical/urgent results
  useEffect(() => {
    if (result.status === 'Critical' || result.status === 'Urgent') {
      speakInstruction(result.immediateInstruction);
    }
  }, [result, speakInstruction]);

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

  // Build locations from service providers that have coordinates
  const allLocations = [
    ...result.locations,
    ...result.serviceProviders
      .filter((sp) => sp.latitude && sp.longitude)
      .map((sp) => ({
        name: sp.name,
        latitude: sp.latitude!,
        longitude: sp.longitude!,
        type: sp.specialty,
        address: sp.address,
      })),
  ];

  return (
    <section
      className="results-panel glass-card animate-fade-in"
      aria-label="Emergency dispatch results"
      aria-live="assertive"
    >
      {/* ═══ STATUS BANNER ═══ */}
      <div
        className="status-banner"
        style={{
          background: `linear-gradient(135deg, ${statusColors[result.status] || '#60a5fa'}22, ${statusColors[result.status] || '#60a5fa'}08)`,
          border: `2px solid ${statusColors[result.status] || '#60a5fa'}`,
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-lg)',
          marginBottom: 'var(--space-lg)',
          textAlign: 'center',
        }}
        role="alert"
      >
        <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>
          {statusIcons[result.status] || 'ℹ️'}
        </div>
        <div
          style={{
            fontSize: '1.4rem',
            fontWeight: 800,
            color: statusColors[result.status] || '#60a5fa',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          STATUS: {result.status}
        </div>
        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--color-text-muted)',
            marginTop: '0.25rem',
          }}
        >
          {result.category}
        </div>
      </div>

      {/* ═══ IMMEDIATE INSTRUCTION ═══ */}
      <div
        className="immediate-instruction"
        style={{
          background: result.status === 'Critical'
            ? 'rgba(239,68,68,0.12)'
            : result.status === 'Urgent'
              ? 'rgba(249,115,22,0.12)'
              : 'rgba(96,165,250,0.08)',
          borderLeft: `4px solid ${statusColors[result.status] || '#60a5fa'}`,
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-md) var(--space-lg)',
          marginBottom: 'var(--space-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-md)',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
            Immediate Instruction
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {result.immediateInstruction}
          </div>
        </div>
        <button
          type="button"
          onClick={() => speakInstruction(result.immediateInstruction)}
          style={{
            background: 'rgba(139,92,246,0.15)',
            border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.5rem 0.75rem',
            cursor: 'pointer',
            color: 'var(--color-accent)',
            fontSize: '0.8rem',
            whiteSpace: 'nowrap',
          }}
          aria-label="Read immediate instruction aloud"
        >
          🔊 Speak
        </button>
      </div>

      {/* ═══ SUMMARY ═══ */}
      <div className="summary-section">
        <p className="summary-text">{result.summary}</p>
      </div>

      {/* ═══ KEY FACTS ═══ */}
      {result.keyFacts.length > 0 && (
        <div className="key-facts">
          <h3 className="key-facts-title">🔑 Key Facts</h3>
          <ul className="key-facts-list" role="list">
            {result.keyFacts.map((fact, i) => (
              <li key={i} className="key-fact-item" role="listitem">{fact}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ═══ SERVICE PROVIDERS (Action Table) ═══ */}
      {result.serviceProviders.length > 0 && (
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <h3 className="actions-title">🏥 Service Providers</h3>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.82rem',
              }}
              aria-label="Service providers action table"
            >
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(139,92,246,0.2)' }}>
                  {['Provider', 'Specialty', 'ETA', 'Contact', 'Status'].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left',
                        padding: '0.6rem 0.5rem',
                        color: 'var(--color-accent)',
                        fontWeight: 600,
                        fontSize: '0.72rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.serviceProviders.map((sp, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <td style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>{sp.name}</td>
                    <td style={{ padding: '0.6rem 0.5rem', color: 'var(--color-text-secondary)' }}>{sp.specialty}</td>
                    <td style={{ padding: '0.6rem 0.5rem' }}>
                      <span style={{
                        background: 'rgba(139,92,246,0.12)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '99px',
                        fontSize: '0.75rem',
                      }}>
                        {sp.eta}
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem 0.5rem' }}>
                      {sp.contact.match(/^\+?\d/) ? (
                        <a href={`tel:${sp.contact}`} style={{ color: 'var(--color-accent)' }}>
                          📞 {sp.contact}
                        </a>
                      ) : (
                        sp.contact
                      )}
                    </td>
                    <td style={{ padding: '0.6rem 0.5rem' }}>
                      <span style={{
                        background: sp.verificationStatus.toLowerCase().includes('verified')
                          ? 'rgba(34,197,94,0.15)'
                          : 'rgba(251,191,36,0.15)',
                        color: sp.verificationStatus.toLowerCase().includes('verified')
                          ? '#22c55e'
                          : '#fbbf24',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '99px',
                        fontSize: '0.72rem',
                      }}>
                        {sp.verificationStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ ACTIONS ═══ */}
      {result.actions.length > 0 && (
        <div className="actions-section">
          <h3 className="actions-title">
            ⚡ Recommended Actions ({result.actions.length})
          </h3>
          <div className="stagger-children" role="list" aria-label="Action items">
            {result.actions.map((action, i) => (
              <ActionCard key={i} action={action} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* ═══ WARNINGS ═══ */}
      {result.warnings.length > 0 && (
        <div className="warnings-section" role="alert">
          <h3 className="actions-title">⚠️ Warnings</h3>
          {result.warnings.map((warning, i) => (
            <div key={i} className="warning-item">
              <span className="warning-icon" aria-hidden="true">⚠️</span>
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* ═══ MAP ═══ */}
      <MapView locations={allLocations} />

      {/* ═══ HANDOVER CARD ═══ */}
      {result.handoverCard && (
        <div style={{
          background: 'rgba(139,92,246,0.06)',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-lg)',
          marginBottom: 'var(--space-lg)',
          fontFamily: 'monospace',
        }}>
          <h3 style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            color: 'var(--color-accent)',
            marginBottom: 'var(--space-md)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            📋 Handover Card (for Responders)
          </h3>
          <pre style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-md)',
            overflow: 'auto',
            fontSize: '0.78rem',
            lineHeight: 1.6,
            color: 'var(--color-text-secondary)',
          }}>
            {JSON.stringify(result.handoverCard, null, 2)}
          </pre>
        </div>
      )}

      {/* ═══ SOURCE VERIFICATION ═══ */}
      <div className="verification-section">
        <h3 className="verification-title">🔍 Source Verification</h3>
        <p className="verification-text">{result.sourceVerification}</p>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
          Dispatched at {new Date(result.timestamp).toLocaleString()}
        </p>
        <button
          type="button"
          className="reset-btn"
          onClick={onReset}
          aria-label="Start a new dispatch"
        >
          ↻ New Dispatch
        </button>
      </div>
    </section>
  );
}
