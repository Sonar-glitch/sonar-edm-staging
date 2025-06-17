import React from 'react';

/**
 * Placeholder EventDetailModal component
 * TODO: Implement full event detail modal for Step 4
 */
export default function EventDetailModal({ event, isOpen, onClose }) {
  if (!isOpen || !event) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#1a1a1a',
        padding: '2rem',
        borderRadius: '12px',
        border: '1px solid #333',
        color: '#fff',
        maxWidth: '500px',
        width: '90%'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, color: '#00c6ff' }}>{event.name || 'Event Details'}</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '1.5rem',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <p><strong>Venue:</strong> {event.venue || 'TBD'}</p>
          <p><strong>Date:</strong> {event.date || 'TBD'}</p>
          <p><strong>Match Score:</strong> {event.matchScore || 'N/A'}%</p>
        </div>
        
        <div style={{ 
          padding: '1rem',
          background: '#2a2a2a',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#888' }}>
            Step 4: Full event details with AI explanations and purchase links coming soon
          </p>
        </div>
        
        <button 
          onClick={onClose}
          style={{
            background: 'linear-gradient(90deg, #00c6ff, #ff00ff)',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '6px',
            color: 'white',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
