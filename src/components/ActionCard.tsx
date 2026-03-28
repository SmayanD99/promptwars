'use client';

import React, { useState } from 'react';
import type { ActionItem } from '@/types';

interface ActionCardProps {
  action: ActionItem;
  index: number;
}

const PRIORITY_ICONS: Record<string, string> = {
  urgent: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🔵',
};

const TYPE_ICONS: Record<string, string> = {
  call: '📞',
  navigate: '🗺️',
  checklist: '✅',
  link: '🔗',
  download: '📥',
  info: 'ℹ️',
  warning: '⚠️',
};

export function ActionCard({ action, index }: ActionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasSteps = action.steps && action.steps.length > 0;

  return (
    <div
      className="action-card animate-slide-in"
      style={{ animationDelay: `${index * 0.08}s` }}
      role="article"
      aria-label={`Action ${index + 1}: ${action.title}`}
    >
      <div className="action-card-header">
        <div className={`action-icon priority-${action.priority}`} aria-hidden="true">
          {TYPE_ICONS[action.type] || 'ℹ️'}
        </div>
        <span className="action-title">{action.title}</span>
        <span
          className={`priority-label priority-${action.priority}`}
          style={{
            background:
              action.priority === 'urgent'
                ? 'rgba(239,68,68,0.15)'
                : action.priority === 'high'
                  ? 'rgba(249,115,22,0.15)'
                  : action.priority === 'medium'
                    ? 'rgba(251,191,36,0.15)'
                    : 'rgba(96,165,250,0.15)',
            color:
              action.priority === 'urgent'
                ? 'var(--color-critical)'
                : action.priority === 'high'
                  ? 'var(--color-high)'
                  : action.priority === 'medium'
                    ? 'var(--color-medium)'
                    : 'var(--color-info)',
          }}
        >
          {PRIORITY_ICONS[action.priority]} {action.priority}
        </span>
      </div>

      <p className="action-description">{action.description}</p>

      {/* Steps (expandable) */}
      {hasSteps && (
        <>
          <button
            type="button"
            className="action-cta"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-controls={`steps-${index}`}
          >
            {expanded ? '▾ Hide steps' : `▸ Show ${action.steps!.length} steps`}
          </button>
          {expanded && (
            <ol className="action-steps" id={`steps-${index}`}>
              {action.steps!.map((step, i) => (
                <li key={i} className="action-step">
                  <span className="step-number" aria-hidden="true">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}

      {/* CTA buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {action.phone && (
          <a href={`tel:${action.phone}`} className="action-cta" aria-label={`Call ${action.phone}`}>
            📞 Call {action.phone}
          </a>
        )}
        {action.url && (
          <a
            href={action.url}
            target="_blank"
            rel="noopener noreferrer"
            className="action-cta"
            aria-label={`Open link: ${action.url}`}
          >
            🔗 Open Link
          </a>
        )}
      </div>
    </div>
  );
}
