import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

// Pages (to be created)
import Login from './pages/Login';
import Register from './pages/Register';
import VendorDashboard from './pages/VendorDashboard';
import VerifierDashboard from './pages/VerifierDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

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

        // Listen for changes
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
                console.error('Profile not found, signing out...');
                await supabase.auth.signOut();
                return;
            }
            setUserRole(data.role);
        } catch (error) {
            console.error('Error fetching user role:', error.message);
            await supabase.auth.signOut();
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading-screen">Loading...</div>;
    }

    return (
        <Router>
            <Routes>
                <Route path="/" element={!session ? <Navigate to="/login" /> : <RoleRedirect role={userRole} />} />
                <Route path="/login" element={session ? <RoleRedirect role={userRole} /> : <Login />} />
                <Route path="/register" element={session ? <RoleRedirect role={userRole} /> : <Register />} />

                {/* Protected Routes */}
                <Route path="/vendor" element={session && userRole === 'vendor' ? <VendorDashboard /> : <Navigate to="/login" />} />
                <Route path="/vendor/products" element={session && userRole === 'vendor' ? <VendorDashboard /> : <Navigate to="/login" />} />
                <Route path="/vendor/history" element={session && userRole === 'vendor' ? <VendorDashboard /> : <Navigate to="/login" />} />

                <Route path="/verifier" element={session && userRole === 'verifier' ? <VerifierDashboard /> : <Navigate to="/login" />} />
                <Route path="/verifier/history" element={session && userRole === 'verifier' ? <VerifierDashboard /> : <Navigate to="/login" />} />

                <Route path="/admin" element={session && userRole === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} />
                <Route path="/admin/users" element={session && userRole === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} />
                <Route path="/admin/logs" element={session && userRole === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} />

                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" />} />
            </Routes>
        </Router>
    );
}

function RoleRedirect({ role }) {
    if (!role) return <div className="loading-screen">Finalizing profile...</div>;
    if (role === 'vendor') return <Navigate to="/vendor" />;
    if (role === 'verifier') return <Navigate to="/verifier" />;
    if (role === 'admin') return <Navigate to="/admin" />;
    return <Navigate to="/login" />;
}

export default App;
