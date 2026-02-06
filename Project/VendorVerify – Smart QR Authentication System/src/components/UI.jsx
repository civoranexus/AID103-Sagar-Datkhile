import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { LogOut, LayoutDashboard, Database, ClipboardList, ShieldAlert, User, Menu, X, CheckCircle, AlertTriangle, XCircle, Bell, Info, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';

// --- Toast System ---
const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div style={{
                position: 'fixed',
                top: '2rem',
                right: '2rem',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                pointerEvents: 'none',
                width: '100%',
                maxWidth: '400px'
            }}>
                <div style={{ position: 'relative', width: '100%', height: '0' }}>
                    {toasts.slice(-3).reverse().map((toast, index) => {
                        const scale = index === 0 ? 1 : index === 1 ? 0.96 : 0.92;
                        const opacity = index === 0 ? 1 : index === 1 ? 0.9 : 0.8;
                        const translateY = index === 0 ? 0 : index === 1 ? 10 : 20;
                        const blur = index === 0 ? 12 : 12 + (index * 4);
                        const zIndex = 100 - index;

                        return (
                            <div
                                key={toast.id}
                                className="glass-toast"
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    width: '100%',
                                    maxWidth: '350px',
                                    padding: '1rem 1.25rem',
                                    borderRadius: '1.25rem',
                                    background: 'rgba(255, 255, 255, 0.45)',
                                    backdropFilter: `blur(${blur}px) saturate(180%)`,
                                    WebkitBackdropFilter: `blur(${blur}px) saturate(180%)`,
                                    border: '1px solid rgba(255, 255, 255, 0.4)',
                                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.875rem',
                                    color: '#000000',
                                    fontWeight: '600',
                                    pointerEvents: 'auto',
                                    cursor: 'pointer',
                                    transition: 'all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)',
                                    transform: `translateY(${translateY}px) scale(${scale})`,
                                    transformOrigin: 'right top',
                                    opacity: opacity,
                                    zIndex: zIndex,
                                }}
                                onClick={() => removeToast(toast.id)}
                            >
                                <div style={{
                                    color: toast.type === 'success' ? '#10B981' :
                                        toast.type === 'error' ? '#EF4444' :
                                            toast.type === 'warning' ? '#F59E0B' : '#3B82F6',
                                    display: 'flex',
                                    flexShrink: 0
                                }}>
                                    {toast.type === 'success' && <CheckCircle size={20} />}
                                    {toast.type === 'error' && <XCircle size={20} />}
                                    {toast.type === 'warning' && <AlertTriangle size={20} />}
                                    {toast.type === 'info' && <Info size={20} />}
                                </div>
                                <span style={{
                                    flex: 1,
                                    fontSize: '0.9rem',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {toast.message}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};

// --- Standard Components ---
export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
    const variantClass = `btn-${variant}`;
    return (
        <button className={`btn ${variantClass} ${className}`} {...props}>
            {children}
        </button>
    );
};

export const Input = ({ label, error, ...props }) => (
    <div className="input-group">
        {label && <label className="input-label">{label}</label>}
        <input className={`input-field ${error ? 'border-error' : ''}`} {...props} />
        {error && <p className="text-error" style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--error)' }}>{error}</p>}
    </div>
);

export const Card = ({ children, title, className = '', ...props }) => (
    <div className={`card fade-in ${className}`} {...props}>
        {title && <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>{title}</h3>}
        {children}
    </div>
);

export const Badge = ({ children, type = 'info' }) => (
    <span className={`badge badge-${type}`}>
        {children}
    </span>
);

export const Modal = ({ isOpen, onClose, title, children, contentStyle = {} }) => {
    if (!isOpen) return null;
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            padding: '1.5rem'
        }} onClick={onClose}>
            <div
                className="card shadow-lg fade-in"
                style={{ width: '100%', maxWidth: '550px', padding: 0, overflow: 'hidden', ...contentStyle }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.1rem', margin: 0 }}>{title}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <X size={20} />
                    </button>
                </div>
                <div style={{ padding: '1.5rem' }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export const DashboardLayout = ({ children, role, navItems }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { addToast } = useToast();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('users')
                    .select('full_name')
                    .eq('id', user.id)
                    .single();
                if (data) setUserName(data.full_name);
            }
        };
        fetchUser();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        addToast('Sign out successful', 'success');
        navigate('/Login');
    };

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: 'var(--accent)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                        <ShieldCheck size={24} color="white" />
                    </div>
                    <div>
                        <h2 className="font-display" style={{ fontSize: '1.1rem', letterSpacing: '-0.02em' }}>Vendor Verify</h2>
                        <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>{role} Dashboard</span>
                    </div>
                </div>

                <nav style={{ flex: 1 }}>
                    {navItems.map((item) => (
                        <div
                            key={item.path}
                            onClick={() => {
                                navigate(item.path);
                                setSidebarOpen(false);
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.875rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                marginBottom: '0.5rem',
                                transition: 'all 0.2s',
                                backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent',
                                color: location.pathname === item.path ? 'white' : 'rgba(255,255,255,0.6)'
                            }}
                        >
                            <item.icon size={20} />
                            <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{item.label}</span>
                        </div>
                    ))}
                </nav>

                <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                    <div
                        onClick={() => setShowLogoutConfirm(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}
                    >
                        <LogOut size={20} />
                        <span style={{ fontSize: '0.9rem' }}>Sign Out</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="top-nav">
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{userName || 'Personalizing...'}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{role} Account</span>
                        </div>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: 'var(--primary)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <User size={18} />
                        </div>
                    </div>
                </header>
                <div style={{ paddingTop: '2rem' }}>
                    {children}
                </div>
            </main>

            <Modal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                title="Confirm Sign Out"
            >
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--error)',
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem'
                    }}>
                        <LogOut size={24} />
                    </div>
                    <h3 style={{ marginBottom: '1rem' }}>Do you really want to log out?</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                        You will need to enter your credentials again to access your secure dashboard.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Button variant="outline" style={{ flex: 1 }} onClick={() => setShowLogoutConfirm(false)}>Cancel</Button>
                        <Button variant="primary" style={{ flex: 1, backgroundColor: 'var(--error)' }} onClick={handleLogout}>Log Out</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
