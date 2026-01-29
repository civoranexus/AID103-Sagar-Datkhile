import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button, Input, Card } from '../components/UI';
import { ShieldCheck, User, Building, Search } from 'lucide-react';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('vendor');
    const [companyName, setCompanyName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Sign up user
            const { data: { user }, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (signUpError) throw signUpError;

            if (user) {
                // 2. Insert into users table
                const { error: userError } = await supabase
                    .from('users')
                    .insert([{ id: user.id, email, role }]);

                if (userError) throw userError;

                // 3. If vendor, insert into vendors table
                if (role === 'vendor') {
                    const { error: vendorError } = await supabase
                        .from('vendors')
                        .insert([{ user_id: user.id, company_name: companyName }]);

                    if (vendorError) throw vendorError;
                }

                alert('Registration successful! Please check your email for verification.');
                navigate('/login');
            }
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
            padding: '2rem 1rem',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
        }}>
            <Card style={{ maxWidth: '450px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1>Create Account</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Join the secure authentication network</p>
                </div>

                {error && (
                    <div style={{
                        padding: '0.75rem',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--danger)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.875rem',
                        marginBottom: '1.5rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div
                            onClick={() => setRole('vendor')}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                textAlign: 'center',
                                border: `2px solid ${role === 'vendor' ? 'var(--accent)' : 'var(--border)'}`,
                                backgroundColor: role === 'vendor' ? 'rgba(59, 130, 246, 0.05)' : 'white',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <Building size={24} color={role === 'vendor' ? 'var(--accent)' : 'var(--text-muted)'} style={{ marginBottom: '0.5rem' }} />
                            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Vendor</div>
                        </div>
                        <div
                            onClick={() => setRole('verifier')}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                textAlign: 'center',
                                border: `2px solid ${role === 'verifier' ? 'var(--accent)' : 'var(--border)'}`,
                                backgroundColor: role === 'verifier' ? 'rgba(59, 130, 246, 0.05)' : 'white',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <Search size={24} color={role === 'verifier' ? 'var(--accent)' : 'var(--text-muted)'} style={{ marginBottom: '0.5rem' }} />
                            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Verifier</div>
                        </div>
                    </div>

                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Input
                        label="Password"
                        type="password"
                        placeholder="Min 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    {role === 'vendor' && (
                        <Input
                            label="Company Name"
                            type="text"
                            placeholder="Your Business Name"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            required
                        />
                    )}

                    <Button type="submit" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
                        {loading ? 'Creating Account...' : 'Continue'}
                    </Button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Already have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: '600' }}>Log In</Link>
                    </p>
                </div>
            </Card>
        </div>
    );
}
