import { useNavigate } from 'react-router-dom';
import './mobileAppDevelopment.css';

const MobileAppDevelopment: React.FC = () => {
  const navigate = useNavigate();

  const toggleFaq = (e: React.MouseEvent<HTMLDivElement>) => {
    const parent = e.currentTarget.parentElement;
    if (parent) {
      parent.classList.toggle('active');
    }
  };

  const handleStartProject = () => {
    navigate('/forms/projects-internships/mobile-development');
  };



  return (
    <section className="main-content" id="main-content">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h1>Mobile App Development</h1>
          <p>Native and cross-platform mobile applications for iOS and Android that deliver exceptional user
            experiences</p>
          <button className="cta-button" onClick={handleStartProject}>Start Your Project</button>
        </div>
      </section>

      {/* Overview Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">What We Offer</h2>
          <p className="section-subtitle">We build high-performance mobile applications that engage users, drive
            business
            growth, and provide seamless experiences across all devices.</p>

          <div className="overview-grid">
            <div className="overview-card">
              <h3>App Development Types</h3>
              <ul>
                <li>Native iOS apps (Swift/SwiftUI)</li>
                <li>Native Android apps (Kotlin/Java)</li>
                <li>Cross-platform apps (React Native/Flutter)</li>
                <li>Hybrid apps (Ionic/Cordova)</li>
                <li>Progressive Web Apps (PWA)</li>
                <li>Enterprise mobile solutions</li>
              </ul>
            </div>
            <div className="overview-card">
              <h3>Key Features</h3>
              <ul>
                <li>Intuitive UI/UX design</li>
                <li>Offline functionality</li>
                <li>Push notifications</li>
                <li>In-app purchases & payments</li>
                <li>Real-time data synchronization</li>
                <li>Location-based services</li>
              </ul>
            </div>
            <div className="overview-card">
              <h3>Why Choose Us</h3>
              <ul>
                <li>App Store & Play Store expertise</li>
                <li>Performance optimization focus</li>
                <li>Regular testing on real devices</li>
                <li>Compliance with platform guidelines</li>
                <li>Post-launch app monitoring</li>
                <li>App Store Optimization (ASO)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Our Development Process</h2>
          <p className="section-subtitle">From concept to App Store - a comprehensive approach ensuring your mobile
            app
            succeeds in the competitive marketplace</p>

          <div className="process-timeline">
            <div className="process-step">
              <div className="process-number">1</div>
              <div className="process-content">
                <h3>Discovery & Strategy</h3>
                <p>We analyze your target audience, competitors, and market. Define app objectives, core
                  features, monetization strategy, and create detailed user personas. We also decide on
                  the
                  best platform approach (native vs cross-platform).</p>
                <span className="process-duration">Duration: 5-7 days</span>
              </div>
            </div>

            <div className="process-step">
              <div className="process-number">2</div>
              <div className="process-content">
                <h3>Wireframing & Prototyping</h3>
                <p>Create user flow diagrams, wireframes for all screens, and interactive prototypes. We
                  validate navigation, user interactions, and overall app structure before moving to
                  visual
                  design.</p>
                <span className="process-duration">Duration: 1-2 weeks</span>
              </div>
            </div>

            <div className="process-step">
              <div className="process-number">3</div>
              <div className="process-content">
                <h3>UI/UX Design</h3>
                <p>Design beautiful, platform-specific interfaces following iOS Human Interface Guidelines
                  and
                  Android Material Design principles. Create all visual assets, animations, and design
                  systems
                  with accessibility in mind.</p>
                <span className="process-duration">Duration: 2-3 weeks</span>
              </div>
            </div>

            <div className="process-step">
              <div className="process-number">4</div>
              <div className="process-content">
                <h3>Development</h3>
                <p>Build both frontend and backend components simultaneously. Implement features
                  incrementally,
                  integrate third-party services, APIs, and ensure smooth performance. Regular builds for
                  testing throughout development.</p>
                <span className="process-duration">Duration: 6-16 weeks (complexity dependent)</span>
              </div>
            </div>

            <div className="process-step">
              <div className="process-number">5</div>
              <div className="process-content">
                <h3>Testing & QA</h3>
                <p>Comprehensive testing on multiple devices, OS versions, and screen sizes. Includes
                  functional
                  testing, performance testing, security testing, usability testing, and beta testing with
                  real users.</p>
                <span className="process-duration">Duration: 2-3 weeks</span>
              </div>
            </div>

            <div className="process-step">
              <div className="process-number">6</div>
              <div className="process-content">
                <h3>App Store Submission</h3>
                <p>Prepare app metadata, screenshots, descriptions, and promotional materials. Handle
                  complete
                  App Store and Google Play Store submission process including compliance reviews and
                  approval
                  handling.</p>
                <span className="process-duration">Duration: 1-2 weeks (includes review time)</span>
              </div>
            </div>

            <div className="process-step">
              <div className="process-number">7</div>
              <div className="process-content">
                <h3>Launch & Monitoring</h3>
                <p>Official app launch with monitoring setup for crashes, performance metrics, and user
                  analytics. We track initial user behavior, gather feedback, and prepare for post-launch
                  iterations.</p>
                <span className="process-duration">Duration: Ongoing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technologies Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Technologies We Use</h2>
          <p className="section-subtitle">Cutting-edge mobile development technologies to build fast, reliable, and
            scalable applications</p>

          <div className="tech-grid">
            <div className="tech-item">
              <h4>iOS Development</h4>
              <p>Swift, SwiftUI, UIKit, Objective-C, Xcode, CocoaPods, Combine, Core Data</p>
            </div>
            <div className="tech-item">
              <h4>Android Development</h4>
              <p>Kotlin, Java, Android Studio, Jetpack Compose, XML, Gradle, Room Database</p>
            </div>
            <div className="tech-item">
              <h4>Cross-Platform</h4>
              <p>React Native, Flutter, Dart, Expo, Xamarin, Ionic, Cordova</p>
            </div>
            <div className="tech-item">
              <h4>Backend & APIs</h4>
              <p>Node.js, Firebase, AWS Amplify, GraphQL, REST APIs, Socket.io, MongoDB</p>
            </div>
            <div className="tech-item">
              <h4>Payment Integration</h4>
              <p>Apple Pay, Google Pay, Stripe, PayPal, In-App Purchases, Subscription Management</p>
            </div>
            <div className="tech-item">
              <h4>Testing & Tools</h4>
              <p>XCTest, Espresso, Jest, Detox, TestFlight, Firebase Test Lab, Crashlytics</p>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">What We Need From You</h2>
          <p className="section-subtitle">Essential information and materials needed to build and launch your mobile
            application successfully</p>

          <div className="requirements-list">
            <div className="requirement-item">
              <h4>1. App Concept & Features</h4>
              <p><strong>What:</strong> Detailed description of your app idea, target users, core features,
                user
                flows, and what problems it solves.<br />
                <strong>Format:</strong> Document explaining your vision, similar apps you like, specific
                functionality requirements.
              </p>
            </div>

            <div className="requirement-item">
              <h4>2. Platform Selection</h4>
              <p><strong>What:</strong> Specify if you need iOS only, Android only, or both platforms. Budget
                and
                timeline will help us recommend native vs cross-platform approach.<br />
                <strong>Format:</strong> Clear platform preference and reasoning (target audience, budget
                considerations).
              </p>
            </div>

            <div className="requirement-item">
              <h4>3. Design Assets & Branding</h4>
              <p><strong>What:</strong> App logo/icon, brand colors, fonts, style preferences, existing brand
                guidelines if any.<br />
                <strong>Format:</strong> Logo files (PNG, SVG, AI), color hex codes, brand guide PDF,
                screenshots of apps with desired design style.
              </p>
            </div>

            <div className="requirement-item">
              <h4>4. Content & Media</h4>
              <p><strong>What:</strong> All content including text, images, videos, icons that will be
                displayed
                in the app.<br />
                <strong>Format:</strong> High-resolution images (2x, 3x for iOS), videos optimized for
                mobile,
                text documents with all copy.
              </p>
            </div>

            <div className="requirement-item">
              <h4>5. User Accounts & Authentication</h4>
              <p><strong>What:</strong> Define if users need to create accounts, login methods (email, social
                media, phone), and user data to be collected.<br />
                <strong>Format:</strong> List of required user fields, preferred authentication methods,
                privacy
                policy requirements.
              </p>
            </div>

            <div className="requirement-item">
              <h4>6. Third-Party Services</h4>
              <p><strong>What:</strong> Any external integrations needed (payment gateways, maps, social
                media,
                analytics, push notifications).<br />
                <strong>Format:</strong> List of required services with any existing API credentials or
                accounts.
              </p>
            </div>

            <div className="requirement-item">
              <h4>7. Monetization Strategy</h4>
              <p><strong>What:</strong> How you plan to make money (free, paid app, in-app purchases,
                subscriptions, ads).<br />
                <strong>Format:</strong> Clear monetization model with pricing if applicable.
              </p>
            </div>

            <div className="requirement-item">
              <h4>8. Developer Accounts</h4>
              <p><strong>What:</strong> Apple Developer Account ($99/year) for iOS and Google Play Developer
                Account ($25 one-time) for Android. We can guide you through setup.<br />
                <strong>Format:</strong> Account credentials or we assist with registration process.
              </p>
            </div>

            <div className="requirement-item">
              <h4>9. Legal Requirements</h4>
              <p><strong>What:</strong> Privacy policy, terms of service, age restrictions, data handling
                requirements, GDPR/CCPA compliance needs.<br />
                <strong>Format:</strong> Legal documents or information for us to draft appropriate
                policies.
              </p>
            </div>

            <div className="requirement-item">
              <h4>10. Backend & Data Requirements</h4>
              <p><strong>What:</strong> Data to be stored, user management needs, real-time features, database
                structure expectations.<br />
                <strong>Format:</strong> Description of data flows, user roles, and any existing backend
                systems
                to integrate with.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Project Timeline</h2>
          <p className="section-subtitle">Mobile app timelines vary based on features, platform choice, and complexity
          </p>

          <div className="overview-grid">
            <div className="overview-card">
              <h3>Simple Apps</h3>
              <p><strong>Duration:</strong> 8-12 weeks</p>
              <p style={{ marginTop: '15px' }}>Basic functionality, simple UI, minimal integrations. Examples:
                content
                apps, simple utilities, basic calculators.</p>
            </div>
            <div className="overview-card">
              <h3>Moderate Apps</h3>
              <p><strong>Duration:</strong> 3-5 months</p>
              <p style={{ marginTop: '15px' }}>User authentication, API integrations, push notifications, in-app
                purchases. Examples: social apps, e-commerce, booking systems.</p>
            </div>
            <div className="overview-card">
              <h3>Complex Apps</h3>
              <p><strong>Duration:</strong> 6-12 months</p>
              <p style={{ marginTop: '15px' }}>Advanced features, real-time functionality, complex backend, AI/ML
                features. Examples: fintech apps, marketplaces, on-demand services.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Deliverables Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">What You'll Receive</h2>
          <p className="section-subtitle">Complete package ensuring your app's success from launch to ongoing
            operations
          </p>

          <div className="deliverables-grid">
            <div className="deliverable-card">
              <h4>Published Apps</h4>
              <ul>
                <li>Live app on App Store/Play Store</li>
                <li>Approved and published</li>
                <li>App Store Optimization done</li>
                <li>Screenshots and descriptions set</li>
                <li>Ready for user downloads</li>
              </ul>
            </div>

            <div className="deliverable-card">
              <h4>Source Code</h4>
              <ul>
                <li>Complete iOS/Android codebase</li>
                <li>Well-documented and organized</li>
                <li>Git repository with full history</li>
                <li>Backend code (if applicable)</li>
                <li>All dependencies documented</li>
              </ul>
            </div>

            <div className="deliverable-card">
              <h4>Design Files</h4>
              <ul>
                <li>All UI screens in Figma/Sketch</li>
                <li>App icon in all required sizes</li>
                <li>Assets for all screen densities</li>
                <li>Splash screens and animations</li>
                <li>Design system documentation</li>
              </ul>
            </div>

            <div className="deliverable-card">
              <h4>Documentation</h4>
              <ul>
                <li>Technical documentation</li>
                <li>API documentation</li>
                <li>User manual/help guides</li>
                <li>Admin panel documentation</li>
                <li>Architecture diagrams</li>
              </ul>
            </div>

            <div className="deliverable-card">
              <h4>App Store Assets</h4>
              <ul>
                <li>App Store/Play Store listings</li>
                <li>Screenshots for all devices</li>
                <li>Promotional graphics</li>
                <li>App preview videos (if created)</li>
                <li>Keywords and descriptions</li>
              </ul>
            </div>

            <div className="deliverable-card">
              <h4>Access & Credentials</h4>
              <ul>
                <li>Developer account access</li>
                <li>Backend/database credentials</li>
                <li>API keys and secrets</li>
                <li>Third-party service accounts</li>
                <li>Analytics dashboard access</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Post-Launch Support</h2>
          <p className="section-subtitle">Continuous support to ensure your app stays updated, secure, and performs
            optimally</p>

          <div className="overview-grid">
            <div className="overview-card">
              <h3>Initial Support (60 Days)</h3>
              <ul>
                <li>Bug fixes and crash resolution</li>
                <li>Performance monitoring</li>
                <li>User feedback analysis</li>
                <li>Minor UI adjustments</li>
                <li>Technical support</li>
              </ul>
            </div>
            <div className="overview-card">
              <h3>Maintenance Plans</h3>
              <ul>
                <li>OS updates compatibility</li>
                <li>Security patches</li>
                <li>App Store guideline compliance</li>
                <li>Regular performance optimization</li>
                <li>Monthly update releases</li>
              </ul>
            </div>
            <div className="overview-card">
              <h3>Growth & Updates</h3>
              <ul>
                <li>New feature development</li>
                <li>User analytics review</li>
                <li>A/B testing implementation</li>
                <li>App Store Optimization (ASO)</li>
                <li>Scale infrastructure as needed</li>
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
                Should I build for iOS, Android, or both?
                <span className="faq-icon">▼</span>
              </div>
              <div className="faq-answer">
                It depends on your target audience and budget. If most of your users are in North America or
                Europe with higher income, start with iOS. If targeting emerging markets or tech-savvy
                Android
                users, start with Android. For maximum reach, build for both. We can analyze your market and
                recommend the best approach. Cross-platform development (React Native/Flutter) can also be a
                cost-effective way to target both platforms simultaneously.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question" onClick={toggleFaq}>
                What's the difference between native and cross-platform development?
                <span className="faq-icon">▼</span>
              </div>
              <div className="faq-answer">
                Native means building separate apps for iOS (Swift) and Android (Kotlin) - best performance
                and
                platform-specific features, but more expensive and time-consuming. Cross-platform (React
                Native/Flutter) uses one codebase for both platforms - faster and cheaper, with slightly
                less
                performance. We'll recommend the best approach based on your app's requirements, budget, and
                timeline.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question" onClick={toggleFaq}>
                How long does App Store approval take?
                <span className="faq-icon">▼</span>
              </div>
              <div className="faq-answer">
                Apple's App Store review typically takes 24-48 hours, but can be up to a week during peak
                times.
                Google Play Store is usually faster, often within 24 hours. We handle the entire submission
                process and address any rejection issues. Both stores have strict guidelines we follow to
                ensure
                smooth approval.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question" onClick={toggleFaq}>
                Can you help me monetize my app?
                <span className="faq-icon">▼</span>
              </div>
              <div className="faq-answer">
                Absolutely! We can implement various monetization strategies: in-app purchases, subscription
                models, advertising (AdMob, Facebook Audience Network), freemium models, or paid downloads.
                We'll analyze your app category and recommend the most effective monetization approach. We
                also
                handle all technical integration for payment systems and subscription management.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question" onClick={toggleFaq}>
                Will my app work offline?
                <span className="faq-icon">▼</span>
              </div>
              <div className="faq-answer">
                We can build offline functionality using local data storage and sync when internet is
                available.
                The level of offline support depends on your app's nature - content apps can cache content,
                while real-time apps need connectivity. We'll discuss offline requirements during planning
                and
                implement the appropriate solution for your app.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question" onClick={toggleFaq}>
                Do I need my own developer accounts for App Store and Google Play?
                <span className="faq-icon">▼</span>
              </div>
              <div className="faq-answer">
                Yes, you'll need your own accounts to maintain full control and ownership. Apple Developer
                Program costs $99/year, Google Play Console is a $25 one-time fee. We'll guide you through
                the
                registration process and can even help set them up if needed. This ensures you own the app
                and
                can manage it independently after launch.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question" onClick={toggleFaq}>
                Can you update my app after it's published?
                <span className="faq-icon">▼</span>
              </div>
              <div className="faq-answer">
                Yes! We offer maintenance packages for regular updates, bug fixes, and new features. We can
                also
                provide training so your team can handle minor updates. All apps need periodic updates for
                OS
                compatibility, security, and feature improvements. Our post-launch support ensures your app
                stays current and performs well.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question" onClick={toggleFaq}>
                What happens if my app gets rejected by Apple or Google?
                <span className="faq-icon">▼</span>
              </div>
              <div className="faq-answer">
                Rejections happen, but we're experienced in handling them. We follow all store guidelines
                during
                development to minimize rejections. If it does get rejected, we'll address the specific
                issues
                cited, make necessary changes, and resubmit at no extra cost. We work with you until your
                app is
                successfully published.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question" onClick={toggleFaq}>
                How do you handle push notifications?
                <span className="faq-icon">▼</span>
              </div>
              <div className="faq-answer">
                We implement push notifications using Firebase Cloud Messaging (FCM) for Android and Apple
                Push
                Notification Service (APNS) for iOS. This includes setting up notification infrastructure,
                designing notification UI, handling user permissions, and providing you with an admin
                interface
                to send notifications. We can also integrate with services like OneSignal for advanced
                features.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question" onClick={toggleFaq}>
                Can you migrate my existing web app to mobile?
                <span className="faq-icon">▼</span>
              </div>
              <div className="faq-answer">
                Yes! We can convert your web application into a mobile app. Depending on your web app's
                architecture, we might build a native app that uses your existing APIs, create a Progressive
                Web
                App (PWA), or use a hybrid approach. We'll assess your current app and recommend the best
                strategy to deliver an optimal mobile experience while leveraging your existing backend.
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
};

export default MobileAppDevelopment;