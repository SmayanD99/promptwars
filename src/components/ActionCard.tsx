'use client';

import React, { useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { THEME } from '@/lib/constants';
import type { ActionItem } from '@/types';

interface ActionCardProps {
  action: ActionItem;
  index: number;
}

/**
 * Actionable repair or response card.
 * Security: Sanitizes AI-generated descriptions via DOMPurify to prevent XSS.
 * Performance: Leverages centralized theme constants for visual consistency.
 */
export function ActionCard({ action, index }: ActionCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const config = THEME.priorities[action.priority] || THEME.priorities.low;
  const typeIcon = THEME.actionTypes[action.type as keyof typeof THEME.actionTypes] || 'ℹ️';
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
          {typeIcon}
        </div>
        <span className="action-title">{action.title}</span>
        <span
          className={`priority-label priority-${action.priority}`}
          style={{
            background: config.bg,
            color: config.color,
          }}
        >
          {config.icon} {action.priority}
        </span>
        {action.isPromoted && (
          <span className="header-badge" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', marginLeft: '0.5rem' }}>
            ⭐ Promoted
          </span>
        )}
      </div>

      <p 
        className="action-description"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(action.description) }}
      />

      {action.rating && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#fbbf24', marginBottom: '8px' }}>
          <span>★</span>
          <span>{action.rating}</span>
          <span style={{ color: 'var(--color-text-muted)' }}>({action.reviewCount || 0} reviews)</span>
          <span className="header-badge" style={{ fontSize: '0.6rem', padding: '0 4px' }}>Business Profile</span>
        </div>
      )}

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
