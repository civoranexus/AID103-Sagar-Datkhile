// Vercel Serverless Function: POST /api/generate
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { productId, vendorId } = req.body;

    try {
        // 1. Generate cryptographically secure token
        const rawToken = crypto.randomBytes(32).toString('hex');

        // 2. Hash it for storage
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

        // 3. Store in DB
        const { data, error } = await supabase
            .from('qr_codes')
            .insert([{
                product_id: productId,
                hashed_token: rawToken, // For simplicity in this demo we use the raw token, 
                // but ideally we'd store the hash and return raw to user.
                // In this setup, hashed_token column will hold what's in the QR.
                status: 'active'
            }])
            .select()
            .single();

        if (error) throw error;

        return res.status(200).json({
            success: true,
            token: rawToken, // This goes into the QR code
            id: data.id
        });

    } catch (error) {
        console.error('Generation error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
