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

    const { token } = req.body;
    const authHeader = req.headers.authorization;

    if (!token) {
        return res.status(400).json({ status: 'invalid', message: 'Token is required' });
    }

    try {
        // Optional: Identify the verifier if authenticated
        let verifierId = null;
        if (authHeader) {
            const jwt = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabase.auth.getUser(jwt);
            verifierId = user?.id;
        }

        // 1. Hash the incoming raw token using SHA-256
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // 2. Query the qr_codes table using the hashed token
        const { data: qr, error: qrError } = await supabase
            .from('qr_codes')
            .select(`
                id,
                product_id,
                vendor_id,
                status
            `)
            .eq('hashed_token', hashedToken)
            .single();

        // 3. If no record exists, return status = invalid
        if (qrError || !qr) {
            await logVerification(null, null, 'invalid', req, verifierId);
            return res.status(200).json({ status: 'invalid' });
        }

        // 4. If record exists and status = used, return status = used
        if (qr.status === 'used') {
            await logVerification(qr.id, qr.vendor_id, 'used', req, verifierId);
            return res.status(200).json({ status: 'used' });
        }

        // 5. If record exists and status = active, mark QR as used
        if (qr.status === 'active') {
            const { error: updateError } = await supabase
                .from('qr_codes')
                .update({ status: 'used' })
                .eq('id', qr.id);

            if (updateError) throw updateError;

            // 6. Insert a verification record into audit_logs
            await logVerification(qr.id, qr.vendor_id, 'valid', req, verifierId);

            // 7. Return status = valid along with linked product_id
            return res.status(200).json({
                status: 'valid',
                product_id: qr.product_id
            });
        }

        return res.status(400).json({ status: 'invalid', message: 'Unknown status' });

    } catch (error) {
        console.error('Verification error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

async function logVerification(qrId, vendorId, result, req, verifierId) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';

    try {
        await supabase.from('audit_logs').insert([{
            qr_id: qrId,
            vendor_id: vendorId,
            verifier_id: verifierId,
            result: result,
            ip_address: ip,
            location: 'Remote API Verification',
            details: verifierId ? `Verified by: ${verifierId}` : 'Public Verification'
        }]);
    } catch (logError) {
        console.error('Failed to log verification:', logError);
    }
}
