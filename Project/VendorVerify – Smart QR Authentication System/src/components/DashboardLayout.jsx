import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogOut, Home, Box, QrCode, ClipboardList, Settings, User } from 'lucide-react';

export default function DashboardLayout({ children, role, title }) {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const menuItems = {
        vendor: [
            { icon: <Home size={20} />, label: 'Overview', path: '/vendor' },
            { icon: <Box size={20} />, label: 'Products', path: '/vendor/products' },
            { icon: <ClipboardList size={20} />, label: 'Scan History', path: '/vendor/history' },
        ],
        verifier: [
            { icon: <QrCode size={20} />, label: 'Scanner', path: '/verifier' },
            { icon: <ClipboardList size={20} />, label: 'Recent Scans', path: '/verifier/history' },
        ],
        admin: [
            { icon: <Home size={20} />, label: 'Overview', path: '/admin' },
            { icon: <User size={20} />, label: 'Users', path: '/admin/users' },
            { icon: <ClipboardList size={20} />, label: 'Audit Logs', path: '/admin/logs' },
        ]
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--background)' }}>
            {/* Sidebar */}
            <aside style={{
                width: '280px',
                backgroundColor: 'var(--primary)',
                color: 'white',
                padding: '2rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                height: '100vh'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
                    <div style={{ padding: '0.5rem', backgroundColor: 'var(--accent)', borderRadius: '8px' }}>
                        <QrCode size={24} color="white" />
                    </div>
                    <h2 style={{ color: 'white', fontSize: '1.25rem' }}>VendorVerify</h2>
                </div>

                <nav style={{ flex: 1 }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Menu</p>
                    {menuItems[role]?.map((item, index) => (
                        <div
                            key={index}
                            onClick={() => navigate(item.path)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '0.875rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: '0.5rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                backgroundColor: window.location.pathname === item.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                fontWeight: window.location.pathname === item.path ? '600' : '400',
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = window.location.pathname === item.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent'}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </div>
                    ))}
                </nav>

                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.5rem' }}>
                    <div
                        onClick={handleLogout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '0.875rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            color: '#fca5a5',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ marginLeft: '280px', flex: 1, padding: '2rem 3rem' }}>
                <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '1.875rem' }}>{title}</h1>
                        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Manage your secure distribution network</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>Official Vendor</p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Verified Node</p>
                        </div>
                        <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={20} color="var(--text-muted)" />
                        </div>
                    </div>
                </header>

                {children}
            </main>
        </div>
    );
}
