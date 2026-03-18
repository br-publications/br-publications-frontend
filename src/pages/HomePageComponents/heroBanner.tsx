import { CheckCircle, Shield, Globe, Zap, Book, FileText, Palette, Megaphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import './heroBanner.css';

const HeroBanner = () => {
  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="content-left">
          <h1 className="hero-title">
            Transform Your Research Into <br />
            <span>Published Reality</span>
          </h1>

          <ul className="features-list">
            <li>
              <CheckCircle className="icon" size={18} />
              <span><strong>Easy Setup</strong> - Get started in minutes with our streamlined process</span>
            </li>
            <li>
              <CheckCircle className="icon" size={18} />
              <span>End-to-End Support (Editing to Distribution)</span>
            </li>
            <li>
              <Shield className="icon" size={18} />
              <span>Full Copyright & IP Protection Guidance</span>
            </li>
            <li>
              <Globe className="icon" size={18} />
              <span>Global Reach across 150+ Countries</span>
            </li>
          </ul>

          <Link to="/contact" className="consultation-button">
            Schedule a Consultation
          </Link>
        </div>

        <div className="content-right">
          <div className="services-card">
            <div className="badge">
              <Zap size={12} /> FAST DELIVERY
            </div>
            <div className="card-header">
              OUR PUBLISHING SERVICES
            </div>
            <div className="services-body">
              <div className="service-item">
                <div className="icon-box"><Book size={18} /></div>
                <div className="service-info">
                  <h4>Book Publishing</h4>
                  <p>Paperback, hardcover & eBook formats</p>
                </div>
              </div>
              <div className="service-item">
                <div className="icon-box"><FileText size={18} /></div>
                <div className="service-info">
                  <h4>Patent Protection</h4>
                  <p>Secure your intellectual property</p>
                </div>
              </div>
              <div className="service-item">
                <div className="icon-box"><Shield size={18} /></div>
                <div className="service-info">
                  <h4>Copyright Registration</h4>
                  <p>Complete legal protection for your work</p>
                </div>
              </div>
              <div className="service-item">
                <div className="icon-box"><Palette size={18} /></div>
                <div className="service-info">
                  <h4>Design Services</h4>
                  <p>Professional cover and layout design</p>
                </div>
              </div>
              <div className="service-item">
                <div className="icon-box"><Megaphone size={18} /></div>
                <div className="service-info">
                  <h4>Marketing Support</h4>
                  <p>Promote your work globally</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon"><Zap size={25} /></div>
          <div className="stat-value">1500+</div>
          <span className="stat-label">Patents</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Book size={25} /></div>
          <div className="stat-value">750+</div>
          <span className="stat-label">Books</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Award size={25} /></div>
          <div className="stat-value">250+</div>
          <span className="stat-label">Grants</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Shield size={25} /></div>
          <div className="stat-value">100+</div>
          <span className="stat-label">Copyrights</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FileText size={25} /></div>
          <div className="stat-value">75+</div>
          <span className="stat-label">Chapters</span>
        </div>
      </div> */}
    </section>
  );
};


export default HeroBanner;