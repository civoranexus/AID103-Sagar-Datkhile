import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button, Input, Card } from '../components/UI';
import { ShieldCheck, Lock, Mail } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            navigate('/');
        } catch (err) {
            setError(err.message);
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
            padding: '1rem',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
        }}>
            <Card style={{ maxWidth: '400px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        backgroundColor: 'var(--accent)',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3)'
                    }}>
                        <ShieldCheck size={32} color="white" />
                    </div>
                    <h1>Welcome Back</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Secure Portal for Vendor & Verification</p>
                </div>

                {error && (
                    <div style={{
                        padding: '0.75rem',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--danger)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.875rem',
                        marginBottom: '1.5rem',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        icon={<Mail size={18} />}
                    />
                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        icon={<Lock size={18} />}
                    />

                    <Button type="submit" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </Button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Don't have an account? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: '600' }}>Create one</Link>
                    </p>
                </div>
            </Card>
        </div>
    );
}
