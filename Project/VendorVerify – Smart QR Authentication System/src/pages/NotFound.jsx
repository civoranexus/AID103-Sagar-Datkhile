import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../components/UI';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--error)',
                padding: '1.5rem',
                borderRadius: '50%',
                marginBottom: '2rem'
            }}>
                <ShieldAlert size={64} />
            </div>
            <h1 className="font-display" style={{ fontSize: '3rem', marginBottom: '1rem' }}>404</h1>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Unauthorized or Missing Path</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '450px', marginBottom: '2.5rem' }}>
                The security protocol has restricted access to this resource or the requested page does not exist in our registry.
            </p>
            <Button className="btn-primary" onClick={() => navigate('/')}>
                <ArrowLeft size={18} /> Return to Safety
            </Button>
        </div>
    );
};

export default NotFound;
