import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, Button, Badge, useToast } from '../../components/UI';
import { ScrollArea } from '../../components/ScrollArea';
import { Search, Filter, FileText, Smartphone, MapPin, Building2, CheckCircle2, AlertTriangle, XCircle, MoreVertical, AlertCircle } from 'lucide-react';

const SystemLogs = () => {
    const { addToast } = useToast();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*, products(name, serial_number), users:verifier_id(full_name), vendors(company_name)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching logs:', error);
            addToast('Failed to load logs', 'error');
        } else {
            setLogs(data || []);
        }
        setLoading(false);
    };

    const filteredLogs = logs.filter(log => {
        const query = searchQuery.toLowerCase();
        return (
            log.products?.name?.toLowerCase().includes(query) ||
            log.vendors?.company_name?.toLowerCase().includes(query) ||
            (log.users?.full_name || log.verifier_name || '').toLowerCase().includes(query) ||
            log.result?.toLowerCase().includes(query)
        );
    });

    const handleExportCSV = () => {
        const headers = ["Timestamp", "Product", "Serial", "Vendor", "Verifier", "Result", "Location", "Device", "IP"];
        const csvRows = [headers.join(',')];

        filteredLogs.forEach(log => {
            const row = [
                `"${new Date(log.created_at).toLocaleString()}"`,
                `"${log.products?.name || 'Unknown'}"`,
                `"${log.products?.serial_number || 'N/A'}"`,
                `"${log.vendors?.company_name || 'Generic Vendor'}"`,
                `"${log.users?.full_name || log.verifier_name || 'System Operator'}"`,
                `"${log.result}"`,
                `"${log.location || 'Unknown'}"`,
                `"${log.device_info || 'Unknown'}"`,
                `"${log.ip_address || 'Unknown'}"`
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `system_audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        addToast('Logs exported successfully', 'success');
    };

    return (
        <div className="fade-in" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 className="font-display" style={{ fontSize: '1.75rem' }}>System Logs</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Complete audit trail of all authentication events</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        <input
                            className="input-field"
                            placeholder="Search logs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                paddingLeft: '3rem',
                                paddingRight: '1rem',
                                width: '100%',
                                height: '42px',
                                boxSizing: 'border-box',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-md)',
                                outline: 'none',
                                transition: 'all 0.2s',
                                fontSize: '0.875rem'
                            }}
                        />
                    </div>
                    <Button className="btn-primary" onClick={handleExportCSV} style={{ whiteSpace: 'nowrap', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Export CSV</Button>
                </div>
            </div>

            <div style={{ flex: 1, minHeight: 0, background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <ScrollArea style={{ height: '100%' }} maxHeight="100%">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading logs...</div>
                        ) : filteredLogs.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No logs found matching your search.</div>
                        ) : (
                            filteredLogs.map(log => (
                                <div key={log.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1rem',
                                    borderBottom: '1px solid var(--border)',
                                    transition: 'background 0.2s',
                                    cursor: 'pointer'
                                }}
                                    onClick={() => setSearchQuery(log.products?.name || '')}
                                    title="Click to filter by this product"
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--background)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '50%',
                                        backgroundColor: log.result === 'valid' ? 'rgba(16, 185, 129, 0.1)' : log.result === 'used' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: log.result === 'valid' ? 'var(--success)' : log.result === 'used' ? 'var(--warning)' : 'var(--error)',
                                        flexShrink: 0
                                    }}>
                                        {log.result === 'valid' ? <CheckCircle2 size={24} /> : log.result === 'used' ? <AlertTriangle size={24} /> : <AlertCircle size={24} />}
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--primary)' }}>{log.products?.name || 'Unknown Product'}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--background)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                                {log.vendors?.company_name || 'Unknown Vendor'}
                                            </span>
                                        </div>

                                        <div style={{ marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                            Scanned by {log.users?.full_name || log.verifier_name || 'System Operator'}
                                        </div>

                                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <MapPin size={14} />
                                                {log.location || 'Unknown Location'}
                                            </div>
                                            {log.ip_address && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Smartphone size={14} />
                                                    {log.ip_address}
                                                </div>
                                            )}
                                            <div>
                                                Serial: <span style={{ fontFamily: 'monospace' }}>{log.products?.serial_number || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                            {new Date(log.created_at).toLocaleString()}
                                        </span>
                                        <Badge type={log.result === 'valid' ? 'success' : log.result === 'used' ? 'warning' : 'error'}>
                                            {(log.result || 'UNKNOWN').toUpperCase()}
                                        </Badge>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
};

export default SystemLogs;
