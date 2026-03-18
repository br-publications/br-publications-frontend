import { useNavigate } from 'react-router-dom';
import './webAppdevelopment.css';

const WebAppDevelopment: React.FC = () => {
  const navigate = useNavigate();

  const toggleFaq = (e: React.MouseEvent<HTMLDivElement>) => {
    const parent = e.currentTarget.parentElement;
    if (parent) {
      parent.classList.toggle('active');
    }
  };

  const handleStartProject = () => {
    navigate('/forms/projects-internships/web-development');
  };



  return (
    <section className="main-content" id="main-content">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h1>Web App Development</h1>
          <p>Custom web applications built with cutting-edge technologies to transform your business ideas into
            powerful digital solutions</p>
          <button className="cta-button" onClick={handleStartProject}>Start Your Project</button>
        </div>
      </section>

      {/* Overview Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">What We Offer</h2>
          <p className="section-subtitle">We build scalable, secure, and user-friendly web applications tailored to
            your
            specific business needs, from concept to deployment and beyond.</p>

          <div className="overview-grid">
            <div className="overview-card">
              <h3>Custom Development</h3>
              <ul>
                <li>Responsive web applications</li>
                <li>Progressive Web Apps (PWA)</li>
                <li>Single Page Applications (SPA)</li>
                <li>Enterprise web solutions</li>
                <li>E-commerce platforms</li>
                <li>Content Management Systems</li>
              </ul>
            </div>
            <div className="overview-card">
              <h3>Key Benefits</h3>
              <ul>
                <li>Modern, intuitive user interfaces</li>
                <li>Cross-browser compatibility</li>
                <li>Mobile-responsive design</li>
                <li>High performance & speed</li>
                <li>Secure authentication & data</li>
                <li>SEO optimized architecture</li>
              </ul>
            </div>
            <div className="overview-card">
              <h3>Why Choose Us</h3>
              <ul>
                <li>Experienced development team</li>
                <li>Agile development methodology</li>
                <li>Regular progress updates</li>
                <li>Quality assurance testing</li>
                <li>Post-launch support included</li>
                <li>Transparent communication</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Our Development Process</h2>
          <p className="section-subtitle">A proven step-by-step approach that ensures your project is delivered on
            time,
            within budget, and exceeds expectations</p>

          <div className="process-timeline">
            <div className="process-step">
              <div className="process-number">1</div>
              <div className="process-content">
                <h3>Discovery & Requirements</h3>
                <p>We start with in-depth consultation to understand your business goals, target audience,
                  and
                  functional requirements. We document all features, create user personas, and define
                  project
                  scope clearly.</p>
                <span className="process-duration">Duration: 3-5 days</span>
              </div>
            </div>

            <div className="process-step">
              <div className="process-number">2</div>
              <div className="process-content">
                <h3>Planning & Architecture</h3>
                <p>Our team creates detailed technical specifications, database schemas, API documentation,
                  and
                  system architecture. We select the optimal technology stack and create a development
                  roadmap
                  with milestones.</p>
                <span className="process-duration">Duration: 5-7 days</span>
              </div>
            </div>

            <div className="process-step">
              <div className="process-number">3</div>
              <div className="process-content">
                <h3>UI/UX Design</h3>
                <p>Designers create wireframes, mockups, and interactive prototypes focusing on user
                  experience.
                  We present multiple design concepts and refine based on your feedback before final
                  approval.
                </p>
                <span className="process-duration">Duration: 1-2 weeks</span>
              </div>
            </div>

            <div className="process-step">
              <div className="process-number">4</div>
              <div className="process-content">
                <h3>Development</h3>
                <p>Our developers build your application using best coding practices, working in sprints
                  with
                  regular demos. Both frontend and backend are developed simultaneously with continuous
                  integration.</p>
                <span className="process-duration">Duration: 4-12 weeks (depends on complexity)</span>
              </div>
            </div>

            <div className="process-step">
              <div className="process-number">5</div>
              <div className="process-content">
                <h3>Quality Assurance & Testing</h3>
                <p>Comprehensive testing including functionality, performance, security, and compatibility
                  across devices and browsers. We fix all bugs and ensure everything works flawlessly.</p>
                <span className="process-duration">Duration: 1-2 weeks</span>
              </div>
            </div>

            <div className="process-step">
              <div className="process-number">6</div>
              <div className="process-content">
                <h3>Deployment & Launch</h3>
                <p>We handle server setup, domain configuration, SSL certificates, and deploy your
                  application
                  to production. Final checks are performed before the official launch.</p>
                <span className="process-duration">Duration: 2-3 days</span>
              </div>
            </div>

            <div className="process-step">
              <div className="process-number">7</div>
              <div className="process-content">
                <h3>Training & Handover</h3>
                <p>We provide comprehensive documentation, admin panel training, and knowledge transfer
                  sessions. You'll receive all source code, credentials, and ongoing support information.
                </p>
                <span className="process-duration">Duration: 3-5 days</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technologies Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Technologies We Use</h2>
          <p className="section-subtitle">We leverage modern, reliable technologies to build robust applications that
            scale with your business</p>

          <div className="tech-grid">
            <div className="tech-item">
              <h4>Frontend</h4>
              <p>React.js, Vue.js, Angular, Next.js, TypeScript, HTML5, CSS3, Tailwind CSS, Bootstrap</p>
            </div>
            <div className="tech-item">
              <h4>Backend</h4>
              <p>Node.js, Python (Django/Flask), PHP (Laravel), Ruby on Rails, Java (Spring Boot)</p>
            </div>
            <div className="tech-item">
              <h4>Databases</h4>
              <p>PostgreSQL, MySQL, MongoDB, Redis, Firebase, Supabase</p>
            </div>
            <div className="tech-item">
              <h4>Cloud & DevOps</h4>
              <p>AWS, Google Cloud, Azure, Docker, Kubernetes, CI/CD pipelines, Git</p>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">What We Need From You</h2>
          <p className="section-subtitle">To ensure smooth project execution, we'll need the following information and
            materials from your end</p>

          <div className="requirements-list">
            <div className="requirement-item">
              <h4>1. Business Requirements Document</h4>
              <p><strong>What:</strong> A detailed description of your business goals, target audience, key
                features you want, and any specific functionalities.<br />
                <strong>Format:</strong> Document, presentation, or detailed email explaining your vision
                and
                requirements.
              </p>
            </div>

            <div className="requirement-item">
              <h4>2. Design Preferences & Branding</h4>
              <p><strong>What:</strong> Your company logo, brand colors, fonts, style guidelines, and
                reference
                websites you like.<br />
                <strong>Format:</strong> Logo files (PNG, SVG), brand guidelines PDF, links to inspirational
                websites.
              </p>
            </div>

            <div className="requirement-item">
              <h4>3. Content & Media</h4>
              <p><strong>What:</strong> Text content for pages, images, videos, product descriptions, or any
                multimedia you want to include.<br />
                <strong>Format:</strong> Text documents, high-resolution images (JPG, PNG), videos (MP4,
                MOV).
              </p>
            </div>

            <div className="requirement-item">
              <h4>4. User Roles & Permissions</h4>
              <p><strong>What:</strong> Define different user types (admin, customer, manager etc.) and what
                each
                role can do.<br />
                <strong>Format:</strong> List or spreadsheet outlining roles and their specific permissions.
              </p>
            </div>

            <div className="requirement-item">
              <h4>5. Third-Party Integrations</h4>
              <p><strong>What:</strong> Any external services to integrate (payment gateways, email services,
                analytics, APIs).<br />
                <strong>Format:</strong> List of services with API credentials if available, or we can help
                you
                set them up.
              </p>
            </div>

            <div className="requirement-item">
              <h4>6. Domain & Hosting Details</h4>
              <p><strong>What:</strong> Your domain name (if purchased) and hosting preferences. We can guide
                you
                if not yet arranged.<br />
                <strong>Format:</strong> Domain registrar access or we can handle purchase and setup.
              </p>
            </div>

            <div className="requirement-item">
              <h4>7. Budget & Timeline Expectations</h4>
              <p><strong>What:</strong> Your budget range and desired launch date or deadline.<br />
                <strong>Format:</strong> Clear communication during initial consultation.
              </p>
            </div>

            <div className="requirement-item">
              <h4>8. Point of Contact</h4>
              <p><strong>What:</strong> Designated person from your team for approvals, feedback, and
                communication.<br />
                <strong>Format:</strong> Name, email, phone number, and preferred communication method.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Project Timeline</h2>
          <p className="section-subtitle">Typical project timelines based on complexity - actual duration depends on
            your
            specific requirements and feature set</p>

          <div className="overview-grid">
            <div className="overview-card">
              <h3>Small Projects</h3>
              <p><strong>Duration:</strong> 4-6 weeks</p>
              <p style={{ marginTop: '15px' }}>Simple web applications with basic features, minimal integrations,
                and
                straightforward functionality.</p>
            </div>
            <div className="overview-card">
              <h3>Medium Projects</h3>
              <p><strong>Duration:</strong> 8-12 weeks</p>
              <p style={{ marginTop: '15px' }}>Applications with custom features, database operations, user
                authentication, and third-party integrations.</p>
            </div>
            <div className="overview-card">
              <h3>Large Projects</h3>
              <p><strong>Duration:</strong> 3-6 months</p>
              <p style={{ marginTop: '15px' }}>Complex enterprise solutions, multiple user roles, advanced
                features,
                extensive integrations, and scalable architecture.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Deliverables Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">What You'll Receive</h2>
          <p className="section-subtitle">Complete package of deliverables ensuring you have everything needed to
            launch
            and maintain your web application</p>

          <div className="deliverables-grid">
            <div className="deliverable-card">
              <h4>Live Application</h4>
              <ul>
                <li>Fully functional web application</li>
                <li>Deployed on production server</li>
                <li>SSL certificate configured</li>
                <li>Custom domain connected</li>
                <li>Performance optimized</li>
              </ul>
            </div>

            <div className="deliverable-card">
              <h4>Source Code</h4>
              <ul>
                <li>Complete codebase</li>
                <li>Well-documented and commented</li>
                <li>Git repository access</li>
                <li>Clean, maintainable code</li>
                <li>Code structure documentation</li>
              </ul>
            </div>

            <div className="deliverable-card">
              <h4>Documentation</h4>
              <ul>
                <li>User manual / Admin guide</li>
                <li>Technical documentation</li>
                <li>API documentation (if applicable)</li>
                <li>Database schema diagrams</li>
                <li>Deployment instructions</li>
              </ul>
            </div>

            <div className="deliverable-card">
              <h4>Design Assets</h4>
              <ul>
                <li>All UI design files</li>
                <li>Wireframes and mockups</li>
                <li>Image and icon assets</li>
                <li>Style guide documentation</li>
                <li>Responsive design layouts</li>
              </ul>
            </div>

            <div className="deliverable-card">
              <h4>Testing Reports</h4>
              <ul>
                <li>QA test cases and results</li>
                <li>Performance test reports</li>
                <li>Security audit results</li>
                <li>Browser compatibility report</li>
                <li>Load testing metrics</li>
              </ul>
            </div>

            <div className="deliverable-card">
              <h4>Access & Credentials</h4>
              <ul>
                <li>Admin panel credentials</li>
                <li>Database access details</li>
                <li>Hosting/server information</li>
                <li>Third-party service accounts</li>
                <li>All API keys and tokens</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Post-Launch Support</h2>
          <p className="section-subtitle">We don't disappear after launch - comprehensive support to keep your
            application
            running smoothly</p>

          <div className="overview-grid">
            <div className="overview-card">
              <h3>Free Support Period</h3>
              <ul>
                <li>30 days of free bug fixes</li>
                <li>Technical support via email/chat</li>
                <li>Minor adjustments included</li>
                <li>Performance monitoring</li>
                <li>Quick response times</li>
              </ul>
            </div>
            <div className="overview-card">
              <h3>Ongoing Maintenance</h3>
              <ul>
                <li>Monthly/quarterly maintenance plans</li>
                <li>Regular security updates</li>
                <li>Performance optimization</li>
                <li>Backup management</li>
                <li>Feature enhancements</li>
              </ul>
            </div>
            <div className="overview-card">
              <h3>Training & Knowledge</h3>
              <ul>
                <li>Admin panel training sessions</li>
                <li>Video tutorials</li>
                <li>User documentation</li>
                <li>Best practices guide</li>
                <li>Ongoing consultation available</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Frequently Asked Questions</h2>

          <div className="faq-container">
            <div className="faq-item">
              <div className="faq-question" onClick={toggleFaq}>
                Can you work with my existing design or do you create new designs?
                <span className="faq-icon">▼</span>
              </div>
              <div className="faq-answer">
                We can do both! If you have existing designs (Figma, Sketch, Adobe XD, or even images), we
                can
                develop based on those. If you don't have designs, our team will create modern,
                user-friendly
                UI/UX designs specifically for your project based on your branding and preferences.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question" onClick={toggleFaq}>
                Will my web app work on mobile devices and tablets?
                <span className="faq-icon">▼</span>
              </div>
              <div className="faq-answer">
                Absolutely! All our web applications are fully responsive, meaning they automatically adapt
                and
                work seamlessly across all devices - desktops, laptops, tablets, and smartphones. We test on
                multiple screen sizes and browsers to ensure consistent performance.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question" onClick={toggleFaq}>
                What if I need changes or new features after the app is launched?
                <span className="faq-icon">▼</span>
              </div>
              <div className="faq-answer">
                That's completely normal! We offer ongoing support and maintenance packages. Minor changes
                during the 30-day free support period are included. For larger feature additions or
                modifications, we can provide a quote and implement them as part of a maintenance agreement
                or
                new project phase.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question" onClick={toggleFaq}>
                Do I own the source code and design after project completion?
                <span className="faq-icon">▼</span>
              </div>
              <div className="faq-answer">
                Yes, 100%! Once the final payment is made, you own all rights to the source code, design
                files,
                and any assets created for your project. We provide complete ownership and transfer all
                materials to you.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question" onClick={toggleFaq}>
                How involved do I need to be during the development process?
                <span className="faq-icon">▼</span>
              </div>
              <div className="faq-answer">
                We'll need your involvement at key milestone points - initial requirements gathering,
                design
                approval, feature reviews, and final testing. We typically schedule weekly or bi-weekly
                check-ins (30-60 minutes) to show progress and get your feedback. You can be as hands-on
                or
                hands-off as you prefer.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question" onClick={toggleFaq}>
                What happens if you miss the deadline?
                <span className="faq-icon">▼</span>
              </div>
              <div className="faq-answer">
                We take deadlines seriously and build buffer time into our estimates. However, delays
                can
                happen due to scope changes, delayed feedback, or unforeseen technical challenges. We
                communicate proactively - if we anticipate any delays, we inform you immediately with
                reasons and revised timelines. Our contract includes clear terms about timeline
                adjustments.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question" onClick={toggleFaq}>
                Can you integrate payment gateways and third-party services?
                <span className="faq-icon">▼</span>
              </div>
              <div className="faq-answer">
                Yes! We have extensive experience integrating various payment gateways (Stripe, PayPal,
                Razorpay, Square), email services (SendGrid, Mailchimp), SMS services, social media
                APIs,
                analytics tools (Google Analytics, Mixpanel), CRM systems, and many other third-party
                services. Just let us know what you need.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question" onClick={toggleFaq}>
                How secure will my web application be?
                <span className="faq-icon">▼</span>
              </div>
              <div className="faq-answer">
                Security is a top priority. We implement industry-standard security practices including
                HTTPS/SSL encryption, secure authentication, data encryption, SQL injection prevention,
                XSS
                protection, CSRF tokens, regular security audits, and secure coding practices. We also
                follow OWASP security guidelines and can implement additional security measures based on
                your needs.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question" onClick={toggleFaq}>
                Do you provide hosting, or do I need to arrange it separately?
                <span className="faq-icon">▼</span>
              </div>
              <div className="faq-answer">
                We can handle both! We can recommend and set up hosting on reliable platforms (AWS,
                Google
                Cloud, DigitalOcean, etc.) suited to your needs and budget. Alternatively, if you have
                preferred hosting, we can deploy there. We'll guide you through the options and handle
                the
                entire deployment process regardless of your choice.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question" onClick={toggleFaq}>
                What if I'm not satisfied with the final product?
                <span className="faq-icon">▼</span>
              </div>
              <div className="faq-answer">
                Client satisfaction is our goal. We work in milestones with regular reviews to ensure
                we're
                on track with your vision. Each major phase requires your approval before moving
                forward. If
                there are concerns, we address them immediately. Our contract includes revision rounds
                at
                each stage. We don't consider a project complete until you're happy with the result.
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
};

export default WebAppDevelopment;