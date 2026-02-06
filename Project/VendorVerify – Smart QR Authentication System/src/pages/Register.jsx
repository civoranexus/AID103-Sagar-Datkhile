import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ShieldCheck, Mail, Lock, User, Building, BadgeCheck, Loader2 } from 'lucide-react';
import { Button, Card, useToast } from '../components/UI';

const Register = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState('vendor'); // 'vendor' or 'verifier'

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        companyName: '',
        employeeId: ''
    });

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Sign Up
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("Registration failed");

            // 2. Create Profile in public.users
            const userId = authData.user.id;

            const { error: userError } = await supabase
                .from('users')
                .insert({
                    id: userId,
                    email: formData.email,
                    role: role,
                    full_name: formData.fullName || formData.companyName // fallback
                });

            if (userError) throw userError;

            // 3. Create Role-specific profile
            if (role === 'vendor') {
                const { error: vendorError } = await supabase
                    .from('vendors')
                    .insert({
                        id: userId,
                        company_name: formData.companyName
                    });
                if (vendorError) throw vendorError;
            } else if (role === 'verifier') {
                const { error: verifierError } = await supabase
                    .from('verifiers')
                    .insert({
                        id: userId,
                        full_name: formData.fullName,
                        employee_id: formData.employeeId
                    });
                if (verifierError) throw verifierError;
            }

            addToast('Registration successful! Directing to dashboard...', 'success');

            // 4. Navigate
            if (role === 'vendor') navigate('/VendorDashboard');
            else if (role === 'verifier') navigate('/VerifierDashboard');
            else navigate('/');

        } catch (err) {
            console.error(err);
            addToast(err.message || 'Registration failed', 'error');
            // If auth succeeded but profile failed, we might have a ghost user. 
            // Ideally handle rollback or better error msg, but keeping it simple.
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
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        background: 'var(--primary)',
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem',
                        boxShadow: 'var(--shadow-lg)'
                    }}>
                        <ShieldCheck color="white" size={28} />
                    </div>
                    <h1 className="font-display" style={{ fontSize: '1.75rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Create Account</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Join the secure verification network</p>
                </div>

                <Card style={{ padding: '2rem' }}>
                    <form onSubmit={handleRegister}>

                        {/* Role Selection */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div
                                onClick={() => setRole('vendor')}
                                style={{
                                    border: role === 'vendor' ? '2px solid var(--primary)' : '1px solid var(--border)',
                                    borderRadius: '8px', padding: '0.75rem', cursor: 'pointer', textAlign: 'center',
                                    backgroundColor: role === 'vendor' ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Building size={24} style={{ margin: '0 auto 0.5rem', color: role === 'vendor' ? 'var(--primary)' : 'var(--text-muted)' }} />
                                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: role === 'vendor' ? 'var(--primary)' : 'var(--text-muted)' }}>Vendor</div>
                            </div>
                            <div
                                onClick={() => setRole('verifier')}
                                style={{
                                    border: role === 'verifier' ? '2px solid var(--primary)' : '1px solid var(--border)',
                                    borderRadius: '8px', padding: '0.75rem', cursor: 'pointer', textAlign: 'center',
                                    backgroundColor: role === 'verifier' ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <BadgeCheck size={24} style={{ margin: '0 auto 0.5rem', color: role === 'verifier' ? 'var(--primary)' : 'var(--text-muted)' }} />
                                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: role === 'verifier' ? 'var(--primary)' : 'var(--text-muted)' }}>Verifier</div>
                            </div>
                        </div>

                        {/* Common Fields */}
                        <div style={{ marginBottom: '1rem' }}>
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

                        <div style={{ marginBottom: '1rem' }}>
                            <label className="input-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    className="input-field"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    style={{ paddingLeft: '3rem' }}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Role Specific Fields */}
                        {role === 'vendor' ? (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label className="input-label">Company Name</label>
                                <div style={{ position: 'relative' }}>
                                    <Building size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        className="input-field"
                                        type="text"
                                        placeholder="Acme Inc."
                                        required
                                        style={{ paddingLeft: '3rem' }}
                                        value={formData.companyName}
                                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label className="input-label">Full Name</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            className="input-field"
                                            type="text"
                                            placeholder="John Doe"
                                            required
                                            style={{ paddingLeft: '3rem' }}
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label className="input-label">Employee ID (Optional)</label>
                                    <div style={{ position: 'relative' }}>
                                        <BadgeCheck size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            className="input-field"
                                            type="text"
                                            placeholder="EMP-123"
                                            style={{ paddingLeft: '3rem' }}
                                            value={formData.employeeId}
                                            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <Button
                            className="btn-primary"
                            style={{ width: '100%', height: '3rem' }}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
                        </Button>
                    </form>
                </Card>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Already have an account? <Link to="/Login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
