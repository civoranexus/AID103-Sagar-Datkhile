import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ShieldCheck, Mail, Lock, Loader2 } from 'lucide-react';
import { Button, Input, Card, useToast } from '../components/UI';

const Login = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data, error: loginError } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (loginError) throw loginError;

            // Check if profile exists
            const { data: userData, error: roleError } = await supabase
                .from('users')
                .select('role')
                .eq('id', data.user.id)
                .single();

            if (roleError || !userData) {
                console.error('Profile fetch failed:', roleError);
                addToast('Account exists but profile is missing. Please Register again.', 'warning');
                await supabase.auth.signOut();
                return;
            }

            addToast('Welcome back! Authentication successful.', 'success');
            // Redirection is handled by App.jsx auth listener

        } catch (err) {
            setError(err.message || 'Invalid login credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: 'radial-gradient(circle at 2px 2px, var(--border) 1px, transparent 0)',
            backgroundSize: '40px 40px',
            padding: '1.5rem'
        }}>
            <div className="fade-in" style={{ width: '100%', maxWidth: '440px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        background: 'var(--primary)',
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.25rem',
                        boxShadow: 'var(--shadow-lg)'
                    }}>
                        <ShieldCheck color="white" size={32} />
                    </div>
                    <h1 className="font-display" style={{ fontSize: '1.875rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Secure Portal</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Enter your credentials to access VendorVerify</p>
                </div>

                <Card style={{ padding: '2.5rem' }}>
                    {error && (
                        <div style={{
                            padding: '0.875rem 1rem',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: 'var(--error)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.875rem',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <Lock size={16} /> {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label className="input-label">Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    className="input-field"
                                    type="email"
                                    placeholder="name@company.com"
                                    required
                                    style={{ paddingLeft: '3rem' }}
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label className="input-label" style={{ margin: 0 }}>Password</label>
                                <span style={{ fontSize: '0.75rem', color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }}>Forgot password?</span>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    className="input-field"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    style={{ paddingLeft: '3rem' }}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <Button
                            className="btn-primary"
                            style={{ width: '100%', height: '3rem' }}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
                        </Button>
                    </form>
                </Card>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Don't have an account? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Register your business</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
