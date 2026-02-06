
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ScrollArea } from '../components/ScrollArea';
import { Badge, Button, Modal, useToast } from '../components/UI';
import { ExternalLink, Building2, Copy, Download } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

const VendorProducts = () => {
    const { addToast } = useToast();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedQR, setSelectedQR] = useState(null);
    const [selectedProductDetails, setSelectedProductDetails] = useState(null);
    const [vendorName, setVendorName] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            // Fetch Vendor Name
            const { data: vInfo } = await supabase.from('vendors').select('company_name').eq('id', user.id).single();
            if (vInfo) setVendorName(vInfo.company_name);

            // Fetch ALL products
            const { data: productsData, error } = await supabase
                .from('products')
                .select('*')
                .eq('vendor_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching products:', error);
                addToast('Failed to load products', 'error');
            } else {
                setProducts(productsData || []);
            }
        }
        setLoading(false);
    };

    return (
        <div className="fade-in" style={{ height: '75vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>All Products</h3>
                <Badge>{products.length} Records</Badge>
            </div>

            <div style={{ flex: 1, minHeight: 0, background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <ScrollArea style={{ height: '100%' }} maxHeight="100%">
                    <div className="table-container" style={{ border: 'none', margin: 0 }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Product Name</th>
                                    <th>Serial Number</th>
                                    <th>Description</th>
                                    <th>Created At</th>
                                    <th>Status</th>
                                    <th>Actions</th>
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
                                                    fontWeight: 'bold',
                                                    color: 'var(--foreground)',
                                                    cursor: 'pointer',
                                                    textAlign: 'left'
                                                }}
                                            >
                                                {product.name}
                                            </button>
                                        </td>
                                        <td style={{ fontFamily: 'monospace' }}>{product.serial_number}</td>
                                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                                            {product.description || '-'}
                                        </td>
                                        <td style={{ color: 'var(--text-muted)' }}>
                                            {new Date(product.created_at).toLocaleDateString()}
                                        </td>
                                        <td><Badge type="success">Active</Badge></td>
                                        <td>
                                            <Button
                                                variant="outline"
                                                style={{ padding: '0.4rem', border: 'none', color: 'var(--accent)' }}
                                                onClick={() => setSelectedQR(product)}
                                            >
                                                <ExternalLink size={16} style={{ marginRight: '0.5rem' }} /> View QR
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {products.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                            No products found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </ScrollArea>
            </div>

            {/* QR Preview Modal - Reused */}
            <Modal isOpen={!!selectedQR} onClose={() => setSelectedQR(null)} title="Product QR Code">
                {selectedQR && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'inline-block', marginBottom: '1.5rem' }}>
                            <QRCodeCanvas
                                id="product-qr-canvas-full"
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
                                const canvas = document.getElementById('product-qr-canvas-full');
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

            {/* Product Details Modal - Reused */}
            <Modal isOpen={!!selectedProductDetails} onClose={() => setSelectedProductDetails(null)} title="Product Information" contentStyle={{ boxShadow: 'none' }}>
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

export default VendorProducts;
