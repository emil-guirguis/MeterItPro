import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LoginIcon from '@mui/icons-material/Login';
import logo from '../assets/meteritpro-logo.svg';
import { useAuth } from '../hooks/useAuth';
import './LandingPage.css';

const LandingPage: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, isLoading, navigate]);

    return (
        <div className="landing-page">
            <header className="landing-nav">
                <div className="landing-nav-inner">
                    <div className="landing-logo">
                        <img src={logo} alt="MeterIt Pro logo" />
                        <span>MeterIt Pro</span>
                    </div>
                    <nav className="landing-nav-links">
                        <div className="landing-dropdown">
                            <button type="button" aria-haspopup="true">
                                Products
                            </button>
                            <div className="landing-dropdown-menu" role="menu">
                                <a href="#products" role="menuitem">Smart Meter Capture</a>
                                <a href="#products" role="menuitem">Audit Trails</a>
                                <a href="#products" role="menuitem">Alerts &amp; Analytics</a>
                            </div>
                        </div>
                        <a href="#pricing">Pricing</a>
                        <a href="#partners">Partners</a>
                        <a href="#demo">Demo</a>
                        <Link className="landing-login" to="/login">
                            <LoginIcon fontSize="small" />
                            Login
                        </Link>
                    </nav>
                </div>
            </header>

            <section className="landing-hero" id="top">
                <div>
                    <h1>Meter readings, made simple.</h1>
                    <p>
                        Track electrical meter readings across sites, devices, and tenants.
                        Achieve consistent capture, automated reporting, dashboarding, notifications,
                        and AI querying on a single, secure platform.
                    </p>
                    <div className="landing-hero-actions">
                        <a className="landing-btn-primary" href="#demo">Request a Demo</a>
                        <Link className="landing-btn-secondary" to="/login">Login</Link>
                    </div>
                </div>
                <div className="landing-hero-card">
                    <h3>What you get</h3>
                    <ul>
                        <li>Automated meter capture with audit-ready history</li>
                        <li>Automated validation and anomaly detection</li>
                        <li>Portfolio dashboards for energy and cost control</li>
                        <li>Customizable reporting</li>
                        <li>AI ready</li>
                    </ul>
                </div>
            </section>

            <section className="landing-section" id="products">
                <h2>Products built for meter operations</h2>
                <p>
                    From single buildings to multi-site portfolios, MeterIt Pro keeps every
                    electrical meter reading accurate, traceable, and easy to analyze.
                </p>
                <div className="landing-grid">
                    <div className="landing-card">
                        <h3>Smart Meter Capture</h3>
                        <p>Mobile-friendly workflows that guide technicians through every reading.</p>
                    </div>
                    <div className="landing-card">
                        <h3>Quality &amp; Validation</h3>
                        <p>Automatic checks highlight anomalies and missing data before reports are sent.</p>
                    </div>
                    <div className="landing-card">
                        <h3>Energy Analytics</h3>
                        <p>Track usage trends, peak demand, and efficiency across meters.</p>
                    </div>
                </div>
            </section>

            <section className="landing-section" id="pricing">
                <h2>Pricing</h2>
                <div className="landing-grid">
                    <div className="landing-card landing-pricing">
                        <h3>Starter</h3>
                        <p>Perfect for small portfolios and single-site operators.</p>
                        <p><strong>$???? / month</strong></p>
                    </div>
                    <div className="landing-card landing-pricing">
                        <h3>Growth</h3>
                        <p>Scale across multiple locations with advanced reporting.</p>
                        <p><strong>$???? / month</strong></p>
                    </div>
                    <div className="landing-card landing-pricing">
                        <h3>Enterprise</h3>
                        <p>Custom integrations.</p>
                        <p><strong>?????</strong></p>
                    </div>
                </div>
            </section>

            <section className="landing-section" id="partners">
                <h2>Partners</h2>
                <p>
                    Trusted by facility managers, energy consultants, and utilities to deliver
                    accurate meter data and actionable insights.
                </p>
                <div className="landing-grid">
                    <div className="landing-card">Facility Management Teams</div>
                    <div className="landing-card">Energy Consultants</div>
                    <div className="landing-card">Utilities &amp; ESCOs</div>
                </div>
            </section>

            <section className="landing-section" id="demo">
                <h2>Book a Demo</h2>
                <p>
                    See MeterIt Pro in action and learn how it can streamline meter data operations.
                </p>
                <div className="landing-hero-actions">
                    <a className="landing-btn-primary" href="mailto:demo@meteritpro.com">
                        Email for a Demo
                    </a>
                    <Link className="landing-btn-secondary" to="/login">
                        Go to Login
                    </Link>
                </div>
            </section>

            <footer className="landing-footer">
                © 2025 MeterIt Pro. All rights reserved.
            </footer>
        </div>
    );
};

export default LandingPage;
