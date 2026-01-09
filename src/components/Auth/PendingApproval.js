// src/components/Auth/PendingApproval.js
import React from 'react';
import { Link } from 'react-router-dom';

const PendingApproval = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '480px',
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
        padding: '40px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <svg style={{ width: '40px', height: '40px', color: 'white' }} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        
        <h2 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#1e293b',
          margin: '0 0 12px'
        }}>
          Nalog na čekanju
        </h2>
        
        <p style={{
          fontSize: '16px',
          color: '#64748b',
          marginBottom: '24px',
          lineHeight: '1.6'
        }}>
          Vaša registracija je uspešno završena!<br />
          Vaš nalog čeka odobrenje profesora.
        </p>
        
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '32px'
        }}>
          <p style={{
            fontSize: '14px',
            color: '#92400e',
            margin: '0',
            lineHeight: '1.5'
          }}>
            <strong>Važno:</strong> Dobićete email obaveštenje kada profesor odobri vaš nalog.
            Možete se prijaviti sa vašim kredencijalima nakon odobrenja.
          </p>
        </div>
        
        <Link 
          to="/login" 
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '10px',
            fontWeight: '600',
            fontSize: '16px',
            transition: 'all 0.2s ease'
          }}
        >
          Nazad na prijavu
        </Link>
      </div>
    </div>
  );
};

export default PendingApproval;