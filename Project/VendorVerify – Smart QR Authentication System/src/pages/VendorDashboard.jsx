import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { Card, Button, Input } from '../components/UI';
import { Plus, Download, Filter, Search, MoreHorizontal, CheckCircle, Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function VendorDashboard() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [vendorData, setVendorData] = useState(null);

    // New product form
    const [newProduct, setNewProduct] = useState({ name: '', batchId: '', description: '' });

    useEffect(() => {
        fetchVendorAndProducts();
    }, []);

    const fetchVendorAndProducts = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { data: vendor, error: vError } = await supabase
                .from('vendors')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (vError) throw vError;
            setVendorData(vendor);

            const { data: products, error: pError } = await supabase
                .from('products')
                .select(`
          *,
          qr_codes (id, hashed_token, status)
        `)
                .eq('vendor_id', vendor.id)
                .order('created_at', { ascending: false });

            if (pError) throw pError;
            setProducts(products);
        } catch (err) {
            console.error('Error:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            // 1. Create Product
            const { data: product, error: pError } = await supabase
                .from('products')
                .insert([{
                    vendor_id: vendorData.id,
                    name: newProduct.name,
                    batch_id: newProduct.batchId,
                    description: newProduct.description
                }])
                .select()
                .single();

            if (pError) throw pError;

            // 2. Generate secure token & QR record
            const secureToken = crypto.randomUUID() + '-' + Date.now();
            // For simplicity in this demo, we store the token as is, but in a real app, 
            // we'd hash it and only store the hash. The QR would contain the original token.
            // The backend would then hash the scanned token to verify.

            const { error: qrError } = await supabase
                .from('qr_codes')
                .insert([{
                    product_id: product.id,
                    hashed_token: secureToken, // In real app, hash(secureToken)
                    status: 'active'
                }]);

            if (qrError) throw qrError;

            setShowAddModal(false);
            setNewProduct({ name: '', batchId: '', description: '' });
            fetchVendorAndProducts();
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <DashboardLayout role="vendor" title="Vendor Management">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <StatCard title="Total Products" value={products.length} icon={<Box size={24} />} color="var(--accent)" />
                <StatCard title="Active QRs" value={products.filter(p => p.qr_codes?.[0]?.status === 'active').length} icon={<CheckCircle size={24} />} color="var(--success)" />
                <StatCard title="Pending Batches" value="0" icon={<Clock size={24} />} color="var(--warning)" />
                <StatCard title="Security Alerts" value="0" icon={<Filter size={24} />} color="var(--danger)" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem' }}>Products & Batches</h2>
                <Button onClick={() => setShowAddModal(true)}><Plus size={18} /> Add New Batch</Button>
            </div>

            <Card padding="0">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: '#fafafa' }}>
                            <th style={{ padding: '1rem 1.5rem', fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-muted)' }}>PRODUCT NAME</th>
                            <th style={{ padding: '1rem 1.5rem', fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-muted)' }}>BATCH ID</th>
                            <th style={{ padding: '1rem 1.5rem', fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-muted)' }}>QR STATUS</th>
                            <th style={{ padding: '1rem 1.5rem', fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-muted)' }}>CREATED</th>
                            <th style={{ padding: '1rem 1.5rem', fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                <td style={{ padding: '1.25rem 1.5rem', fontWeight: '500' }}>{product.name}</td>
                                <td style={{ padding: '1.25rem 1.5rem' }}><code>{product.batch_id}</code></td>
                                <td style={{ padding: '1.25rem 1.5rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        backgroundColor: product.qr_codes?.[0]?.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                        color: product.qr_codes?.[0]?.status === 'active' ? 'var(--success)' : 'var(--warning)'
                                    }}>
                                        {product.qr_codes?.[0]?.status || 'N/A'}
                                    </span>
                                </td>
                                <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    {new Date(product.created_at).toLocaleDateString()}
                                </td>
                                <td style={{ padding: '1.25rem 1.5rem' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <Button variant="outline" style={{ padding: '0.4rem' }} title="Download QR">
                                            <Download size={16} />
                                        </Button>
                                        <Button variant="outline" style={{ padding: '0.4rem' }}>
                                            <MoreHorizontal size={16} />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            {showAddModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <Card style={{ width: '100%', maxWidth: '500px' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Register New Batch</h2>
                        <form onSubmit={handleAddProduct}>
                            <Input label="Product Name" placeholder="e.g. Organic Green Tea" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} required />
                            <Input label="Batch Number" placeholder="e.g. BATCH-2024-001" value={newProduct.batchId} onChange={e => setNewProduct({ ...newProduct, batchId: e.target.value })} required />
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Description</label>
                                <textarea
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', minHeight: '100px' }}
                                    value={newProduct.description}
                                    onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
                                <Button type="submit">Generate & Save</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </DashboardLayout>
    );
}

function StatCard({ title, value, icon, color }) {
    return (
        <Card padding="1.5rem">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '500' }}>{title}</p>
                    <h3 style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>{value}</h3>
                </div>
                <div style={{ padding: '0.5rem', backgroundColor: `${color}15`, color: color, borderRadius: '12px' }}>
                    {icon}
                </div>
            </div>
        </Card>
    );
}
