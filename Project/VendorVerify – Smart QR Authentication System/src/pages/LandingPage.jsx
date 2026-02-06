import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShieldCheck,
    QrCode,
    Smartphone,
    Globe,
    Lock,
    Users,
    ArrowRight,
    Menu,
    X,
    CheckCircle2,
    Search,
    BarChart3
} from 'lucide-react';
import { Button } from '../components/UI';

const LandingPage = () => {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setMobileMenuOpen(false);
        }
    };

    return (
        <div className="fade-in" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--background)' }}>

            {/* --- Navbar --- */}
            <nav style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid var(--border)',
                height: '80px',
                display: 'flex',
                alignItems: 'center'
            }}>
                <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div style={{ background: 'var(--primary)', padding: '0.5rem', borderRadius: '12px', color: 'white' }}>
                            <ShieldCheck size={28} />
                        </div>
                        <span className="font-display" style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>VendorVerify</span>
                    </div>

                    {/* Desktop Links */}
                    <div className="desktop-nav" style={{ display: 'none', gap: '2rem', alignItems: 'center' }}>
                        {['How It Works', 'Features', 'For Vendors', 'For Verifiers'].map((item) => (
                            <button
                                key={item}
                                onClick={() => scrollToSection(item.toLowerCase().replace(/\s+/g, '-'))}
                                style={{ background: 'none', border: 'none', fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.2s' }}
                                onMouseEnter={(e) => e.target.style.color = 'var(--primary)'}
                                onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                            >
                                {item}
                            </button>
                        ))}
                    </div>

                    {/* CTAs */}
                    <div className="desktop-nav" style={{ display: 'none', gap: '1rem', alignItems: 'center' }}>
                        <Button variant="outline" onClick={() => navigate('/Login')}>Log In</Button>
                        <Button className="btn-primary" onClick={() => navigate('/Register')}>Get Started <ArrowRight size={18} /></Button>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="mobile-toggle"
                        style={{ display: 'block', background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>

                {/* Mobile Menu Dropdown */}
                {mobileMenuOpen && (
                    <div style={{
                        position: 'absolute', top: '80px', left: 0, right: 0,
                        backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)',
                        padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem',
                        boxShadow: 'var(--shadow-lg)'
                    }}>
                        {['How It Works', 'Features', 'For Vendors', 'For Verifiers'].map((item) => (
                            <button
                                key={item}
                                onClick={() => scrollToSection(item.toLowerCase().replace(/\s+/g, '-'))}
                                style={{ textAlign: 'left', padding: '0.75rem', background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}
                            >
                                {item}
                            </button>
                        ))}
                        <div style={{ height: '1px', background: 'var(--border)', margin: '0.5rem 0' }}></div>
                        <Button variant="outline" style={{ justifyContent: 'center' }} onClick={() => navigate('/Login')}>Log In</Button>
                        <Button className="btn-primary" style={{ justifyContent: 'center' }} onClick={() => navigate('/Register')}>Get Started</Button>
                    </div>
                )}
            </nav>

            {/* --- Hero Section --- */}
            <header style={{
                padding: '8rem 2rem 6rem',
                background: 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 40%)',
                textAlign: 'center'
            }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.5rem 1rem', background: 'rgba(59, 130, 246, 0.1)',
                        color: 'var(--accent)', borderRadius: '100px', fontSize: '0.875rem', fontWeight: 600,
                        marginBottom: '1.5rem'
                    }}>
                        <ShieldCheck size={16} /> Secure Supply Chain Solution
                    </div>
                    <h1 className="font-display" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: 1.1, marginBottom: '1.5rem', color: 'var(--primary)' }}>
                        Verify Products. <span style={{ color: 'var(--accent)' }}>Prevent Counterfeits.</span><br />Build Trust.
                    </h1>
                    <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
                        VendorVerify is a decentralized, secure QR-based authentication system that helps verify product authenticity in real time.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Button className="btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }} onClick={() => navigate('/Register')}>
                            Start Verifying Now
                        </Button>
                        <Button variant="outline" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }} onClick={() => scrollToSection('how-it-works')}>
                            Learn How It Works
                        </Button>
                    </div>
                </div>
            </header>

            {/* --- About Section --- */}
            <section style={{ padding: '6rem 2rem', backgroundColor: 'white' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
                    <h2 className="font-display" style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>What is VendorVerify?</h2>
                    <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: '3rem' }}>
                        VendorVerify is a next-generation smart authentication platform designed to bridge the trust gap between vendors and consumers.
                        By assigning a unique, tamper-proof QR code to every product, we enable instant verification of authenticity, preventing fraud and ensuring safety.
                    </p>
                    <div className="grid grid-cols-3" style={{ gap: '2rem' }}>
                        {[
                            { icon: ShieldCheck, title: "Anti-Counterfeit", desc: "Eliminate fake products with secure, unique digital identities." },
                            { icon: Smartphone, title: "Real-Time Scan", desc: "Instant verification results with any smartphone camera." },
                            { icon: Lock, title: "Secure Audit Logs", desc: "Every scan is tracked with IP and location for audit trails." }
                        ].map((card, idx) => (
                            <div key={idx} className="card" style={{ padding: '2rem', textAlign: 'left' }}>
                                <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', marginBottom: '1.5rem' }}>
                                    <card.icon size={24} />
                                </div>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>{card.title}</h3>
                                <p style={{ color: 'var(--text-muted)' }}>{card.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- How It Works --- */}
            <section id="how-it-works" style={{ padding: '6rem 2rem', backgroundColor: 'var(--background)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 className="font-display" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>How VendorVerify Works</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Four simple steps to absolute security</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
                        {[
                            { step: "01", title: "Vendor Registers", desc: "Vendors create an account and register their product details in our secure system." },
                            { step: "02", title: "QR Generation", desc: "The system generates a unique, encrypted QR code linked to the specific product unit." },
                            { step: "03", title: "Consumer Scans", desc: "Verifiers or customers scan the QR code using the VendorVerify app or camera." },
                            { step: "04", title: "Instant Result", desc: "Get immediate feedback: Authentic, Invalid, or Already Used." }
                        ].map((item, idx) => (
                            <div key={idx} style={{ position: 'relative', padding: '2rem', backgroundColor: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: '4rem', fontWeight: 700, color: 'var(--border)', opacity: 0.5, position: 'absolute', top: '1rem', right: '1.5rem' }}>
                                    {item.step}
                                </div>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', position: 'relative', zIndex: 2 }}>{item.title}</h3>
                                <p style={{ color: 'var(--text-muted)', position: 'relative', zIndex: 2 }}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- Features --- */}
            <section id="features" style={{ padding: '6rem 2rem', backgroundColor: 'white' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
                        <div>
                            <h2 className="font-display" style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Powerful Features for<br />Total Control</h2>
                            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                                Everything you need to manage your supply chain security in one comprehensive dashboard.
                            </p>
                            <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {[
                                    "Secure SHA-256 Encrypted QR Codes",
                                    "Geolocation & IP Tracking for Every Scan",
                                    "Role-Based Access (Vendors, Verifiers, Admins)",
                                    "Comprehensive Scan History & Analytics"
                                ].map((feat, i) => (
                                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.05rem', fontWeight: 500 }}>
                                        <CheckCircle2 color="var(--success)" size={20} /> {feat}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div style={{
                            background: 'linear-gradient(135deg, var(--background) 0%, white 100%)',
                            padding: '3rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)',
                            boxShadow: 'var(--shadow-lg)'
                        }}>
                            {/* Abstract UI Representation */}
                            <div style={{ background: 'white', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <div style={{ width: '40%', height: '10px', background: 'var(--border)', borderRadius: '4px' }}></div>
                                    <div style={{ width: '20%', height: '10px', background: 'var(--success)', borderRadius: '4px' }}></div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ width: '60px', height: '60px', background: 'var(--background)', borderRadius: '8px' }}></div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ width: '80%', height: '8px', background: 'var(--border)', borderRadius: '4px', marginBottom: '8px' }}></div>
                                        <div style={{ width: '50%', height: '8px', background: 'var(--border)', borderRadius: '4px' }}></div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1, background: 'white', padding: '1rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>
                                        <Globe size={14} color="var(--accent)" /> IP: 192.168.1.1
                                    </div>
                                </div>
                                <div style={{ flex: 1, background: 'white', padding: '1rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>
                                        <CheckCircle2 size={14} color="var(--success)" /> Authentic
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Roles (Tabs) --- */}
            <section id="for-vendors" style={{ padding: '6rem 2rem', backgroundColor: 'var(--background)' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 className="font-display" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Who Is VendorVerify For?</h2>
                    </div>

                    <div className="grid grid-cols-3" style={{ gap: '2rem' }}>
                        {/* Vendor Card */}
                        <div className="card" style={{ padding: '2rem', borderTop: '4px solid var(--accent)' }}>
                            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <BarChart3 size={24} color="var(--accent)" />
                                <h3 style={{ fontSize: '1.25rem' }}>Vendors</h3>
                            </div>
                            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                                <li style={{ display: 'flex', gap: '0.5rem' }}>• Protect Brand Authenticity</li>
                                <li style={{ display: 'flex', gap: '0.5rem' }}>• Track Verification Stats</li>
                                <li style={{ display: 'flex', gap: '0.5rem' }}>• Manage Product Catalog</li>
                            </ul>
                        </div>

                        {/* Verifier Card */}
                        <div id="for-verifiers" className="card" style={{ padding: '2rem', borderTop: '4px solid var(--success)' }}>
                            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Search size={24} color="var(--success)" />
                                <h3 style={{ fontSize: '1.25rem' }}>Verifiers</h3>
                            </div>
                            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                                <li style={{ display: 'flex', gap: '0.5rem' }}>• Quick Mobile Scanning</li>
                                <li style={{ display: 'flex', gap: '0.5rem' }}>• Instant Validity Checks</li>
                                <li style={{ display: 'flex', gap: '0.5rem' }}>• View Product History</li>
                            </ul>
                        </div>

                        {/* Admin Card */}
                        <div className="card" style={{ padding: '2rem', borderTop: '4px solid var(--primary)' }}>
                            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Lock size={24} color="var(--primary)" />
                                <h3 style={{ fontSize: '1.25rem' }}>Admins</h3>
                            </div>
                            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                                <li style={{ display: 'flex', gap: '0.5rem' }}>• System-Wide Monitoring</li>
                                <li style={{ display: 'flex', gap: '0.5rem' }}>• User Management</li>
                                <li style={{ display: 'flex', gap: '0.5rem' }}>• Security Audit Logs</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CTA Section --- */}
            <section style={{ padding: '6rem 2rem', textAlign: 'center' }}>
                <div style={{
                    maxWidth: '1000px', margin: '0 auto',
                    background: 'var(--primary)', color: 'white',
                    borderRadius: 'var(--radius-xl)', padding: '4rem 2rem',
                    display: 'flex', flexDirection: 'column', alignItems: 'center'
                }}>
                    <h2 className="font-display" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Start Verifying Products with Confidence</h2>
                    <p style={{ fontSize: '1.2rem', opacity: 0.9, marginBottom: '2.5rem', maxWidth: '600px' }}>
                        Join VendorVerify today and make product authentication simple, secure, and reliable for everyone.
                    </p>
                    <Button className="btn-accent" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }} onClick={() => navigate('/Register')}>
                        Create Free Account
                    </Button>
                </div>
            </section>

            {/* --- Footer --- */}
            <footer style={{ backgroundColor: 'white', borderTop: '1px solid var(--border)', padding: '4rem 2rem 2rem' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <div style={{ background: 'var(--primary)', padding: '0.25rem', borderRadius: '6px', color: 'white' }}>
                                    <ShieldCheck size={20} />
                                </div>
                                <span className="font-display" style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>VendorVerify</span>
                            </div>
                            <p style={{ color: 'var(--text-muted)', maxWidth: '300px' }}>
                                Developed under Civora X Internship Program.
                                <br />Bringing trust to supply chains everywhere.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '3rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <strong>Links</strong>
                                <span style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => scrollToSection('how-it-works')}>How it Works</span>
                                <span style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => scrollToSection('features')}>Features</span>
                                <span style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => navigate('/Login')}>Login</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <strong>Legal</strong>
                                <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy Policy</a>
                                <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms of Use</a>
                            </div>
                        </div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        © {new Date().getFullYear()} Civora Nexus Pvt. Ltd. All rights reserved.
                    </div>
                </div>
            </footer>

            {/* Basic responsive styles for navbar */}
            <style>{`
                @media (min-width: 768px) {
                    .desktop-nav { display: flex !important; }
                    .mobile-toggle { display: none !important; }
                }
            `}</style>
        </div>
    );
};

export default LandingPage;
