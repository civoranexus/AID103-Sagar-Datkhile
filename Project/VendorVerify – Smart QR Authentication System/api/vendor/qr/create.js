import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import QRCode from 'qrcode';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { product_name, serial_number, description, vendor_id } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization required' });
    }

    try {
        // 1. Validate vendor authentication and role
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({ error: 'Invalid session' });
        }

        // Check if user is the vendor or admin
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!userData || !['vendor', 'admin'].includes(userData.role)) {
            return res.status(403).json({ error: 'Unauthorized: Vendor or Admin access required' });
        }

        // 2. Insert a new row into the products table
        const { data: product, error: productError } = await supabase
            .from('products')
            .insert([{
                name: product_name,
                serial_number: serial_number,
                description: description,
                vendor_id: vendor_id
            }])
            .select()
            .single();

        if (productError) {
            console.error('Product insertion error:', productError);
            return res.status(500).json({ error: 'Failed to create product. Serial number might be duplicate.' });
        }

        // 3. Generate a SHA-256 hash of the serial_number
        const hashedToken = crypto.createHash('sha256').update(serial_number).digest('hex');

        // 4. Insert a new row into the qr_codes table
        const { error: qrError } = await supabase
            .from('qr_codes')
            .insert([{
                hashed_token: hashedToken,
                product_id: product.id,
                vendor_id: vendor_id,
                status: 'active'
            }]);

        if (qrError) {
            console.error('QR insertion error:', qrError);
            // Cleanup product if QR fails? For now just error out
            return res.status(500).json({ error: 'Failed to record QR code' });
        }

        // 5. Generate a QR code image using the RAW serial number
        const qrImage = await QRCode.toDataURL(serial_number, {
            errorCorrectionLevel: 'H',
            margin: 2,
            width: 400
        });

        // 6. Return the QR image
        return res.status(200).json({
            success: true,
            qr_image: qrImage,
            message: 'Product and QR code created successfully'
        });

    } catch (error) {
        console.error('QR Creation error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
