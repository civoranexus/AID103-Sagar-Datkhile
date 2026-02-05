import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { scanned_serial_number, verifier_id } = req.body;

    // Extract Client IP with priority and normalization
    let clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket.remoteAddress || null;
    if (clientIp && clientIp.includes(',')) {
        clientIp = clientIp.split(',')[0].trim();
    }
    if (clientIp && clientIp.startsWith('::ffff:')) {
        clientIp = clientIp.replace('::ffff:', '');
    }
    if (clientIp === '::1') clientIp = '127.0.0.1';

    const ip = clientIp;

    if (!scanned_serial_number) {
        return res.status(400).json({ status: 'invalid', message: 'Serial number is required' });
    }

    try {
        // 1. Hash the scanned serial number using SHA-256
        const hashedToken = crypto.createHash('sha256').update(scanned_serial_number).digest('hex');

        // 2. Search qr_codes table using the hashed token
        const { data: qr, error: qrError } = await supabase
            .from('qr_codes')
            .select(`
                id,
                product_id,
                vendor_id,
                status,
                products (name),
                vendors (company_name)
            `)
            .eq('hashed_token', hashedToken)
            .single();

        // 3. If no record exists, return status = invalid
        if (qrError || !qr) {
            await logVerification(verifier_id, null, null, null, ip, 'invalid');
            return res.status(200).json({ status: 'invalid', message: 'Invalid or tampered QR code' });
        }

        // 4. If record exists and status = used, return status = used
        if (qr.status === 'used') {
            await logVerification(verifier_id, qr.vendor_id, qr.id, qr.product_id, ip, 'used');
            return res.status(200).json({
                status: 'used',
                message: 'QR code has already been verified',
                product_name: qr.products?.name,
                product_serial_number: scanned_serial_number,
                vendor_name: qr.vendors?.company_name
            });
        }

        // 5. If record exists and status = active, mark QR as used
        const { error: updateError } = await supabase
            .from('qr_codes')
            .update({ status: 'used' })
            .eq('id', qr.id);

        if (updateError) throw updateError;

        // 6 & 7. Fetch details (already fetched in select) and log audit record
        await logVerification(verifier_id, qr.vendor_id, qr.id, qr.product_id, ip, 'valid');

        // 8. Return response
        return res.status(200).json({
            status: 'valid',
            product_name: qr.products?.name,
            product_serial_number: scanned_serial_number,
            vendor_name: qr.vendors?.company_name
        });

    } catch (error) {
        console.error('Verification error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

async function logVerification(verifierId, vendorId, qrId, productId, ip, result) {
    try {
        let verifierName = 'Anonymous';
        if (verifierId) {
            const { data } = await supabase.from('users').select('full_name').eq('id', verifierId).single();
            if (data) verifierName = data.full_name;
        }

        await supabase.from('audit_logs').insert([{
            verifier_id: verifierId,
            verifier_name: verifierName,
            vendor_id: vendorId,
            qr_id: qrId,
            product_id: productId,
            ip_address: ip,
            result: result,
            location: 'API verification endpoint'
        }]);
    } catch (err) {
        console.error('Audit logging failed:', err);
    }
}
