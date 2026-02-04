import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ShieldPlus, User, Mail, Lock, Building, Loader2, Check, ShieldCheck, Scan } from 'lucide-react';
import { Button, Card, useToast } from '../components/UI';

const Register = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        role: 'vendor' // 'vendor' or 'verifier'
    });

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Sign up user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        role: formData.role
                    }
                }
            });

            if (authError) throw authError;

            if (authData.user) {
                // 2. Create user profile (Upsert to handle potential retries)
                const { error: profileError } = await supabase
                    .from('users')
                    .upsert([
                        {
                            id: authData.user.id,
                            email: formData.email,
                            full_name: formData.fullName,
                            role: formData.role
                        },
                    ]);

                if (profileError) throw profileError;

                // 3. Create role-specific profiles
                if (formData.role === 'vendor') {
                    const { error: vendorError } = await supabase
                        .from('vendors')
                        .upsert([
                            {
                                user_id: authData.user.id,
                                company_name: formData.fullName
                            }
                        ]);
                    if (vendorError) throw vendorError;
                } else if (formData.role === 'verifier') {
                    // Note: Use 'verifiers' table if it exists, otherwise skip
                    // The error "relation verifiers does not exist" suggests the code is trying to find it
                    // I will ensure we only use valid tables from our schema
                    const { error: verifierError } = await supabase
                        .from('users') // Staying synced with 'users'
                        .update({ full_name: formData.fullName })
                        .eq('id', authData.user.id);
                    if (verifierError) throw verifierError;
                }

                addToast('Account created successfully! Welcome to the network.', 'success');

                // Redirect based on role
                if (formData.role === 'vendor') navigate('/VendorDashboard');
                else navigate('/VerifierDashboard');
            }
        } catch (err) {
            addToast(err.message || 'Registration failed', 'error');
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
            padding: '2rem 1.5rem'
        }}>
            <div className="fade-in" style={{ width: '100%', maxWidth: '500px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        background: 'var(--accent)',
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.25rem',
                        boxShadow: 'var(--shadow-lg)'
                    }}>
                        <ShieldPlus color="white" size={32} />
                    </div>
                    <h1 className="font-display" style={{ fontSize: '1.875rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Create Account</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Join VendorVerify security network</p>
                </div>

                <Card style={{ padding: '2.5rem' }}>
                    <form onSubmit={handleRegister}>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label className="input-label">Name</label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    className="input-field"
                                    type="text"
                                    placeholder={formData.role === 'vendor' ? "Company Name" : "Your Full Name"}
                                    required
                                    style={{ paddingLeft: '3rem' }}
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.25rem' }}>
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

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label className="input-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    className="input-field"
                                    type="password"
                                    placeholder="Min. 6 characters"
                                    required
                                    minLength={6}
                                    style={{ paddingLeft: '3rem' }}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label className="input-label">Select Your Role</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div
                                    onClick={() => setFormData({ ...formData, role: 'vendor' })}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: `2px solid ${formData.role === 'vendor' ? 'var(--accent)' : 'var(--border)'}`,
                                        backgroundColor: formData.role === 'vendor' ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        position: 'relative'
                                    }}
                                >
                                    {formData.role === 'vendor' && <Check size={14} style={{ position: 'absolute', top: 8, right: 8, color: 'var(--accent)' }} />}
                                    <Building size={24} style={{ marginBottom: '0.5rem', color: formData.role === 'vendor' ? 'var(--accent)' : 'var(--text-muted)' }} />
                                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Vendor</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Issue QR Codes</div>
                                </div>
                                <div
                                    onClick={() => setFormData({ ...formData, role: 'verifier' })}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: `2px solid ${formData.role === 'verifier' ? 'var(--accent)' : 'var(--border)'}`,
                                        backgroundColor: formData.role === 'verifier' ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        position: 'relative'
                                    }}
                                >
                                    {formData.role === 'verifier' && <Check size={14} style={{ position: 'absolute', top: 8, right: 8, color: 'var(--accent)' }} />}
                                    <Scan size={24} style={{ marginBottom: '0.5rem', color: formData.role === 'verifier' ? 'var(--accent)' : 'var(--text-muted)' }} />
                                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Verifier</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Scan & Verify</div>
                                </div>
                            </div>
                        </div>

                        <Button
                            className="btn-accent"
                            style={{ width: '100%', height: '3rem' }}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
                        </Button>
                    </form>
                </Card>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Already have an account? <Link to="/Login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Sign in here</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
