import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '../lib/supabase';
import {
    ShieldCheck,
    Scan,
    LogOut,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Loader2,
    Package,
    Building2,
    Clock,
    History,
    Activity,
    User,
    ChevronRight
} from 'lucide-react';
import { Button, Card, Badge, Modal, useToast, DashboardLayout } from '../components/UI';
import { useNavigate } from 'react-router-dom';

const VerifierDashboard = () => {
    const { addToast } = useToast();
    const navigate = useNavigate();
    const scannerRef = useRef(null);

    // UI State
    const [scanResult, setScanResult] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [loading, setLoading] = useState(false);
    const [recentScans, setRecentScans] = useState([]);
    const [stats, setStats] = useState({ total: 0, valid: 0, failed: 0 });
    const [verifierName, setVerifierName] = useState('');

    useEffect(() => {
        fetchInitialData();
        return () => stopScanner();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch Verifier Name from users table
            const { data: profile } = await supabase
                .from('users')
                .select('full_name')
                .eq('id', user.id)
                .single();

            if (profile) setVerifierName(profile.full_name);

            await Promise.all([
                fetchStats(user.id),
                fetchRecentScans(user.id)
            ]);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async (userId) => {
        const { data: logs } = await supabase
            .from('audit_logs')
            .select('result')
            .eq('verifier_id', userId);

        if (logs) {
            const statsObj = {
                total: logs.length,
                valid: logs.filter(l => l.result === 'valid').length,
                failed: logs.filter(l => l.result !== 'valid').length
            };
            setStats(statsObj);
        }
    };

    const fetchRecentScans = async (userId) => {
        const { data } = await supabase
            .from('audit_logs')
            .select(`
                *,
                qr_codes (
                    products (name)
                ),
                vendors (company_name)
            `)
            .eq('verifier_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        setRecentScans(data || []);
    };

    const startScanner = async () => {
        setIsScanning(true);
        setScanResult(null);

        // Wait for DOM element to be ready
        setTimeout(async () => {
            try {
                const html5QrCode = new Html5Qrcode("reader");
                scannerRef.current = html5QrCode;

                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                };

                // Use only back camera by default (facingMode: environment)
                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    onScanSuccess
                );
            } catch (err) {
                console.error("Scanner start failed:", err);
                addToast("Could not access camera", "error");
                setIsScanning(false);
            }
        }, 100);
    };

    const stopScanner = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            await scannerRef.current.stop();
            scannerRef.current.clear();
        }
        setIsScanning(false);
    };

    const onScanSuccess = async (decodedText) => {
        await stopScanner();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Call the secure backend verification API
            const response = await fetch('/api/verifier/qr/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    scanned_serial_number: decodedText,
                    verifier_id: user?.id
                })
            });

            const result = await response.json();

            if (result.status === 'valid') {
                setScanResult({
                    status: 'valid',
                    product: {
                        name: result.product_name,
                        vendors: { company_name: result.vendor_name }
                    },
                    timestamp: new Date().toISOString()
                });
                addToast('Product Authenticated!', 'success');
            } else {
                setScanResult({
                    status: result.status || 'invalid',
                    timestamp: new Date().toISOString(),
                    message: result.message
                });
                addToast(result.status === 'used' ? 'Warning: Already Scanned' : 'Alert: Invalid QR',
                    result.status === 'used' ? 'warning' : 'error');
            }

            if (user) await fetchInitialData(user.id);
        } catch (error) {
            console.error('Verification error:', error);
            addToast('Verification process failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const navItems = [
        { label: 'Dashboard', path: '/VerifierDashboard', icon: Activity },
        { label: 'Scan History', path: '/VerifierDashboard/history', icon: History },
    ];

    return (
        <DashboardLayout role="Verifier" navItems={navItems}>
            <div className="fade-in" style={{ paddingBottom: '3rem' }}>
                {/* Header Section */}
                <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 className="font-display" style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>
                            Verifier Dashboard
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                            Secure verification environment for {verifierName}
                        </p>
                    </div>
                    <Button
                        onClick={isScanning ? stopScanner : startScanner}
                        className={isScanning ? "btn-outline" : "btn-primary"}
                        style={{ height: '3.5rem', padding: '0 2rem', fontSize: '1rem', borderRadius: '14px' }}
                    >
                        {isScanning ? <XCircle size={20} /> : <Scan size={20} />}
                        {isScanning ? "Cancel Scanning" : "Start New Scan"}
                    </Button>
                </div>

                {/* Stats Cards Grid */}
                <div className="grid grid-cols-3" style={{ marginBottom: '2.5rem' }}>
                    <Card style={{ padding: '1.5rem', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem', borderRadius: '12px', color: 'var(--accent)' }}>
                                <Activity size={24} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Scans</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.total}</div>
                            </div>
                        </div>
                    </Card>
                    <Card style={{ padding: '1.5rem', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '12px', color: 'var(--success)' }}>
                                <CheckCircle2 size={24} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Valid Products</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{stats.valid}</div>
                            </div>
                        </div>
                    </Card>
                    <Card style={{ padding: '1.5rem', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '12px', color: 'var(--error)' }}>
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Invalid / Used</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--error)' }}>{stats.failed}</div>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '2rem' }}>
                    {/* Main Content Area: Scan History Table */}
                    <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
                        <Card title="Recent Verification Registry" style={{ padding: 0, overflow: 'hidden' }}>
                            <div className="table-container" style={{ border: 'none' }}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Product Name</th>
                                            <th>Vendor</th>
                                            <th>Status</th>
                                            <th>Scanned At</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentScans.map(scan => (
                                            <tr key={scan.id}>
                                                <td style={{ fontWeight: 600 }}>{scan.qr_codes?.products?.name || 'Unknown Item'}</td>
                                                <td>{scan.vendors?.company_name || 'Generic Vendor'}</td>
                                                <td>
                                                    <Badge type={scan.result === 'valid' ? 'success' : scan.result === 'used' ? 'warning' : 'error'}>
                                                        {scan.result}
                                                    </Badge>
                                                </td>
                                                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                                    {new Date(scan.created_at).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                        {recentScans.length === 0 && (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                                    No scan history found for your account.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>

                    {/* Sidebar Area: Last Scan Result & Scanner UI */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Scanner Card */}
                        {isScanning && (
                            <Card style={{ padding: '1rem', border: '2px solid var(--accent)', backgroundColor: 'black' }}>
                                <div id="reader" style={{ width: '100%', borderRadius: '8px', overflow: 'hidden' }}></div>
                                <div style={{ textAlign: 'center', padding: '1rem 0', color: 'white', fontSize: '0.8rem' }}>
                                    <Loader2 size={16} className="animate-spin" style={{ display: 'inline', marginRight: 8 }} />
                                    Active Security Scanning...
                                </div>
                            </Card>
                        )}

                        {/* Recent Product Card */}
                        <Card title="Last Scanned Product" style={{ minHeight: '300px' }}>
                            {loading && !isScanning ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
                                    <Loader2 size={32} className="animate-spin" color="var(--accent)" />
                                    <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>Processing token...</p>
                                </div>
                            ) : scanResult ? (
                                <div className="fade-in">
                                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                        {scanResult.status === 'valid' ?
                                            <div style={{ background: 'var(--success)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: 'white' }}>
                                                <CheckCircle2 size={24} />
                                            </div> :
                                            <div style={{ background: scanResult.status === 'used' ? 'var(--warning)' : 'var(--error)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: 'white' }}>
                                                {scanResult.status === 'used' ? <AlertTriangle size={24} /> : <XCircle size={24} />}
                                            </div>
                                        }
                                        <h3 style={{ marginTop: '1rem', color: scanResult.status === 'valid' ? 'var(--success)' : 'inherit' }}>
                                            {scanResult.status === 'valid' ? 'AUTHENTIC' : scanResult.status.toUpperCase()}
                                        </h3>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div>
                                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product</label>
                                            <div style={{ fontWeight: 600 }}>{scanResult.product?.name || 'Unidentified'}</div>
                                        </div>
                                        {scanResult.product && (
                                            <>
                                                <div>
                                                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Batch ID</label>
                                                    <div style={{ fontSize: '0.875rem' }}>{scanResult.product.batch_id}</div>
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vendor</label>
                                                    <div style={{ fontSize: '0.875rem' }}>{scanResult.product.vendors?.company_name}</div>
                                                </div>
                                            </>
                                        )}
                                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                                <Clock size={12} />
                                                {new Date(scanResult.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', textAlign: 'center' }}>
                                    <Scan size={40} style={{ color: 'var(--border)', marginBottom: '1rem' }} />
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Ready for verification.<br />No active scan data.</p>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default VerifierDashboard;
