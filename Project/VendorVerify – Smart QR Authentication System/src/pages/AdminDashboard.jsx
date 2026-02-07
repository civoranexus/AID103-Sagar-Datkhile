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
    Smartphone,
    Building2
} from 'lucide-react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { DashboardLayout, Card, Badge, Button, useToast } from '../components/UI';

// Import sub-pages
import UserManagement from './admin/UserManagement';
import SystemLogs from './admin/SystemLogs';

const AdminOverview = () => {
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ users: 0, products: 0, scans: 0, alerts: 0 });
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        setLoading(true);
        try {
            const [
                { count: usersCount, error: usersError },
                { count: productsCount, error: productsError },
                { count: logsCount, error: logsError },
                { count: alertsCount, error: alertsError },
                { data: usersData, error: usersDataError },
                { data: logsData, error: logsDataError }
            ] = await Promise.all([
                supabase.from('users').select('*', { count: 'exact', head: true }),
                supabase.from('products').select('*', { count: 'exact', head: true }),
                supabase.from('audit_logs').select('*', { count: 'exact', head: true }),
                supabase.from('security_alerts').select('*', { count: 'exact', head: true }),
                supabase.from('users').select('*').limit(10),
                supabase.from('audit_logs')
                    .select('*, products(name), users:verifier_id(full_name), vendors(company_name)')
                    .order('created_at', { ascending: false })
                    .limit(15)
            ]);

            if (usersError) console.error('Error fetching users count:', usersError);
            if (productsError) console.error('Error fetching products count:', productsError);
            if (logsError) console.error('Error fetching logs count:', logsError);
            if (alertsError) console.error('Error fetching alerts count:', alertsError);

            if (usersError || productsError || logsError || alertsError) {
                addToast('Some data failed to load. Check console for details.', 'warning');
            }

            setStats({
                users: usersCount || 0,
                products: productsCount || 0,
                scans: logsCount || 0,
                alerts: alertsCount || 0
            });

            setUsers(usersData || []);
            setLogs(logsData || []);

        } catch (err) {
            console.error('Critical error loading admin data:', err);
            addToast('Failed to load dashboard data', 'error');
        } finally {
            setLoading(false);
        }
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
        const headers = ["Timestamp", "Product", "Vendor", "Verifier", "Result"];
        const csvRows = [headers.join(',')];

        filteredLogs.forEach(log => {
            const row = [
                `"${new Date(log.created_at).toLocaleString()}"`,
                `"${log.products?.name || 'Unknown'}"`,
                `"${log.vendors?.company_name || 'Generic Vendor'}"`,
                `"${log.users?.full_name || log.verifier_name || 'System Operator'}"`,
                `"${log.result}"`
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        addToast('Audit logs exported successfully', 'success');
    };

    return (
        <div className="fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <h1 className="font-display" style={{ fontSize: '1.75rem' }}>Security Control Center</h1>
                <p style={{ color: 'var(--text-muted)' }}>Monitor system-wide authentication activity and integrity</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3" style={{ marginBottom: '2.5rem' }}>
                {[
                    { label: 'Total Users', value: stats.users, icon: Users, color: 'var(--accent)', path: '/AdminDashboard/users' },
                    { label: 'Protected Products', value: stats.products, icon: BarChart3, color: 'var(--primary)', path: null },
                    { label: 'Authentication Logs', value: stats.scans, icon: FileText, color: 'var(--success)', path: '/AdminDashboard/logs' },
                ].map((stat, i) => (
                    <div key={i} onClick={() => stat.path && navigate(stat.path)} style={{ cursor: stat.path ? 'pointer' : 'default' }}>
                        <Card>
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
                    </div>
                ))}
            </div>

            <div className="grid">
                {/* Audit Logs Table */}
                <Card style={{ padding: '0' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Real-time Audit Trail</h3>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ position: 'relative', width: '300px' }}>
                                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    className="input-field"
                                    placeholder="Search logs..."
                                    style={{ paddingLeft: '3rem' }}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button className="btn-primary" onClick={handleExportCSV}>Export CSV</Button>
                        </div>
                    </div>
                    <div className="table-container" style={{ border: 'none' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>Product</th>
                                    <th>Vendor</th>
                                    <th>Verifier</th>
                                    <th>Result</th>
                                    <th>Metadata</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map(log => (
                                    <tr key={log.id}>
                                        <td style={{ whiteSpace: 'nowrap' }}>
                                            <div style={{ fontSize: '0.875rem' }}>{new Date(log.created_at).toLocaleDateString()}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(log.created_at).toLocaleTimeString()}</div>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{log.products?.name || 'Unknown'}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Building2 size={14} color="var(--primary)" />
                                                <span style={{ fontWeight: 500 }}>{log.vendors?.company_name || 'Generic Vendor'}</span>
                                            </div>
                                        </td>
                                        <td>{log.users?.full_name || log.verifier_name || 'System Operator'}</td>
                                        <td>
                                            <Badge type={log.result === 'valid' ? 'success' : log.result === 'used' ? 'warning' : 'error'}>
                                                {log.result === 'valid' ? <CheckCircle2 size={12} style={{ marginRight: 4 }} /> :
                                                    log.result === 'used' ? <AlertTriangle size={12} style={{ marginRight: 4 }} /> : <XCircle size={12} style={{ marginRight: 4 }} />}
                                                {log.result?.toUpperCase()}
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
    );
};

const AdminDashboard = () => {
    const navItems = [
        { label: 'Overview', path: '/AdminDashboard', icon: BarChart3 },
        { label: 'User Management', path: '/AdminDashboard/users', icon: Users },
        { label: 'System Logs', path: '/AdminDashboard/logs', icon: FileText },
    ];

    return (
        <DashboardLayout role="Administrator" navItems={navItems}>
            <Routes>
                <Route path="/" element={<AdminOverview />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="logs" element={<SystemLogs />} />
                <Route path="*" element={<Navigate to="/AdminDashboard" />} />
            </Routes>
        </DashboardLayout>
    );
};

export default AdminDashboard;
