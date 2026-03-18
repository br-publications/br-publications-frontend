import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  FileText, Copyright, Stamp, Check, User, Globe,
  ClipboardList, Shield, Gavel, Target, Search, FileSignature
} from 'lucide-react';
import './ipr.css';

const IPR = () => {
  const location = useLocation();

  // Handle scrolling to section based on hash
  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  return (
    <div className="ipr-page-wrapper">
      <header className="ipr-hero">
        <h1>Intellectual Property Rights Services</h1>
        <p>Protecting Your Innovations, Securing Your Future</p>
      </header>

      <main className="ipr-container">

        {/* Patent Section */}
        <section id="patent" className="ipr-section">
          <div className="ipr-section-header">
            <div className="section-icon"><FileText size={24} /></div>
            <div className="section-title-wrapper">
              <h2>Patent Filing Support & Consultation</h2>
              <span className="sections-subtitle">Transform Your Ideas into Protected Innovations</span>
            </div>
          </div>

          <div className="section-content">
            <div className="section-intro">
              At BR Publications, we understand that patent filing is a critical step for protecting innovations and
              research. Our expert services ensure that your inventions receive proper protection, both nationally and
              internationally.
            </div>

            <div className="services-grid">
              {[
                { title: "Patent Search & Prior Art Analysis", desc: "Comprehensive search to identify existing patents and ensure novelty of your invention." },
                { title: "Drafting & Documentation", desc: "Professional drafting of patent applications, including claims, drawings, and detailed descriptions." },
                { title: "Filing Assistance", desc: "Guidance and support for filing patents with authorities nationwide and globally." },
                { title: "Strategy & Consultation", desc: "Expert advice on intellectual property strategy, scope, and comprehensive protection planning." },
                { title: "Prosecution Support", desc: "Assistance throughout the examination process, including responses to office actions." },
                { title: "Project-to-Patent", desc: "Turn your research or product into a patentable entity with expert guidance." }
              ].map((item, index) => (
                <div key={index} className="service-card">
                  <h3><Check size={14} /> {item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="benefits-area">
              <h3>Why Choose BR Publications for Patent Services</h3>
              <div className="benefits-grid">
                <div className="benefit-item">
                  <div className="benefit-icon"><User size={20} /></div>
                  <div className="benefit-text">
                    <h4>Expert Guidance</h4>
                    <p>From idea conception to granted patent with professional support</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon"><Globe size={20} /></div>
                  <div className="benefit-text">
                    <h4>Global Coverage</h4>
                    <p>Support for national and international filing (PCT).</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon"><ClipboardList size={20} /></div>
                  <div className="benefit-text">
                    <h4>Comprehensive Service</h4>
                    <p>Complete assistance from search to prosecution</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon"><Shield size={20} /></div>
                  <div className="benefit-text">
                    <h4>IP Protection</h4>
                    <p>Commitment to protecting your creative and technical innovations.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Copyright Section */}
        <section id="copyright" className="ipr-section">
          <div className="ipr-section-header">
            <div className="section-icon"><Copyright size={24} /></div>
            <div className="section-title-wrapper">
              <h2>Copyright Registration</h2>
              <span className="sections-subtitle">Safeguard Your Creative and Scholarly Work</span>
            </div>
          </div>

          <div className="section-content">
            <div className="section-intro">
              At BR Publications, protecting your intellectual property is a top priority. We provide
              comprehensive copyright and IPR services to safeguard your work and ensure your rights as an
              author are preserved globally.
            </div>

            <div className="services-grid">
              {[
                { title: "Registration Assistance", desc: "Support to register your work with relevant copyright authorities." },
                { title: "Intellectual Property Consultation", desc: "Expert advice on protecting Research, Book Chapters, and Publications." },
                { title: "License Agreements", desc: "Assistance in preparing copyright transfer or licensing agreements for your work." },
                { title: "Plagiarism Checking", desc: "Advanced plagiarism detection tools to ensure originality and protect against infringement." },
                { title: "Digital Rights", desc: "Protecting published work in digital formats from unauthorized use and reproduction." }
              ].map((item, index) => (
                <div key={index} className="service-card">
                  <h3><Check size={14} /> {item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="benefits-area">
              <h3>Why Copyright & IPR Matter</h3>
              <p style={{ textAlign: 'center', fontSize: '13px', marginBottom: '30px', opacity: 0.95 }}>
                Copyright and IPR safeguard your creative and scholarly work, ensuring that your contributions receive
                proper recognition and protection from unauthorized use.
              </p>
              <div className="benefits-grid">
                <div className="benefit-item">
                  <div className="benefit-icon"><FileSignature size={20} /></div>
                  <div className="benefit-text">
                    <h4>Complete Protection</h4>
                    <p>From registration to enforcement of your rights</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon"><Gavel size={20} /></div>
                  <div className="benefit-text">
                    <h4>Legal Documentation</h4>
                    <p>Professional assistance with all legal paperwork.</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon"><Globe size={20} /></div>
                  <div className="benefit-text">
                    <h4>Worldwide Protection</h4>
                    <p>Commitment to protecting your creative and technical innovations on a global scale.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trademark Section */}
        <section id="trademark" className="ipr-section">
          <div className="ipr-section-header">
            <div className="section-icon"><Stamp size={24} /></div>
            <div className="section-title-wrapper">
              <h2>Trademark Registration</h2>
              <span className="sections-subtitle">Protect Your Brand Identity and Market Presence</span>
            </div>
          </div>

          <div className="section-content">
            <div className="section-intro">
              At BR Publications, we understand that trademarks and intellectual property are critical assets
              for authors, publishers, and creators. We provide end-to-end support to help you secure, manage,
              and protect your trademarks and intellectual property rights globally.
            </div>

            <div className="services-grid">
              {[
                { title: "Brand Registration Assistance", desc: "Guidance for registering your brand name, logo and title with trademark authorities." },
                { title: "Search & Clearance", desc: "Comprehensive searches to avoid conflicts and ensure uniqueness." },
                { title: "Renewal & Maintenance", desc: "Support in renewing trademarks and managing ongoing rights effectively." },
                { title: "IPR Consultation", desc: "Professional advice on protecting your creative works and brand identity." },
                { title: "Legal Documentation", desc: "Drafting and reviewing trademark and intellectual property agreements." }
              ].map((item, index) => (
                <div key={index} className="service-card">
                  <h3><Check size={14} /> {item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="benefits-area">
              <h3>🛡️ Why Trademark Protection Matters</h3>
              <p style={{ textAlign: 'center', fontSize: '13px', marginBottom: '30px', opacity: 0.95 }}>
                Trademarks protect your brand identity and distinguish your work in the marketplace, ensuring lasting
                recognition and exclusive rights.
              </p>
              <div className="benefits-grid">
                <div className="benefit-item">
                  <div className="benefit-icon"><Target size={20} /></div>
                  <div className="benefit-text">
                    <h4>Brand Protection</h4>
                    <p>Secure your brand identity in competitive markets</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon"><Search size={20} /></div>
                  <div className="benefit-text">
                    <h4>Comprehensive Search</h4>
                    <p>Thorough analysis to ensure trademark availability</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon"><Globe size={20} /></div>
                  <div className="benefit-text">
                    <h4>Global Support</h4>
                    <p>International trademark registration and protection</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon"><FileText size={20} /></div>
                  <div className="benefit-text">
                    <h4>Legal Expertise</h4>
                    <p>Professional consultation and documentation support</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="stats-section">
          <div className="stat-card">
            <span className="stat-number">1500+</span>
            <span className="stats-label">Patents Filed</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">100+</span>
            <span className="stats-label">Copyrights</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">300+</span>
            <span className="stats-label">Trademarks</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">98%</span>
            <span className="stats-label">Success Rate</span>
          </div>
        </div>

        <div className="cta-section">
          <h3>Ready to Protect Your Intellectual Property?</h3>
          <p>Let us help you transform your ideas into legally protected innovations</p>
          <a href="/contact" className="cta-button">Request a Consultation</a>
        </div>

      </main>
    </div>
  );
};

export default IPR;