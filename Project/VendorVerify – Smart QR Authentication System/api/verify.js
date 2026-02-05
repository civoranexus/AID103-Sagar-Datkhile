// Vercel Serverless Function: POST /api/verify
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for backend logic
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { token, metadata } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }

    try {
        // 1. Hash the incoming token to match our secure storage
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // 2. Query the QR code
        const { data: qr, error: qrError } = await supabase
            .from('qr_codes')
            .select(`
        *,
        products (
          *,
          vendors (company_name)
        )
      `)
            .eq('hashed_token', hashedToken)
            .single();

        if (qrError || !qr) {
            await logAttempt(null, null, 'failure', 'Invalid token detected', metadata);
            return res.status(404).json({ status: 'invalid', message: 'Counterfeit or Invalid QR Code' });
        }

        if (qr.status === 'used') {
            await logAttempt(qr.id, qr.vendor_id, 'warning', 'Duplicate scan attempt', metadata);
            return res.status(200).json({ status: 'used', message: 'QR Code already used/expired', data: qr });
        }

        // 3. Log success and return data
        await logAttempt(qr.id, qr.vendor_id, 'success', 'Verification successful', metadata);

        // Update status to 'used'
        await supabase.from('qr_codes').update({ status: 'used' }).eq('id', qr.id);

        return res.status(200).json({
            status: 'valid',
            message: 'Authentic Product Verified',
            data: qr
        });

    } catch (error) {
        console.error('Verification error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

async function logAttempt(qrId, vendorId, result, details, metadata = {}) {
    await supabase.from('audit_logs').insert([{
        qr_id: qrId,
        vendor_id: vendorId,
        result: result,
        details: details,
        ip_address: metadata.ip || 'Unknown',
        location: metadata.location || 'Unknown'
    }]);

    if (result === 'failure' || result === 'warning') {
        await supabase.from('security_alerts').insert([{
            qr_id: qrId,
            alert_type: result === 'failure' ? 'MISSING_TOKEN' : 'DUPLICATE_SCAN',
            severity: result === 'failure' ? 'high' : 'medium'
        }]);
    }
}
