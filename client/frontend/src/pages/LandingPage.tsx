import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
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
            <Helmet>
                <title>MeterIt Pro — Meter Management Software for BMS, Manufacturers &amp; Utilities</title>
                <meta name="description" content="MeterIt Pro is cloud-based meter management software for meter sellers, manufacturers, utilities, and BMS operators. Automate readings, validate data, and report across every site." />
                <meta name="keywords" content="meter management software, meter reading software, BMS software, building management system, submetering software, energy meter tracking, meter data management, utility meter software, meter manufacturer software, OEM meter platform" />
                <link rel="canonical" href="https://meteritpro.com/" />
                <meta property="og:title" content="MeterIt Pro — Meter Management Software" />
                <meta property="og:description" content="Cloud-based meter data management for meter sellers, manufacturers, utilities, and BMS operators. Automate readings, validate data, get reports." />
                <meta property="og:url" content="https://meteritpro.com/" />
                <meta property="og:type" content="website" />
                <meta name="twitter:title" content="MeterIt Pro — Meter Management Software" />
                <meta name="twitter:description" content="Cloud-based meter data management for meter sellers, manufacturers, utilities, and BMS operators." />
            </Helmet>
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
                    <h1>Meter Management Software for Manufacturers, Sellers &amp; BMS Operators</h1>
                    <p>
                        MeterIt Pro is a cloud-based meter data management platform built for meter
                        manufacturers, resellers, utilities, and building management system (BMS) operators.
                        Automate meter readings, validate data, generate reports, and get AI-powered insights
                        across single sites or entire multi-site portfolios — all in one secure platform.
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
                        <li>Customizable reporting &amp; export</li>
                        <li>AI-powered meter data querying</li>
                        <li>Multi-tenant &amp; multi-site support</li>
                    </ul>
                </div>
            </section>

            <section className="landing-section" id="products">
                <h2>Meter Management Software Built for the Whole Industry</h2>
                <p>
                    Whether you sell meters, manufacture them, manage buildings, or operate utilities —
                    MeterIt Pro keeps every electrical meter reading accurate, traceable, and easy to analyze.
                    Purpose-built submetering software with the flexibility to fit any portfolio.
                </p>
                <div className="landing-grid">
                    <div className="landing-card">
                        <h3>Smart Meter Capture</h3>
                        <p>Mobile-friendly workflows that guide technicians through every reading. Supports electrical, water, gas, and submetering devices.</p>
                    </div>
                    <div className="landing-card">
                        <h3>Validation &amp; Anomaly Detection</h3>
                        <p>Automatic quality checks flag anomalies and missing data before reports are sent — so your meter data is always audit-ready.</p>
                    </div>
                    <div className="landing-card">
                        <h3>Energy Analytics &amp; Reporting</h3>
                        <p>Track usage trends, peak demand, and cost efficiency across all meters. Export to PDF, CSV, or integrate with your BMS.</p>
                    </div>
                    <div className="landing-card">
                        <h3>Multi-Site Portfolio Management</h3>
                        <p>Manage meter readings across hundreds of locations from a single dashboard. Ideal for property managers, ESCOs, and meter manufacturers.</p>
                    </div>
                    <div className="landing-card">
                        <h3>Alerts &amp; Notifications</h3>
                        <p>Set threshold-based alerts for any meter register. Get notified instantly when readings fall outside expected ranges.</p>
                    </div>
                    <div className="landing-card">
                        <h3>AI-Ready Data Platform</h3>
                        <p>Query your meter data in plain language. MeterIt Pro is built for AI integration from day one.</p>
                    </div>
                </div>
            </section>

            <section className="landing-section" id="who">
                <h2>Who Uses MeterIt Pro</h2>
                <p>
                    From OEM meter manufacturers embedding our platform in their product offering, to
                    utilities managing city-wide submetering, MeterIt Pro scales to every use case.
                </p>
                <div className="landing-grid">
                    <div className="landing-card">
                        <h3>Meter Manufacturers &amp; OEMs</h3>
                        <p>White-label or integrate MeterIt Pro into your product stack. Give your customers a full meter data management platform out of the box.</p>
                    </div>
                    <div className="landing-card">
                        <h3>Meter Sellers &amp; Distributors</h3>
                        <p>Add software value to every meter sale. Offer clients a managed platform for reading, reporting, and alerting.</p>
                    </div>
                    <div className="landing-card">
                        <h3>BMS &amp; Facilities Operators</h3>
                        <p>Connect your building management system to real meter data. Replace manual reads with automated capture and validation.</p>
                    </div>
                    <div className="landing-card">
                        <h3>Utilities &amp; ESCOs</h3>
                        <p>Manage submetering across large property portfolios. Deliver accurate billing data and energy reports to tenants.</p>
                    </div>
                    <div className="landing-card">
                        <h3>Energy Consultants</h3>
                        <p>Access clean, validated meter data for every client site. Generate professional reports without manual data wrangling.</p>
                    </div>
                    <div className="landing-card">
                        <h3>Property &amp; Facility Managers</h3>
                        <p>Track energy consumption across every unit and floor. Identify waste and allocate costs accurately.</p>
                    </div>
                </div>
            </section>

            <section className="landing-section" id="pricing">
                <h2>Simple, Transparent Pricing</h2>
                <p>Start free and scale as your meter portfolio grows. No hidden fees.</p>
                <div className="landing-grid">
                    <Link to="/signup/starter" className="landing-card landing-pricing" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                        <h3>Starter</h3>
                        <p>Perfect for small portfolios and single-site operators.</p>
                        <p><strong>$???? / month</strong></p>
                        <button type="button" className="landing-pricing-btn">Get Started</button>
                    </Link>
                    <Link to="/signup/growth" className="landing-card landing-pricing" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                        <h3>Growth</h3>
                        <p>Scale across multiple locations with advanced reporting and multi-site meter management.</p>
                        <p><strong>$???? / month</strong></p>
                        <button type="button" className="landing-pricing-btn">Get Started</button>
                    </Link>
                    <Link to="/signup/enterprise" className="landing-card landing-pricing" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                        <h3>Enterprise</h3>
                        <p>Custom integrations for meter manufacturers, large utilities, and OEM deployments.</p>
                        <p><strong>Contact us for pricing</strong></p>
                        <button type="button" className="landing-pricing-btn">Contact Us</button>
                    </Link>
                </div>
            </section>

            <section className="landing-section" id="partners">
                <h2>Trusted Across the Meter Industry</h2>
                <p>
                    Meter manufacturers, energy consultants, utilities, and BMS operators rely on
                    MeterIt Pro to deliver accurate meter data and actionable insights at every scale.
                </p>
                <div className="landing-grid">
                    <div className="landing-card">Meter Manufacturers &amp; OEMs</div>
                    <div className="landing-card">Meter Sellers &amp; Distributors</div>
                    <div className="landing-card">Utilities &amp; ESCOs</div>
                    <div className="landing-card">BMS &amp; Facilities Teams</div>
                    <div className="landing-card">Energy Consultants</div>
                    <div className="landing-card">Property Managers</div>
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
