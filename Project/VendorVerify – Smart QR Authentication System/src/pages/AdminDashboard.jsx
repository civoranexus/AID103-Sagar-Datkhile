import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { Card, Button } from '../components/UI';
import { Users, Shield, Activity, BarChart3, AlertTriangle, Eye } from 'lucide-react';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ users: 0, products: 0, scans: 0, alerts: 0 });
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            const [uRes, pRes, sRes, aRes] = await Promise.all([
                supabase.from('users').select('*', { count: 'exact', head: true }),
                supabase.from('products').select('*', { count: 'exact', head: true }),
                supabase.from('verification_logs').select('*', { count: 'exact', head: true }),
                supabase.from('security_alerts').select('*', { count: 'exact', head: true })
            ]);

            setStats({
                users: uRes.count || 0,
                products: pRes.count || 0,
                scans: sRes.count || 0,
                alerts: aRes.count || 0
            });

            const { data: logsData } = await supabase
                .from('verification_logs')
                .select(`
          *,
          qr_codes (
            products (name, vendors (company_name))
          )
        `)
                .order('created_at', { ascending: false })
                .limit(10);

            setLogs(logsData || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout role="admin" title="Global Security Center">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <AdminStatCard title="Total Users" value={stats.users} icon={<Users size={24} />} trend="+12% this month" />
                <AdminStatCard title="Total Products" value={stats.products} icon={<Shield size={24} />} trend="+5% this month" />
                <AdminStatCard title="Total Scans" value={stats.scans} icon={<Activity size={24} />} trend="+24% this month" />
                <AdminStatCard title="Security Alerts" value={stats.alerts} icon={<AlertTriangle size={24} />} trend="0 alerts" color="var(--danger)" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem' }}>Live Audit Feed</h2>
                        <Button variant="outline"><BarChart3 size={18} /> View All Logs</Button>
                    </div>
                    <Card padding="0">
                        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', boxShadow: '0 1px 0 var(--border)' }}>
                                    <tr>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)' }}>TIMESTAMP</th>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)' }}>PRODUCT</th>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)' }}>RESULT</th>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)' }}>LOCATION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map(log => (
                                        <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}>{new Date(log.created_at).toLocaleString()}</td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{log.qr_codes?.products?.name || 'N/A'}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.qr_codes?.products?.vendors?.company_name}</div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <span style={{
                                                    padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase',
                                                    backgroundColor: log.result === 'success' ? '#dcfce7' : '#fee2e2',
                                                    color: log.result === 'success' ? '#166534' : '#991b1b'
                                                }}>{log.result}</span>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{log.ip_address}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                <div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem' }}>System Health</h2>
                    </div>
                    <Card>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <HealthItem label="Database Consistency" status="Healthy" percent={99.9} />
                            <HealthItem label="Auth Service" status="Up" percent={100} />
                            <HealthItem label="QR Generation Engine" status="Nominal" percent={98.5} />
                            <HealthItem label="Audit Pipeline" status="Active" percent={100} />
                        </div>

                        <div style={{ marginTop: '2.5rem', padding: '1rem', backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius-md)', color: 'white' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <Shield size={18} color="var(--accent)" />
                                <span style={{ fontWeight: '600' }}>Security Protocol 4.2</span>
                            </div>
                            <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>RSI checks enabled. Immutable logging active for all verifier nodes.</p>
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}

function AdminStatCard({ title, value, icon, trend, color = 'var(--accent)' }) {
    return (
        <Card padding="1.5rem">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: `${color}15`, color: color, borderRadius: '8px' }}>
                    {icon}
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: trend.includes('-') ? 'var(--danger)' : 'var(--success)' }}>{trend}</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{title}</p>
            <h3 style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>{value}</h3>
        </Card>
    );
}

function HealthItem({ label, status, percent }) {
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: '500' }}>{label}</span>
                <span style={{ color: 'var(--success)', fontWeight: '600' }}>{status}</span>
            </div>
            <div style={{ height: '6px', backgroundColor: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${percent}%`, backgroundColor: 'var(--success)' }}></div>
            </div>
        </div>
    );
}
