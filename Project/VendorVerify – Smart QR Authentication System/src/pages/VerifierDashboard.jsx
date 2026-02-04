import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { supabase } from '../lib/supabase';
import {
    ShieldCheck,
    ShieldAlert,
    History,
    Scan,
    LogOut,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Loader2,
    Package,
    Building2,
    Clock
} from 'lucide-react';
import { Button, Card, Badge, Modal, useToast } from '../components/UI';
import { useNavigate } from 'react-router-dom';

const VerifierDashboard = () => {
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [scanResult, setScanResult] = useState(null);
    const [isScanning, setIsScanning] = useState(true);
    const [loading, setLoading] = useState(false);
    const [recentScans, setRecentScans] = useState([]);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        if (isScanning) {
            const scanner = new Html5QrcodeScanner('reader', {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            });

            scanner.render(onScanSuccess, onScanFailure);

            return () => {
                scanner.clear().catch(error => console.error('Failed to clear scanner', error));
            };
        }
    }, [isScanning]);

    useEffect(() => {
        fetchRecentScans();
    }, []);

    const fetchRecentScans = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data } = await supabase
            .from('audit_logs')
            .select('*, products(name, sku)')
            .eq('verifier_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);
        setRecentScans(data || []);
    };

    const onScanSuccess = async (decodedText) => {
        setIsScanning(false);
        setLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();

            // Call the secure backend verification API
            const response = await fetch('/api/qr/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ token: decodedText })
            });

            const result = await response.json();

            if (result.status === 'valid' && result.product_id) {
                // Fetch product details if valid
                const { data: product } = await supabase
                    .from('products')
                    .select('*')
                    .eq('id', result.product_id)
                    .single();

                setScanResult({
                    status: 'valid',
                    product: product,
                    timestamp: new Date().toISOString()
                });
                addToast('Success! Product authenticated.', 'success');
            } else if (result.status === 'used') {
                setScanResult({
                    status: 'used',
                    timestamp: new Date().toISOString()
                });
                addToast('Warning: This QR has already been used.', 'warning');
            } else {
                setScanResult({
                    status: 'invalid',
                    timestamp: new Date().toISOString()
                });
                addToast('Alert: Invalid or tampered token detected.', 'error');
            }

            fetchRecentScans();
        } catch (error) {
            console.error('Verification error:', error);
            setScanResult({ status: 'invalid' });
            addToast('Network error during verification', 'error');
        } finally {
            setLoading(false);
        }
    };

    function onScanFailure(error) {
        // Silently handle scan failures to avoid UI clutter
    }

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/Login');
    };

    const resetScanner = () => {
        setScanResult(null);
        setIsScanning(true);
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
            {/* Mobile Header */}
            <header className="top-nav" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: 'var(--primary)', padding: '0.4rem', borderRadius: ' var(--radius-sm)' }}>
                        <ShieldCheck size={20} color="white" />
                    </div>
                    <span className="font-display" style={{ fontWeight: 700 }}>Verifier</span>
                </div>
                <button onClick={() => setShowLogoutConfirm(true)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
                    <LogOut size={20} />
                </button>
            </header>

            {/* Logout Confirmation Modal */}
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
                        Verification sessions are secured. Signing out will terminate your current session.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Button variant="outline" style={{ flex: 1 }} onClick={() => setShowLogoutConfirm(false)}>Cancel</Button>
                        <Button variant="primary" style={{ flex: 1, backgroundColor: 'var(--error)' }} onClick={handleLogout}>Log Out</Button>
                    </div>
                </div>
            </Modal>

            <main style={{ padding: '1.5rem', maxWidth: '600px', margin: '0 auto' }}>
                {isScanning && (
                    <div className="fade-in">
                        <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Scan Product QR</h2>
                        <Card style={{ padding: '0', overflow: 'hidden', border: '4px solid var(--primary)' }}>
                            <div id="reader" style={{ width: '100%' }}></div>
                            <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--primary)', color: 'white' }}>
                                <Scan size={32} style={{ marginBottom: '0.5rem' }} />
                                <p style={{ fontSize: '0.875rem' }}>Position the QR code within the frame</p>
                            </div>
                        </Card>
                    </div>
                )}

                {loading && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
                        <Loader2 size={48} className="animate-spin" color="var(--accent)" />
                        <p style={{ marginTop: '1rem', fontWeight: 600 }}>Authenticating Token...</p>
                    </div>
                )}

                {scanResult && !loading && (
                    <div className="fade-in">
                        <div className={`result-panel ${scanResult.status === 'valid' ? 'result-valid' :
                            scanResult.status === 'used' ? 'result-used' : 'result-invalid'
                            }`}>
                            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                                {scanResult.status === 'valid' && <CheckCircle2 size={64} color="var(--success)" />}
                                {scanResult.status === 'used' && <AlertTriangle size={64} color="var(--warning)" />}
                                {scanResult.status === 'invalid' && <XCircle size={64} color="var(--error)" />}
                            </div>

                            <h2 style={{
                                fontSize: '2rem',
                                marginBottom: '0.5rem',
                                color: scanResult.status === 'valid' ? 'var(--success)' :
                                    scanResult.status === 'used' ? 'var(--warning)' : 'var(--error)'
                            }}>
                                {scanResult.status === 'valid' ? 'Authentic Product' :
                                    scanResult.status === 'used' ? 'Already Scanned' : 'Invalid / Tampered'}
                            </h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                                {scanResult.status === 'valid' ? 'This product is verified as genuine and has not been scanned before.' :
                                    scanResult.status === 'used' ? 'Warning: This QR code was previously verified. It may be a duplicate.' :
                                        'Alert: This token does not exist in our secure registry or has been corrupted.'}
                            </p>

                            {scanResult.product && (
                                <div style={{ textAlign: 'left', backgroundColor: 'white', padding: '1.5rem', borderRadius: ' var(--radius-lg)', marginBottom: '2rem', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <Package size={20} color="var(--text-muted)" />
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Product Name</div>
                                            <div style={{ fontWeight: 600 }}>{scanResult.product.name}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <Building2 size={20} color="var(--text-muted)" />
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU / Batch</div>
                                            <div style={{ fontWeight: 600 }}>{scanResult.product.sku}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <Clock size={20} color="var(--text-muted)" />
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scan Timestamp</div>
                                            <div style={{ fontWeight: 600 }}>{new Date().toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <Button className="btn-primary" style={{ width: '100%' }} onClick={resetScanner}>
                                Next Scan
                            </Button>
                        </div>
                    </div>
                )}

                {!scanResult && !loading && (
                    <div style={{ marginTop: '2rem' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <History size={18} /> Recent Scans
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {recentScans.map(scan => (
                                <Card key={scan.id} style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{scan.products?.name || 'Unknown Token'}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(scan.created_at).toLocaleTimeString()}</div>
                                        </div>
                                        <Badge type={scan.status === 'valid' ? 'success' : scan.status === 'used' ? 'warning' : 'error'}>
                                            {scan.status}
                                        </Badge>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default VerifierDashboard;
