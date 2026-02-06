
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Routes, Route } from 'react-router-dom';
import {
    LayoutDashboard,
    Plus,
    QrCode,
    History,
    CheckCircle2,
    AlertCircle,
    Copy,
    Download,
    ExternalLink,
    Building2
} from 'lucide-react';
import { DashboardLayout, Button, Card, Badge, Modal, useToast } from '../components/UI';
import { ScrollArea } from '../components/ScrollArea';
import { QRCodeCanvas } from 'qrcode.react';

// Import sub-pages
// Note: Ensure VendorProducts.jsx and VendorHistory.jsx extend strict layout/styling if needed
import VendorProducts from './VendorProducts';
import VendorHistory from './VendorHistory';

const VendorDashboard = () => {
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Shared Stats Data
    const [stats, setStats] = useState({
        totalProducts: 0,
        activeVerifications: 0,
        securityAlerts: 0
    });

    const [newProduct, setNewProduct] = useState({ name: '', sku: '', description: '' });
    const [selectedQR, setSelectedQR] = useState(null);
    const [createdProduct, setCreatedProduct] = useState(null); // To trigger stats refresh

    useEffect(() => {
        fetchStats();
    }, [createdProduct]); // Refresh stats when a new product is created

    const fetchStats = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            // Get counts
            const { count: productsCount } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('vendor_id', user.id);

            const { count: historyCount } = await supabase
                .from('audit_logs')
                .select('*', { count: 'exact', head: true })
                .eq('vendor_id', user.id);

            const { count: alertsCount } = await supabase
                .from('audit_logs')
                .select('*', { count: 'exact', head: true })
                .eq('vendor_id', user.id)
                .eq('status', 'invalid'); // Assuming 'invalid' means alert/fail

            setStats({
                totalProducts: productsCount || 0,
                activeVerifications: historyCount || 0,
                securityAlerts: alertsCount || 0
            });
        }
    };

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            const apiResponse = await fetch('/api/vendor/qr/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    product_name: newProduct.name,
                    serial_number: newProduct.sku,
                    description: newProduct.description,
                    vendor_id: session?.user?.id
                })
            });

            if (!apiResponse.ok) {
                const errorText = await apiResponse.text();
                throw new Error(errorText || `Server error: ${apiResponse.status}`);
            }

            const qrData = await apiResponse.json();

            if (qrData.success) {
                setCreatedProduct(Date.now()); // Trigger updates
                setIsModalOpen(false);
                setNewProduct({ name: '', sku: '', description: '' });
                addToast('Product registered and secure QR generated!', 'success');

                setSelectedQR({
                    name: newProduct.name,
                    serial_number: newProduct.sku,
                    qrImage: qrData.qr_image
                });
            } else {
                throw new Error(qrData.error || qrData.message || 'Failed to generate QR');
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
            <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Header & Stats - "The Image Part" */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div>
                            <h1 className="font-display" style={{ fontSize: '1.75rem' }}>Vendor Dashboard</h1>
                            <p style={{ color: 'var(--text-muted)' }}>Manage your product authenticity and QR tokens</p>
                        </div>
                        <Button onClick={() => setIsModalOpen(true)} className="btn-primary">
                            <Plus size={18} /> Generate New QR
                        </Button>
                    </div>

                    <div className="grid grid-cols-3" style={{ marginBottom: '2.5rem' }}>
                        <Card style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Total Products</p>
                                    <h3 style={{ fontSize: '1.5rem' }}>{stats.totalProducts}</h3>
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
                                    <h3 style={{ fontSize: '1.5rem' }}>{stats.activeVerifications}</h3>
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
                                    <h3 style={{ fontSize: '1.5rem' }}>{stats.securityAlerts}</h3>
                                </div>
                                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: ' var(--radius-md)', color: 'var(--error)' }}>
                                    <AlertCircle size={20} />
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Main Content Area */}
                <Routes>
                    <Route index element={<VendorOverview createdProductSignal={createdProduct} />} />
                    <Route path="products" element={<VendorProducts />} />
                    <Route path="history" element={<VendorHistory />} />
                </Routes>
            </div>

            {/* Create Product Modal - Global */}
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

            {/* QR Preview Modal - Global (for newly created) */}
            <Modal isOpen={!!selectedQR} onClose={() => setSelectedQR(null)} title="Product QR Code">
                {selectedQR && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'inline-block', marginBottom: '1.5rem' }}>
                            <QRCodeCanvas
                                id="new-product-qr-canvas"
                                value={selectedQR.serial_number || selectedQR.sku || ''}
                                size={200}
                                level="H"
                                includeMargin={true}
                            />
                        </div>
                        <h3 style={{ marginBottom: '0.5rem' }}>{selectedQR.name}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                            Serial: <code>{selectedQR.serial_number || selectedQR.sku}</code>
                        </p>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Button variant="outline" style={{ flex: 1 }} onClick={() => {
                                const canvas = document.getElementById('new-product-qr-canvas');
                                if (canvas) {
                                    const link = document.createElement('a');
                                    link.href = canvas.toDataURL('image/png');
                                    link.download = `QR-${selectedQR.serial_number || selectedQR.sku}.png`;
                                    link.click();
                                    addToast('QR Code downloaded successfully', 'success');
                                }
                            }}>
                                <Download size={18} /> Download
                            </Button>
                            <Button className="btn-accent" style={{ flex: 1 }} onClick={() => {
                                navigator.clipboard.writeText(selectedQR.serial_number || selectedQR.sku);
                                addToast('Serial number copied to clipboard', 'success');
                            }}>
                                <Copy size={18} /> Copy Serial
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </DashboardLayout>
    );
};

// Internal Component: Overview (Recent Items)
const VendorOverview = ({ createdProductSignal }) => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [history, setHistory] = useState([]);
    const [vendorName, setVendorName] = useState('');
    const [selectedProductDetails, setSelectedProductDetails] = useState(null);
    const [selectedQR, setSelectedQR] = useState(null);
    const { addToast } = useToast();

    useEffect(() => {
        const fetchOverviewData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: vInfo } = await supabase.from('vendors').select('company_name').eq('id', user.id).single();
                if (vInfo) setVendorName(vInfo.company_name);

                // Fetch 5 most recent
                const { data: pData } = await supabase.from('products').select('*').eq('vendor_id', user.id).order('created_at', { ascending: false }).limit(5);
                const { data: hData } = await supabase.from('audit_logs').select('*, products(name, serial_number)').eq('vendor_id', user.id).order('created_at', { ascending: false }).limit(5);

                setProducts(pData || []);
                setHistory(hData || []);
            }
        };
        fetchOverviewData();
    }, [createdProductSignal]);

    return (
        <div className="grid grid-cols-2" style={{ flex: 1, minHeight: 0, gap: '1.5rem' }}>
            {/* Recent Products */}
            <Card title="Recent Products" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ flex: 1, minHeight: 0 }}>
                    <ScrollArea maxHeight="400px">
                        <div className="table-container" style={{ border: 'none' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Description</th>
                                        <th>Status</th>
                                        <th>QR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map(product => (
                                        <tr key={product.id}>
                                            <td>
                                                <button
                                                    onClick={() => setSelectedProductDetails(product)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        padding: 0,
                                                        fontWeight: 600,
                                                        color: 'var(--foreground)',
                                                        cursor: 'pointer',
                                                        textAlign: 'left'
                                                    }}
                                                >
                                                    {product.name}
                                                </button>
                                            </td>
                                            <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                                {product.description || 'No description'}
                                            </td>
                                            <td><Badge type="success">Active</Badge></td>
                                            <td>
                                                <Button
                                                    variant="outline"
                                                    style={{ padding: '0.4rem', border: 'none', color: 'var(--accent)' }}
                                                    onClick={() => setSelectedQR(product)}
                                                >
                                                    <ExternalLink size={16} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {products.length === 0 && (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No products created yet</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </ScrollArea>
                </div>
                {/* View All Button - Changed path to match Routes */}
                <Button variant="outline" style={{ width: '100%', marginTop: '1rem' }} onClick={() => navigate('/VendorDashboard/products')}>View All Products</Button>
            </Card>

            {/* Scan Activity */}
            <Card title="Recent Scan History" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ flex: 1, minHeight: 0 }}>
                    <ScrollArea maxHeight="400px">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {history.map(log => (
                                <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        backgroundColor: log.status === 'valid' ? 'rgba(16, 185, 129, 0.1)' :
                                            log.status === 'used' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: log.status === 'valid' ? 'var(--success)' :
                                            log.status === 'used' ? 'var(--warning)' : 'var(--error)'
                                    }}>
                                        {log.status === 'valid' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{log.products?.name || 'Unknown Product'}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.location || 'Unknown Location'} • {new Date(log.created_at).toLocaleTimeString()}</div>
                                    </div>
                                    <Badge type={log.status === 'valid' ? 'success' : log.status === 'used' ? 'warning' : 'error'}>{log.status}</Badge>
                                </div>
                            ))}
                            {history.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No scans recorded yet</div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
                {/* View All Button - Changed path to match Routes */}
                <Button variant="outline" style={{ width: '100%', marginTop: '1rem' }} onClick={() => navigate('/VendorDashboard/history')}>View All History</Button>
            </Card>

            {/* Existing Modal logic for viewing existing product details/QR in overview */}
            <Modal isOpen={!!selectedQR} onClose={() => setSelectedQR(null)} title="Product QR Code">
                {selectedQR && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'inline-block', marginBottom: '1.5rem' }}>
                            <QRCodeCanvas
                                id="overview-qr-canvas"
                                value={selectedQR.serial_number || selectedQR.sku || ''}
                                size={200}
                                level="H"
                                includeMargin={true}
                            />
                        </div>
                        <h3 style={{ marginBottom: '0.5rem' }}>{selectedQR.name}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                            Serial: <code>{selectedQR.serial_number || selectedQR.sku}</code>
                        </p>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Button variant="outline" style={{ flex: 1 }} onClick={() => {
                                const canvas = document.getElementById('overview-qr-canvas');
                                if (canvas) {
                                    const link = document.createElement('a');
                                    link.href = canvas.toDataURL('image/png');
                                    link.download = `QR-${selectedQR.serial_number || selectedQR.sku}.png`;
                                    link.click();
                                    addToast('QR Code downloaded successfully', 'success');
                                }
                            }}>
                                <Download size={18} /> Download
                            </Button>
                            <Button className="btn-accent" style={{ flex: 1 }} onClick={() => {
                                navigator.clipboard.writeText(selectedQR.serial_number || selectedQR.sku);
                                addToast('Serial number copied to clipboard', 'success');
                            }}>
                                <Copy size={18} /> Copy Serial
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
            <Modal isOpen={!!selectedProductDetails} onClose={() => setSelectedProductDetails(null)} title="Product Information">
                {selectedProductDetails && (
                    <div className="fade-in">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.25rem' }}>Product Name</label>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{selectedProductDetails.name}</div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.25rem' }}>Vendor / Manufacturer</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Building2 size={16} color="var(--accent)" />
                                    <div style={{ fontWeight: 500 }}>{vendorName || 'Authentic Vendor'}</div>
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.25rem' }}>Secure Serial Number</label>
                                <div style={{ background: 'var(--background)', padding: '0.75rem', borderRadius: ' var(--radius-md)', fontFamily: 'monospace', fontSize: '1rem', border: '1px solid var(--border)', display: 'inline-block' }}>
                                    {selectedProductDetails.serial_number}
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.25rem' }}>Product Description</label>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text)', lineHeight: '1.5', background: 'rgba(59, 130, 246, 0.03)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                                    {selectedProductDetails.description || 'No detailed description provided for this product record.'}
                                </div>
                            </div>

                            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                                <Button className="btn-primary" style={{ width: '100%' }} onClick={() => setSelectedProductDetails(null)}>
                                    Close Details
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default VendorDashboard;
