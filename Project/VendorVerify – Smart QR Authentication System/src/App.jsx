import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import { supabase } from './lib/supabase';

// Pages
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VendorDashboard = lazy(() => import('./pages/VendorDashboard'));
const VerifierDashboard = lazy(() => import('./pages/VerifierDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const handleAuthState = async (session) => {
            if (!isMounted) return;
            setSession(session);

            if (session) {
                await fetchUserRole(session.user.id);
            } else {
                setUserRole(null);
                setLoading(false);
            }
        };

        // Initial check
        supabase.auth.getSession().then(({ data: { session } }) => {
            handleAuthState(session);
        });

        // Listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            handleAuthState(session);
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const fetchUserRole = async (userId, retries = 2) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .select('role')
                .eq('id', userId)
                .single();

            if (error || !data) {
                if (retries > 0) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return fetchUserRole(userId, retries - 1);
                }
                console.warn('Profile sync required...');
                await supabase.auth.signOut();
                return;
            }
            setUserRole(data.role);
        } catch (error) {
            console.error('Role auth error:', error);
            await supabase.auth.signOut();
        } finally {
            setLoading(false);
        }
    };

    // Global Loading State
    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>SECURE LOADING</div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Establishing Encryption Protocol...</div>
                </div>
            </div>
        );
    }

    return (
        <Suspense fallback={
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Loading security module...</div>
            </div>
        }>
            <Routes>
                {/* Public Routes */}
                <Route path="/Login" element={session && userRole ? <Navigate to={getDashboardPath(userRole)} /> : <Login />} />
                <Route path="/Register" element={session && userRole ? <Navigate to={getDashboardPath(userRole)} /> : <Register />} />

                {/* Root Redirects */}
                <Route path="/" element={session && userRole ? <Navigate to={getDashboardPath(userRole)} /> : session && !userRole ? <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}><div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#3b82f6', marginBottom: '0.5rem' }}>FINALIZING PROFILE</div><div style={{ fontSize: '0.875rem', opacity: 0.6 }}>Synchronizing identity...</div></div></div> : <Navigate to="/Login" />} />
                <Route path="/login" element={<Navigate to="/Login" />} />
                <Route path="/register" element={<Navigate to="/Register" />} />

                {/* Protected Routes */}
                <Route path="/VendorDashboard/*" element={session && userRole === 'vendor' ? <VendorDashboard /> : <Navigate to="/Login" />} />
                <Route path="/VerifierDashboard/*" element={session && userRole === 'verifier' ? <VerifierDashboard /> : <Navigate to="/Login" />} />
                <Route path="/AdminDashboard/*" element={session && userRole === 'admin' ? <AdminDashboard /> : <Navigate to="/Login" />} />

                <Route path="/NotFound" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/NotFound" />} />
            </Routes>
        </Suspense>
    );
}

// Helper to determine dashboard path
function getDashboardPath(role) {
    if (role === 'vendor') return '/VendorDashboard';
    if (role === 'verifier') return '/VerifierDashboard';
    if (role === 'admin') return '/AdminDashboard';
    return '/Login';
}

export default App;
