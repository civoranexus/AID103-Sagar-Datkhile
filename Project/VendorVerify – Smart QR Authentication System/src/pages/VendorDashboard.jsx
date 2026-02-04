import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    LayoutDashboard,
    Plus,
    QrCode,
    History,
    ArrowUpRight,
    CheckCircle2,
    AlertCircle,
    Copy,
    Download,
    ExternalLink,
    Clock
} from 'lucide-react';
import { DashboardLayout, Button, Card, Badge, Modal, useToast } from '../components/UI';
import { QRCodeSVG } from 'qrcode.react';

const VendorDashboard = () => {
    const { addToast } = useToast();
    const [products, setProducts] = useState([]);
    const [history, setHistory] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedQR, setSelectedQR] = useState(null);
    const [newProduct, setNewProduct] = useState({ name: '', sku: '', description: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Get the internal vendor record id
        const { data: vendor } = await supabase
            .from('vendors')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (vendor) {
            // Fetch products
            const { data: productsData } = await supabase
                .from('products')
                .select('*')
                .eq('vendor_id', vendor.id)
                .order('created_at', { ascending: false });

            // Fetch scan history for vendor's products
            const { data: historyData } = await supabase
                .from('audit_logs')
                .select('*, products(name, sku)')
                .eq('vendor_id', vendor.id)
                .order('created_at', { ascending: false })
                .limit(10);

            setProducts(productsData || []);
            setHistory(historyData || []);
        }
        setLoading(false);
    };

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // 1. Get vendor profile for current user
            const { data: vendor } = await supabase
                .from('vendors')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!vendor) throw new Error('Vendor profile not found');

            // 2. Create product record
            const { data: product, error: productError } = await supabase
                .from('products')
                .insert([{
                    name: newProduct.name,
                    sku: newProduct.sku,
                    batch_id: newProduct.sku, // Using sku as batch_id for now
                    description: newProduct.description,
                    vendor_id: vendor.id
                }])
                .select()
                .single();

            if (productError) throw productError;

            // 3. Call secure backend API to generate QR
            const { data: { session } } = await supabase.auth.getSession();

            const apiResponse = await fetch('/api/qr/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    product_id: product.id,
                    vendor_id: vendor.id
                })
            });

            const qrData = await apiResponse.json();

            if (qrData.success) {
                // Fetch updated products list
                fetchData();
                setIsModalOpen(false);
                setNewProduct({ name: '', sku: '', description: '' });
                addToast('Product registered and secure QR generated!', 'success');

                // Show the generated QR immediately
                setSelectedQR({
                    ...product,
                    qrImage: qrData.qrImage
                });
            } else {
                throw new Error(qrData.error || 'Failed to generate QR');
            }
        } catch (error) {
            console.error('Operation failed:', error);
            addToast(error.message || 'Failed to create product', 'error');
        }
    };

    const navItems = [
        { label: 'Overview', path: '/VendorDashboard', icon: LayoutDashboard },
        { label: 'Products', path: '/VendorDashboard/products', icon: QrCode },
        { label: 'Scan History', path: '/VendorDashboard/history', icon: History },
    ];

    return (
        <DashboardLayout role="Vendor" navItems={navItems}>
            <div className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 className="font-display" style={{ fontSize: '1.75rem' }}>Vendor Dashboard</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Manage your product authenticity and QR tokens</p>
                    </div>
                    <Button onClick={() => setIsModalOpen(true)} className="btn-primary">
                        <Plus size={18} /> Generate New QR
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3" style={{ marginBottom: '2.5rem' }}>
                    <Card style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Total Products</p>
                                <h3 style={{ fontSize: '1.5rem' }}>{products.length}</h3>
                            </div>
                            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem', borderRadius: ' var(--radius-md)', color: 'var(--accent)' }}>
                                <QrCode size={20} />
                            </div>
                        </div>
                    </Card>
                    <Card style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Active Verifications</p>
                                <h3 style={{ fontSize: '1.5rem' }}>{history.length}</h3>
                            </div>
                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem', borderRadius: ' var(--radius-md)', color: 'var(--success)' }}>
                                <CheckCircle2 size={20} />
                            </div>
                        </div>
                    </Card>
                    <Card style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Security Alerts</p>
                                <h3 style={{ fontSize: '1.5rem' }}>0</h3>
                            </div>
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: ' var(--radius-md)', color: 'var(--error)' }}>
                                <AlertCircle size={20} />
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-2">
                    {/* Recent Products */}
                    <Card title="Recent Products" style={{ padding: '1.5rem' }}>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>SKU</th>
                                        <th>Status</th>
                                        <th>QR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.slice(0, 5).map(product => (
                                        <tr key={product.id}>
                                            <td style={{ fontWeight: 500 }}>{product.name}</td>
                                            <td><code>{product.sku}</code></td>
                                            <td><Badge type="success">Active</Badge></td>
                                            <td>
                                                <Button
                                                    variant="outline"
                                                    style={{ padding: '0.4rem', border: 'none' }}
                                                    onClick={() => setSelectedQR(product)}
                                                >
                                                    <ExternalLink size={16} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {products.length === 0 && (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No products found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Scan Activity */}
                    <Card title="Recent Scan History" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {history.map(log => (
                                <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        backgroundColor: log.status === 'valid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: log.status === 'valid' ? 'var(--success)' : 'var(--error)'
                                    }}>
                                        {log.status === 'valid' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{log.products?.name || 'Unknown Product'}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.location || 'Unknown Location'} • {new Date(log.created_at).toLocaleTimeString()}</div>
                                    </div>
                                    <Badge type={log.status === 'valid' ? 'success' : 'error'}>{log.status}</Badge>
                                </div>
                            ))}
                            {history.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No scan activity yet</div>
                            )}
                        </div>
                        <Button variant="outline" style={{ width: '100%', marginTop: '1rem' }}>View All History</Button>
                    </Card>
                </div>
            </div>

            {/* Create Product Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Generate New Secure QR">
                <form onSubmit={handleCreateProduct}>
                    <div className="input-group">
                        <label className="input-label">Product Name</label>
                        <input
                            className="input-field"
                            placeholder="e.g. Organic Cotton T-Shirt"
                            required
                            value={newProduct.name}
                            onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">SKU / Serial Number</label>
                        <input
                            className="input-field"
                            placeholder="PROD-2024-XXXX"
                            required
                            value={newProduct.sku}
                            onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Description (Optional)</label>
                        <textarea
                            className="input-field"
                            rows="3"
                            style={{ resize: 'none' }}
                            value={newProduct.description}
                            onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                        ></textarea>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <Button variant="outline" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button style={{ flex: 1 }} className="btn-primary" type="submit">Generate QR Code</Button>
                    </div>
                </form>
            </Modal>

            {/* QR Preview Modal */}
            <Modal isOpen={!!selectedQR} onClose={() => setSelectedQR(null)} title="Product QR Code">
                {selectedQR && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ background: 'white', padding: '2rem', borderRadius: ' var(--radius-lg)', border: '1px solid var(--border)', display: 'inline-block', marginBottom: '1.5rem' }}>
                            {selectedQR.qrImage ? (
                                <img src={selectedQR.qrImage} alt="Product QR" style={{ width: 200, height: 200 }} />
                            ) : (
                                <div style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                    QR Not Available for Re-view
                                </div>
                            )}
                        </div>
                        <h3 style={{ marginBottom: '0.5rem' }}>{selectedQR.name}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>SKU: {selectedQR.sku}</p>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {selectedQR.qrImage && (
                                <Button variant="outline" style={{ flex: 1 }} onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = selectedQR.qrImage;
                                    link.download = `QR-${selectedQR.sku}.png`;
                                    link.click();
                                }}>
                                    <Download size={18} /> Download
                                </Button>
                            )}
                            <Button className="btn-accent" style={{ flex: 1 }} onClick={() => {
                                if (selectedQR.qrImage) {
                                    addToast('Image available in download', 'success');
                                } else {
                                    addToast('Reference: ' + selectedQR.id, 'info');
                                }
                            }}>
                                <Copy size={18} /> Copy Info
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </DashboardLayout>
    );
};

export default VendorDashboard;
