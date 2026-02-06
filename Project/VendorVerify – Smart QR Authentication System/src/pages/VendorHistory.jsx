
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ScrollArea } from '../components/ScrollArea';
import { Badge, useToast } from '../components/UI';
import { CheckCircle2, AlertCircle, MapPin, Globe } from 'lucide-react';

const VendorHistory = () => {
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
            // Fetch ALL history
            const { data: historyData, error } = await supabase
                .from('audit_logs')
                .select('*, products(name, serial_number)')
                .eq('vendor_id', user.id)
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
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Full Scan History</h3>
                <Badge>{history.length} Events</Badge>
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
                                    backgroundColor: log.result === 'valid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: log.result === 'valid' ? 'var(--success)' : 'var(--error)',
                                    flexShrink: 0
                                }}>
                                    {log.result === 'valid' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ marginBottom: '0.25rem' }}>
                                        <span style={{ fontWeight: 600, fontSize: '1rem' }}>{log.products?.name || 'Unknown Product'}</span>
                                    </div>

                                    <div style={{ marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                        Scanned by {log.verifier_name || 'Anonymous'}
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <MapPin size={14} />
                                            {log.location || 'Unknown Location'}
                                        </div>
                                        {log.ip_address && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Globe size={14} />
                                                {log.ip_address}
                                            </div>
                                        )}
                                        <div>
                                            Serial: <span style={{ fontFamily: 'monospace' }}>{log.products?.serial_number}</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                        {new Date(log.created_at).toLocaleString()}
                                    </span>
                                    <Badge type={log.result === 'valid' ? 'success' : 'error'}>
                                        {(log.result || 'UNKNOWN').toUpperCase()}
                                    </Badge>
                                </div>
                            </div>
                        ))}

                        {history.length === 0 && !loading && (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                No scan history recorded yet.
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
};

export default VendorHistory;
