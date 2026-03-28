'use client';

import React from 'react';
import type { ServiceProvider } from '@/types';

interface ServiceProviderTableProps {
  providers: ServiceProvider[];
}

/**
 * Renders a structured table of nearby medical, traffic, or utility responders.
 * Leverages Google Business Profile data (ratings, contact) for verified actions.
 */
export const ServiceProviderTable: React.FC<ServiceProviderTableProps> = ({ providers }) => {
  if (providers.length === 0) return null;

  return (
    <div className="service-providers-section" style={{ marginBottom: 'var(--space-lg)' }}>
      <h3 className="actions-title">🏥 Service Providers</h3>
      <div className="action-table-container">
        <table className="action-table" aria-label="Service providers action table">
          <thead>
            <tr>
              {['Provider', 'Specialty', 'ETA', 'Contact', 'Status'].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {providers.map((sp, i) => (
              <tr key={i}>
                <td>
                  <div className="provider-name">{sp.name}</div>
                  {sp.address && <div className="provider-address" style={{ fontSize: '0.75rem', opacity: 0.7 }}>{sp.address}</div>}
                </td>
                <td><span className="provider-specialty">{sp.specialty}</span></td>
                <td><span className="eta-badge">{sp.eta}</span></td>
                <td>
                  {sp.contact.match(/^\+?\d/) ? (
                    <a href={`tel:${sp.contact}`} className="contact-link">
                      📞 {sp.contact}
                    </a>
                  ) : (
                    sp.contact
                  )}
                </td>
                <td>
                  <span className={`verification-badge ${
                    sp.verificationStatus.toLowerCase().includes('verified') ? 'verified' : 'unverified'
                  }`}>
                    {sp.verificationStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
