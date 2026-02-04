import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Users,
    FileText,
    ShieldAlert,
    BarChart3,
    Search,
    Filter,
    MoreVertical,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    MapPin,
    Smartphone
} from 'lucide-react';
import { DashboardLayout, Card, Badge, Button } from '../components/UI';

const AdminDashboard = () => {
    const [stats, setStats] = useState({ users: 0, products: 0, scans: 0, alerts: 0 });
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        setLoading(true);

        // Fetch users
        const { data: usersData } = await supabase.from('users').select('*').limit(10);

        // Fetch logs with details
        const { data: logsData } = await supabase
            .from('audit_logs')
            .select('*, products(name), users:verifier_id(full_name)')
            .order('created_at', { ascending: false })
            .limit(15);

        // Mock stats for demo
        setStats({
            users: usersData?.length || 0,
            products: 124,
            scans: 4852,
            alerts: 12
        });

        setUsers(usersData || []);
        setLogs(logsData || []);
        setLoading(false);
    };

    const navItems = [
        { label: 'Overview', path: '/admin', icon: BarChart3 },
        { label: 'User Management', path: '/admin/users', icon: Users },
        { label: 'System Logs', path: '/admin/logs', icon: FileText },
        { label: 'Security Alerts', path: '/admin/alerts', icon: ShieldAlert },
    ];

    return (
        <DashboardLayout role="Administrator" navItems={navItems}>
            <div className="fade-in">
                <div style={{ marginBottom: '2rem' }}>
                    <h1 className="font-display" style={{ fontSize: '1.75rem' }}>Security Control Center</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Monitor system-wide authentication activity and integrity</p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-4" style={{ marginBottom: '2.5rem' }}>
                    {[
                        { label: 'Total Users', value: stats.users, icon: Users, color: 'var(--accent)' },
                        { label: 'Protected Products', value: stats.products, icon: BarChart3, color: 'var(--primary)' },
                        { label: 'Authentication Logs', value: stats.scans, icon: FileText, color: 'var(--success)' },
                        { label: 'Security Threats', value: stats.alerts, icon: ShieldAlert, color: 'var(--error)' },
                    ].map((stat, i) => (
                        <Card key={i}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: `${stat.color}15`, padding: '0.75rem', borderRadius: 'var(--radius-md)', color: stat.color }}>
                                    <stat.icon size={24} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{stat.label}</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{stat.value}</div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="grid">
                    {/* Audit Logs Table */}
                    <Card title="Real-time Audit Trail" style={{ padding: '0' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ position: 'relative', width: '300px' }}>
                                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input className="input-field" placeholder="Search logs..." style={{ paddingLeft: '3rem' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <Button variant="outline"><Filter size={18} /> Filter</Button>
                                <Button className="btn-primary">Export CSV</Button>
                            </div>
                        </div>
                        <div className="table-container" style={{ border: 'none' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Timestamp</th>
                                        <th>Product</th>
                                        <th>Verifier</th>
                                        <th>Result</th>
                                        <th>Metadata</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map(log => (
                                        <tr key={log.id}>
                                            <td style={{ whiteSpace: 'nowrap' }}>
                                                <div style={{ fontSize: '0.875rem' }}>{new Date(log.created_at).toLocaleDateString()}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(log.created_at).toLocaleTimeString()}</div>
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{log.products?.name || 'Unknown'}</td>
                                            <td>{log.users?.full_name || 'System Operator'}</td>
                                            <td>
                                                <Badge type={log.status === 'valid' ? 'success' : log.status === 'used' ? 'warning' : 'error'}>
                                                    {log.status === 'valid' ? <CheckCircle2 size={12} style={{ marginRight: 4 }} /> :
                                                        log.status === 'used' ? <AlertTriangle size={12} style={{ marginRight: 4 }} /> : <XCircle size={12} style={{ marginRight: 4 }} />}
                                                    {log.status}
                                                </Badge>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                                    <MapPin size={12} /> NYC, US
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                                    <Smartphone size={12} /> iOS 17.2
                                                </div>
                                            </td>
                                            <td>
                                                <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                                    <MoreVertical size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;
