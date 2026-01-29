export default function NotFound() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <h1 style={{ fontSize: '4rem', color: 'var(--accent)', marginBottom: '1rem' }}>404</h1>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Page Not Found</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '400px' }}>
                The link might be broken or the page has been moved. Check the URL or return to safety.
            </p>
            <a href="/" style={{
                padding: '0.75rem 2rem',
                backgroundColor: 'var(--primary)',
                color: 'white',
                borderRadius: 'var(--radius-md)',
                fontWeight: '600'
            }}>
                Return Home
            </a>
        </div>
    );
}
