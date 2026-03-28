'use client';

import React, { useEffect, useCallback } from 'react';
import type { BridgeOutput } from '@/types';
import { ActionCard } from './ActionCard';
import { MapView } from './MapView';
import { StatusBanner } from './StatusBanner';
import { ImmediateInstructionBox } from './ImmediateInstructionBox';
import { ServiceProviderTable } from './ServiceProviderTable';
import { HandoverCard } from './HandoverCard';

interface ResultsPanelProps {
  result: BridgeOutput;
  onReset: () => void;
}

/**
 * PulseBridge Emergency Dispatch Results Panel.
 * Orchestrates modular components to display a comprehensive emergency response.
 */
export const ResultsPanel = React.memo(function ResultsPanel({ result, onReset }: ResultsPanelProps) {
  
  /**
   * Accessible Text-to-Speech for immediate instructions.
   */
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

  /**
   * Auto-speak immediate instructions on critical/urgent results for speed.
   */
  useEffect(() => {
    if (result.status === 'Critical' || result.status === 'Urgent') {
      speakInstruction(result.immediateInstruction);
    }
  }, [result, speakInstruction]);

  // Aggregate all locations for the MapView
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
      {/* 🚀 Priority Status & Commands */}
      <StatusBanner 
        status={result.status} 
        category={result.category} 
      />

      <ImmediateInstructionBox 
        status={result.status} 
        instruction={result.immediateInstruction} 
        onSpeak={speakInstruction} 
      />

      {/* 📝 Incident Summary */}
      <div className="summary-section">
        <p className="summary-text">{result.summary}</p>
      </div>

      {/* 📍 Visual Verification (Maps Static) */}
      {result.sceneMapUrl && (
        <div className="scene-map-container" style={{ marginBottom: 'var(--space-lg)', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
          <div className="instruction-label" style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.2)' }}>📍 Visual Scene Verification</div>
          <img 
            src={result.sceneMapUrl} 
            alt="Incident Scene Overview" 
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>
      )}

      {/* 🔑 Extracted Key Facts */}
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

      {/* 🏥 Professional Responders Enriched via Google APIs */}
      <ServiceProviderTable providers={result.serviceProviders} />

      {/* ⚡ Actionable Recommended Steps */}
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

      {/* ⚠️ Crisis Warnings */}
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

      {/* 🗺️ Interactive Scene Map */}
      <MapView locations={allLocations} />

      {/* 📋 Digital Handover Card for Pro Responders */}
      <HandoverCard data={result.handoverCard} />

      {/* 🔍 AI Source Verification Transparency */}
      <div className="verification-section">
        <h3 className="verification-title">🔍 Source Verification</h3>
        <p className="verification-text">{result.sourceVerification}</p>
      </div>

      {/* 🕒 Dispatch Metadata & Control */}
      <div className="results-footer">
        <p className="timestamp-text">
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
});
