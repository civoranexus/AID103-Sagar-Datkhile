export const Button = ({ children, variant = 'primary', ...props }) => {
    const styles = {
        padding: '0.75rem 1.5rem',
        borderRadius: 'var(--radius-md)',
        fontWeight: '600',
        transition: 'all 0.2s ease',
        fontSize: '0.95rem',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        boxShadow: variant === 'primary' ? 'var(--shadow-md)' : 'none',
        backgroundColor: variant === 'primary' ? 'var(--accent)' : 'transparent',
        color: variant === 'primary' ? 'white' : 'var(--text-main)',
        border: variant === 'outline' ? '1px solid var(--border)' : 'none',
    };

    const hoverStyles = variant === 'primary' ? { backgroundColor: 'var(--accent-hover)' } : { backgroundColor: 'var(--background)' };

    return (
        <button
            style={styles}
            onMouseOver={(e) => Object.assign(e.currentTarget.style, hoverStyles)}
            onMouseOut={(e) => Object.assign(e.currentTarget.style, styles)}
            {...props}
        >
            {children}
        </button>
    );
};

export const Input = ({ label, ...props }) => (
    <div style={{ marginBottom: '1.25rem' }}>
        {label && <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-muted)' }}>{label}</label>}
        <input
            style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            }}
            onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            }}
            onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = 'none';
            }}
            {...props}
        />
    </div>
);

export const Card = ({ children, padding = '2rem', ...props }) => (
    <div
        className="fade-in"
        style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            padding: padding,
            ...props.style
        }}
    >
        {children}
    </div>
);
