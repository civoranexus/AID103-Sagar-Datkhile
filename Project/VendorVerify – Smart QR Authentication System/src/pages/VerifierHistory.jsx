
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ScrollArea } from '../components/ScrollArea';
import { Badge, useToast } from '../components/UI';
import { CheckCircle2, AlertCircle, MapPin, Globe, Building2, XCircle, AlertTriangle } from 'lucide-react';

const VerifierHistory = () => {
    const { addToast } = useToast();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            // Fetch ALL history for this verifier
            const { data: historyData, error } = await supabase
                .from('audit_logs')
                .select(`
                    *,
                    products (name, serial_number),
                    vendors (company_name)
                `)
                .eq('verifier_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching history:', error);
                addToast('Failed to load scan history', 'error');
            } else {
                setHistory(historyData || []);
            }
        }
        setLoading(false);
    };

    return (
        <div className="fade-in" style={{ height: '75vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>My Scan History</h3>
                <Badge>{history.length} Scans</Badge>
            </div>

            <div style={{ flex: 1, minHeight: 0, background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <ScrollArea style={{ height: '100%' }} maxHeight="100%">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {history.map(log => (
                            <div key={log.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1rem',
                                borderBottom: '1px solid var(--border)',
                                transition: 'background 0.2s'
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--background)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '50%',
                                    backgroundColor: log.result === 'valid' ? 'rgba(16, 185, 129, 0.1)' :
                                        log.result === 'used' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: log.result === 'valid' ? 'var(--success)' :
                                        log.result === 'used' ? 'var(--warning)' : 'var(--error)'
                                }}>
                                    {log.result === 'valid' && <CheckCircle2 size={24} />}
                                    {log.result === 'used' && <AlertTriangle size={24} />}
                                    {(log.result === 'invalid' || !['valid', 'used'].includes(log.result)) && <XCircle size={24} />}
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontWeight: 600, fontSize: '1rem' }}>{log.products?.name || 'Unknown Product'}</span>
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                            {new Date(log.created_at).toLocaleString()}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Building2 size={14} />
                                            {log.vendors?.company_name || 'Unknown Vendor'}
                                        </div>
                                        {/* 
                                           Verifier audits might not always capture location/IP client-side depending on implementation,
                                           but if they do, show them.
                                        */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <MapPin size={14} />
                                            {log.location || 'Unknown Location'}
                                        </div>
                                        <div>
                                            Serial: <span style={{ fontFamily: 'monospace' }}>{log.products?.serial_number}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <Badge type={log.result === 'valid' ? 'success' : log.result === 'used' ? 'warning' : 'error'}>
                                        {(log.result || 'UNKNOWN').toUpperCase()}
                                    </Badge>
                                </div>
                            </div>
                        ))}

                        {history.length === 0 && !loading && (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                No history found.
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
};

export default VerifierHistory;
