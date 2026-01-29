import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { Card, Button } from '../components/UI';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ShieldCheck, ShieldAlert, ShieldQuestion, Camera, History } from 'lucide-react';

export default function VerifierDashboard() {
    const [scanResult, setScanResult] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const scannerRef = useRef(null);

    useEffect(() => {
        fetchHistory();
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
            }
        };
    }, []);

    const fetchHistory = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data, error } = await supabase
                .from('verification_logs')
                .select(`
          *,
          qr_codes (
            product_id,
            products (name, batch_id)
          )
        `)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            setHistory(data);
        } catch (err) {
            console.error(err.message);
        }
    };

    const startScanner = () => {
        setIsScanning(true);
        setScanResult(null);

        setTimeout(() => {
            const scanner = new Html5QrcodeScanner("reader", {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                rememberLastUsedCamera: true
            });

            scanner.render(async (decodedText) => {
                scanner.clear();
                setIsScanning(false);
                verifyToken(decodedText);
            }, (error) => {
                // console.warn(error);
            });

            scannerRef.current = scanner;
        }, 100);
    };

    const verifyToken = async (token) => {
        setLoading(true);
        try {
            // In a real app, we'd call an Edge Function or Node API to hash and verify
            // For this demo, we query directly (matching the simplified logic in VendorDashboard)
            const { data: qr, error: qrError } = await supabase
                .from('qr_codes')
                .select(`
          *,
          products (
            *,
            vendors (company_name)
          )
        `)
                .eq('hashed_token', token)
                .single();

            if (qrError || !qr) {
                setScanResult({ status: 'invalid', message: 'Counterfeit or Invalid QR Code' });
                logVerification(null, 'failure', 'Invalid token detected');
            } else if (qr.status === 'used') {
                setScanResult({ status: 'used', message: 'QR Code already used/expired', data: qr });
                logVerification(qr.id, 'warning', 'Duplicate scan attempt');
            } else {
                setScanResult({ status: 'valid', message: 'Authentic Product Verified', data: qr });
                logVerification(qr.id, 'success', 'Verification successful');

                // Mark as used if it's a one-time verify, or just update status
                // await supabase.from('qr_codes').update({ status: 'used' }).eq('id', qr.id);
            }
        } catch (err) {
            setScanResult({ status: 'error', message: err.message });
        } finally {
            setLoading(false);
            fetchHistory();
        }
    };

    const logVerification = async (qrId, result, details) => {
        try {
            const { error } = await supabase
                .from('verification_logs')
                .insert([{
                    qr_id: qrId,
                    result: result,
                    details: details,
                    ip_address: 'Logged via Web UI'
                }]);
            if (error) console.error("Logging error:", error);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <DashboardLayout role="verifier" title="Product Verification">
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {!isScanning && !scanResult && (
                        <Card style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                            <div style={{ width: '80px', height: '80px', backgroundColor: 'var(--background)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                                <Camera size={40} color="var(--accent)" />
                            </div>
                            <h2 style={{ marginBottom: '1rem' }}>Ready to Scan?</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '300px', margin: '0 auto 2rem' }}>
                                Point your camera at a VendorVerify QR code to instantly verify product authenticity.
                            </p>
                            <Button onClick={startScanner} style={{ padding: '1rem 2.5rem' }}>
                                <Camera size={20} /> Start Scanner
                            </Button>
                        </Card>
                    )}

                    {isScanning && (
                        <Card>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.1rem' }}>Scanning in Progress...</h3>
                                <Button variant="outline" onClick={() => { scannerRef.current?.clear(); setIsScanning(false); }}>Cancel</Button>
                            </div>
                            <div id="reader" style={{ overflow: 'hidden', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}></div>
                        </Card>
                    )}

                    {scanResult && (
                        <VerificationResult result={scanResult} onReset={() => setScanResult(null)} />
                    )}
                </div>

                <div>
                    <Card padding="1.5rem">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <History size={20} color="var(--accent)" />
                            <h3 style={{ fontSize: '1.1rem' }}>Recent Scan Activity</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {history.map(log => (
                                <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        backgroundColor: log.result === 'success' ? 'rgba(16, 185, 129, 0.1)' : log.result === 'failure' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                        color: log.result === 'success' ? 'var(--success)' : log.result === 'failure' ? 'var(--danger)' : 'var(--warning)'
                                    }}>
                                        {log.result === 'success' ? <ShieldCheck size={16} /> : log.result === 'failure' ? <ShieldAlert size={16} /> : <ShieldQuestion size={16} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>{log.qr_codes?.products?.name || 'Unknown Product'}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(log.created_at).toLocaleString()}</p>
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>{log.result}</div>
                                </div>
                            ))}
                            {history.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', py: '2rem' }}>No recent activity</p>}
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}

function VerificationResult({ result, onReset }) {
    const { status, message, data } = result;

    const colors = {
        valid: 'var(--success)',
        invalid: 'var(--danger)',
        used: 'var(--warning)',
        error: 'var(--text-muted)'
    };

    const icons = {
        valid: <ShieldCheck size={64} />,
        invalid: <ShieldAlert size={64} />,
        used: <ShieldQuestion size={64} />,
        error: <ShieldAlert size={64} />
    };

    return (
        <Card style={{ borderTop: `6px solid ${colors[status]}` }}>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{ color: colors[status], marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                    {icons[status]}
                </div>
                <h2 style={{ fontSize: '1.875rem', color: colors[status], marginBottom: '0.5rem' }}>{message}</h2>

                {data && (
                    <div style={{ marginTop: '2.5rem', textAlign: 'left', backgroundColor: 'var(--background)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                        <h4 style={{ marginBottom: '1rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Product Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Product</p>
                                <p style={{ fontWeight: '600' }}>{data.products.name}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Batch ID</p>
                                <p style={{ fontWeight: '600' }}><code>{data.products.batch_id}</code></p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Vendor</p>
                                <p style={{ fontWeight: '600' }}>{data.products.vendors.company_name}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Scan Status</p>
                                <p style={{ fontWeight: '600' }}>{data.status.toUpperCase()}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ marginTop: '2.5rem' }}>
                    <Button onClick={onReset} style={{ width: '100%' }}>Scan Another Product</Button>
                </div>
            </div>
        </Card>
    );
}
