// Vercel Serverless Function: POST /api/verify
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
    process.env.SUPABASE_URL,
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
        // 1. In a real secure implementation, we'd hash the token received from the QR
        // For this example, we'll assume the token in DB is already hashed or we do it here
        // const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

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
            .eq('hashed_token', token)
            .single();

        if (qrError || !qr) {
            await logAttempt(null, 'failure', 'Invalid token detected', metadata);
            return res.status(404).json({ status: 'invalid', message: 'Counterfeit or Invalid QR Code' });
        }

        if (qr.status === 'used') {
            await logAttempt(qr.id, 'warning', 'Duplicate scan attempt', metadata);
            return res.status(200).json({ status: 'used', message: 'QR Code already used/expired', data: qr });
        }

        // 3. Log success and return data
        await logAttempt(qr.id, 'success', 'Verification successful', metadata);

        // Optionally update status to 'used' if one-time
        // await supabase.from('qr_codes').update({ status: 'used' }).eq('id', qr.id);

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

async function logAttempt(qrId, result, details, metadata = {}) {
    await supabase.from('verification_logs').insert([{
        qr_id: qrId,
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
