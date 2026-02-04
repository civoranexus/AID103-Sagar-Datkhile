import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import QRCode from 'qrcode';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { product_id, vendor_id } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization required' });
    }

    try {
        // Verify user and role
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({ error: 'Invalid session' });
        }

        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!userData || !['vendor', 'admin'].includes(userData.role)) {
            return res.status(403).json({ error: 'Unauthorized: Vendor or Admin access required' });
        }

        if (!product_id || !vendor_id) {
            return res.status(400).json({ error: 'product_id and vendor_id are required' });
        }

        // 1. Generate a cryptographically secure random UUID token
        const rawToken = crypto.randomUUID();

        // 2. Hash the raw token using SHA-256
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

        // 3. Insert the hashed token into the qr_codes table
        const { error: dbError } = await supabase
            .from('qr_codes')
            .insert([{
                product_id,
                vendor_id,
                hashed_token: hashedToken,
                status: 'active'
            }]);

        if (dbError) {
            console.error('Database insertion error:', dbError);
            return res.status(500).json({ error: 'Failed to record QR code' });
        }

        // 4. Generate a QR code image from the raw (unhashed) token
        const qrImage = await QRCode.toDataURL(rawToken, {
            errorCorrectionLevel: 'H',
            margin: 2,
            width: 400
        });

        // 5. Return the QR image as a base64 data URL
        return res.status(200).json({
            success: true,
            qrImage: qrImage,
            message: 'QR code generated successfully'
        });

    } catch (error) {
        console.error('QR Generation error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
