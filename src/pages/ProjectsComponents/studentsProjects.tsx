import React, { useEffect } from 'react';
import './studentsProjects.css';
import './commonForm.css';

const StudentsProjects: React.FC = () => {
  useEffect(() => {
    // Set minimum date for deadline picker to today
    const deadlineInput = document.getElementById('deadline') as HTMLInputElement;
    if (deadlineInput) {
      deadlineInput.min = new Date().toISOString().split('T')[0];
    }
  }, []);

  const toggleFaq = (e: React.MouseEvent<HTMLDivElement>) => {
    const parent = e.currentTarget.parentElement;
    if (parent) {
      parent.classList.toggle('active');
    }
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.querySelector(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('app-alert', {
      detail: {
        type: 'success',
        title: 'Requirements Submitted',
        message: 'Thank you for your interest! We will contact you within 24 hours with a detailed proposal.'
      }
    }));
    e.currentTarget.reset();
  };

  return (
    <section className="main-content" id="main-content">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h1>Student Software Projects</h1>
          <p>Academic project assistance for final year, semester projects, and assignments with professional
            guidance
            and quality deliverables</p>
          <a href="#contact" className="cta-button" onClick={(e) => scrollToSection(e, '#contact')}>Get Project Help</a>
        </div>
      </section>

      {/* Overview Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">We Help Students Succeed</h2>
          <p className="section-subtitle">Professional assistance for your academic software projects - from concept
            to
            completion, with thorough documentation and presentation support.</p>

          <div className="overview-grid">
            <div className="overview-card">
              <h3>What We Offer</h3>
              <ul>
                <li>Final year projects (BE/BTech/MCA)</li>
                <li>Semester projects & assignments</li>
                <li>Research paper implementations</li>
                <li>Mini projects & prototypes</li>
                <li>Industrial training projects</li>
                <li>Internship project support</li>
              </ul>
            </div>
            <div className="overview-card">
              <h3>Complete Package</h3>
              <ul>
                <li>Working software/application</li>
                <li>Complete documentation</li>
                <li>PPT presentation</li>
                <li>Project report (IEEE/university format)</li>
                <li>Code explanation & walkthrough</li>
                <li>Viva preparation assistance</li>
              </ul>
            </div>
            <div className="overview-card">
              <h3>Why Students Choose Us</h3>
              <ul>
                <li>Affordable student-friendly pricing</li>
                <li>On-time delivery guaranteed</li>
                <li>Latest technologies & trends</li>
                <li>University guideline compliance</li>
                <li>Plagiarism-free documentation</li>
                <li>Ongoing project support</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Project Categories */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Project Categories</h2>
          <p className="section-subtitle">Wide range of project types across different domains and technologies</p>

          <div className="categories-grid">
            <div className="category-card">
              <h4>Web Development</h4>
              <p>Full-stack web applications with modern frameworks</p>
              <ul>
                <li>E-commerce platforms</li>
                <li>Social networking sites</li>
                <li>Online learning systems</li>
                <li>Hospital/college management</li>
                <li>Booking & reservation systems</li>
              </ul>
            </div>

            <div className="category-card">
              <h4>Mobile Apps</h4>
              <p>Android/iOS apps for academic projects</p>
              <ul>
                <li>Utility applications</li>
                <li>Educational apps</li>
                <li>Location-based services</li>
                <li>Healthcare apps</li>
                <li>Campus connect apps</li>
              </ul>
            </div>

            <div className="category-card">
              <h4>Machine Learning & AI</h4>
              <p>ML/AI projects with practical implementations</p>
              <ul>
                <li>Prediction systems</li>
                <li>Recommendation engines</li>
                <li>Image/speech recognition</li>
                <li>Chatbots & NLP projects</li>
                <li>Data analysis projects</li>
              </ul>
            </div>

            <div className="category-card">
              <h4>Data Science & Analytics</h4>
              <p>Data-driven projects with visualizations</p>
              <ul>
                <li>Big data analytics</li>
                <li>Data mining projects</li>
                <li>Dashboard & reporting tools</li>
                <li>Statistical analysis</li>
                <li>Business intelligence projects</li>
              </ul>
            </div>

            <div className="category-card">
              <h4>IoT & Embedded</h4>
              <p>Hardware-software integration projects</p>
              <ul>
                <li>Smart home automation</li>
                <li>Sensor-based monitoring</li>
                <li>Arduino/Raspberry Pi projects</li>
                <li>Industrial automation</li>
                <li>Wearable devices</li>
              </ul>
            </div>

            <div className="category-card">
              <h4>Blockchain & Security</h4>
              <p>Emerging technology projects</p>
              <ul>
                <li>Blockchain applications</li>
                <li>Cryptocurrency systems</li>
                <li>Cybersecurity tools</li>
                <li>Encryption systems</li>
                <li>Secure authentication</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Our Project Process</h2>
          <p className="section-subtitle">Simple, transparent process designed specifically for student timelines and
            academic requirements</p>

          <div className="process-timeline">
            <div className="process-step">
              <div className="process-number">1</div>
              <div className="process-content">
                <h3>Requirement Understanding</h3>
                <p>Share your project requirements, university guidelines, submission deadline, and any
                  specific
                  instructions from your guide/professor. We'll discuss your ideas and suggest
                  improvements if
                  needed.</p>
                <span className="process-duration">Duration: 1 day</span>
              </div>
            </div>

            <div className="process-step">
              <div className="process-number">2</div>
              <div className="process-content">
                <h3>Proposal & Quotation</h3>
                <p>We provide a detailed project proposal with technology stack, features, timeline, and
                  pricing. Once you approve, we proceed with an initial payment and project kickoff.</p>
                <span className="process-duration">Duration: 1-2 days</span>
              </div>
            </div>

            <div className="process-step">
              <div className="process-number">3</div>
              <div className="process-content">
                <h3>System Design & Planning</h3>
                <p>Create system architecture, database design, flowcharts, and DFDs. Share initial
                  documentation drafts for your review and guide approval if needed.</p>
                <span className="process-duration">Duration: 2-3 days</span>
              </div>
            </div>

            <div className="process-step">
              <div className="process-number">4</div>
              <div className="process-content">
                <h3>Development</h3>
                <p>Build your project with regular updates and demo sessions. You can test features as
                  they're
                  completed and request changes during development.</p>
                <span className="process-duration">Duration: 1-4 weeks (based on complexity)</span>
              </div>
            </div>

            <div className="process-step">
              <div className="process-number">5</div>
              <div className="process-content">
                <h3>Testing & Refinement</h3>
                <p>Thorough testing of all features, bug fixes, and final refinements based on your
                  feedback. We
                  ensure everything works perfectly before delivery.</p>
                <span className="process-duration">Duration: 2-3 days</span>
              </div>
            </div>

            <div className="process-step">
              <div className="process-number">6</div>
              <div className="process-content">
                <h3>Documentation & Report</h3>
                <p>Complete project documentation in your university format including abstract, modules
                  description, screenshots, code explanations, and bibliography.</p>
                <span className="process-duration">Duration: 3-5 days</span>
              </div>
            </div>

            <div className="process-step">
              <div className="process-number">7</div>
              <div className="process-content">
                <h3>Presentation & Viva Support</h3>
                <p>Create PowerPoint presentation, provide project walkthrough, explain code and concepts,
                  and
                  help you prepare for viva/presentation.</p>
                <span className="process-duration">Duration: 2 days + ongoing support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">What We Need From You</h2>
          <p className="section-subtitle">Information required to create a successful project that meets all your
            academic
            requirements</p>

          <div className="requirements-list">
            <div className="requirement-item">
              <h4>1. Project Topic & Abstract</h4>
              <p><strong>What:</strong> Your project title, brief description of what you want to build, and
                the
                problem it solves.<br />
                <strong>Format:</strong> Text document explaining your project idea or share approved
                synopsis
                if available.
              </p>
            </div>

            <div className="requirement-item">
              <h4>2. University Guidelines</h4>
              <p><strong>What:</strong> Your university's project guidelines, documentation format
                requirements,
                report template, and evaluation criteria.<br />
                <strong>Format:</strong> PDF of university guidelines or share specific requirements from
                your
                department.
              </p>
            </div>

            <div className="requirement-item">
              <h4>3. Feature Requirements</h4>
              <p><strong>What:</strong> List of all features and functionalities you want in your project.
                Mention
                must-have features vs nice-to-have features.<br />
                <strong>Format:</strong> Bullet points or document listing all desired features and user
                roles.
              </p>
            </div>

            <div className="requirement-item">
              <h4>4. Technology Preferences</h4>
              <p><strong>What:</strong> Any specific programming languages, frameworks, or tools required by
                your
                university or guide. If no preference, we'll recommend the best options.<br />
                <strong>Format:</strong> List of technologies or let us suggest based on your project
                requirements.
              </p>
            </div>

            <div className="requirement-item">
              <h4>5. Submission Deadline</h4>
              <p><strong>What:</strong> Your project submission date, presentation/viva date, and any interim
                submission deadlines.<br />
                <strong>Format:</strong> Clear dates so we can plan timeline accordingly.
              </p>
            </div>

            <div className="requirement-item">
              <h4>6. Reference Materials</h4>
              <p><strong>What:</strong> Any research papers, reference projects, or similar applications you'd
                like us to study for your project.<br />
                <strong>Format:</strong> Links, PDFs, or descriptions of reference materials.
              </p>
            </div>

            <div className="requirement-item">
              <h4>7. Guide/Professor Requirements</h4>
              <p><strong>What:</strong> Specific instructions or preferences from your project guide if any
                (documentation style, specific algorithms, etc.).<br />
                <strong>Format:</strong> Email or document with guide's requirements.
              </p>
            </div>

            <div className="requirement-item">
              <h4>8. Budget & Payment Terms</h4>
              <p><strong>What:</strong> Your budget range for the project. We offer student-friendly pricing
                and
                flexible payment options.<br />
                <strong>Format:</strong> Discussion during initial consultation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Project Timelines</h2>
          <p className="section-subtitle">Typical completion times based on project complexity - we work with your
            academic deadlines</p>

          <div className="overview-grid">
            <div className="overview-card">
              <h3>Mini Projects</h3>
              <p><strong>Duration:</strong> 1-2 weeks</p>
              <p style={{ marginTop: '15px' }}>Simple applications with basic features, suitable for semester
                projects
                or assignments.</p>
            </div>
            <div className="overview-card">
              <h3>Standard Projects</h3>
              <p><strong>Duration:</strong> 3-4 weeks</p>
              <p style={{ marginTop: '15px' }}>Medium complexity projects with multiple modules, database, and
                user
                management features.</p>
            </div>
            <div className="overview-card">
              <h3>Final Year Projects</h3>
              <p><strong>Duration:</strong> 4-8 weeks</p>
              <p style={{ marginTop: '15px' }}>Complex projects with advanced features, research components, and
                comprehensive documentation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Deliverables Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Complete Project Package</h2>
          <p className="section-subtitle">Everything you need for successful project submission, presentation, and
            viva
          </p>

          <div className="deliverables-grid">
            <div className="deliverable-card">
              <h4>Working Application</h4>
              <ul>
                <li>Fully functional software/app</li>
                <li>All features implemented</li>
                <li>Tested and bug-free</li>
                <li>Ready for demonstration</li>
                <li>Installation support provided</li>
              </ul>
            </div>

            <div className="deliverable-card">
              <h4>Source Code</h4>
              <ul>
                <li>Complete project code</li>
                <li>Well-commented code</li>
                <li>Organized file structure</li>
                <li>README file included</li>
                <li>Easy to understand</li>
              </ul>
            </div>

            <div className="deliverable-card">
              <h4>Project Report</h4>
              <ul>
                <li>University format compliance</li>
                <li>Abstract & introduction</li>
                <li>Literature survey</li>
                <li>System design & architecture</li>
                <li>Implementation details</li>
                <li>Testing & results</li>
                <li>Conclusion & future scope</li>
              </ul>
            </div>

            <div className="deliverable-card">
              <h4>Documentation</h4>
              <ul>
                <li>SRS document</li>
                <li>System diagrams (DFD, ER, etc.)</li>
                <li>Flowcharts</li>
                <li>UML diagrams</li>
                <li>Database schemas</li>
                <li>User manual</li>
              </ul>
            </div>

            <div className="deliverable-card">
              <h4>Presentation</h4>
              <ul>
                <li>PowerPoint slides</li>
                <li>Project overview</li>
                <li>Screenshots & demo flow</li>
                <li>Technical architecture</li>
                <li>Results & conclusion</li>
                <li>Professional design</li>
              </ul>
            </div>

            <div className="deliverable-card">
              <h4>Support Materials</h4>
              <ul>
                <li>Installation guide</li>
                <li>Setup instructions</li>
                <li>Database scripts</li>
                <li>Configuration files</li>
                <li>Video demonstration (if needed)</li>
                <li>Viva question preparation</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Student Support</h2>
          <p className="section-subtitle">Comprehensive support throughout your project journey and beyond</p>

          <div className="overview-grid">
            <div className="overview-card">
              <h3>During Development</h3>
              <ul>
                <li>Regular progress updates</li>
                <li>Demo sessions</li>
                <li>Clarify doubts anytime</li>
                <li>Changes & modifications</li>
                <li>Guide feedback incorporation</li>
              </ul>
            </div>
            <div className="overview-card">
              <h3>Before Submission</h3>
              <ul>
                <li>Final testing assistance</li>
                <li>Document formatting check</li>
                <li>Presentation review</li>
                <li>Project walkthrough</li>
                <li>Last-minute adjustments</li>
              </ul>
            </div>
            <div className="overview-card">
              <h3>Viva & Presentation</h3>
              <ul>
                <li>Project explanation session</li>
                <li>Possible viva questions</li>
                <li>Concept clarification</li>
                <li>Demo troubleshooting</li>
                <li>Technical query support</li>
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
                How much do student projects typically cost?
                <span className="faq-icon">▼</span>
              </div>
              <div className="faq-answer">
                Project costs vary based on complexity, features, and technology. Simple projects start from
                affordable rates suitable for students. We offer student-friendly pricing and flexible
                payment
                plans. Contact us with your requirements for an accurate quote. We understand student
                budgets
                and work within reasonable pricing.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question" onClick={toggleFaq}>
                Can you complete my project within my deadline?
                <span className="faq-icon">▼</span>
              </div>
              <div className="faq-answer">
                Yes! We work according to your submission deadline. Share your deadline during the initial
                discussion, and we'll confirm if it's feasible. For urgent projects, we can expedite
                development
                with additional resources. We've successfully delivered hundreds of projects on time for
                students.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question" onClick={toggleFaq}>
                Will the documentation follow my university format?
                <span className="faq-icon">▼</span>
              </div>
              <div className="faq-answer">
                Absolutely! We prepare documentation strictly according to your university's guidelines.
                Share
                your university's project report format, and we'll ensure complete compliance including page
                layout, font styles, section ordering, and citation format. We're experienced with formats
                from
                various universities across India.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question" onClick={toggleFaq}>
                How will you help me understand the project for viva?
                <span className="faq-icon">▼</span>
              </div>
              <div className="faq-answer">
                We provide detailed project walkthroughs explaining every module, code logic, and technical
                concepts. You'll get documentation that clearly explains everything, plus we'll have Q&A
                sessions where you can ask anything. We'll also prepare you with likely viva questions and
                their
                answers so you can confidently present your project.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question" onClick={toggleFaq}>
                Is the project plagiarism-free and original?
                <span className="faq-icon">▼</span>
              </div>
              <div className="faq-answer">
                Yes! Each project is developed specifically for you with original code and unique
                documentation.
                We don't reuse projects or copy from existing sources. Your documentation will pass
                plagiarism
                checks. We ensure your project is genuinely yours and meets academic integrity standards.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question" onClick={toggleFaq}>
                Can I request changes during development?
                <span className="faq-icon">▼</span>
              </div>
              <div className="faq-answer">
                Yes! We encourage feedback during development. You can request reasonable changes and
                modifications as we progress. Major scope changes may affect timeline and cost, but minor
                adjustments and refinements are included. We want you to be completely satisfied with the
                final
                project.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question" onClick={toggleFaq}>
                What if my guide asks for modifications?
                <span className="faq-icon">▼</span>
              </div>
              <div className="faq-answer">
                No problem! We're happy to incorporate feedback from your project guide or professor. Just
                share
                their suggestions, and we'll make the necessary modifications. This is a common scenario,
                and we
                handle it smoothly. Guide feedback is actually helpful in making the project better.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question" onClick={toggleFaq}>
                Do you provide source code with comments?
                <span className="faq-icon">▼</span>
              </div>
              <div className="faq-answer">
                Yes! All code is well-commented with explanations of what each section does. This makes it
                easier for you to understand and explain during viva. We also provide a README file with
                setup
                instructions and an overview of the project structure. You'll have complete access to
                everything.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question" onClick={toggleFaq}>
                Can you help with IEEE paper implementation projects?
                <span className="faq-icon">▼</span>
              </div>
              <div className="faq-answer">
                Yes! If your project is based on an IEEE research paper, share the paper with us. We'll
                study
                it, implement the proposed system or algorithm, and create your project based on it. We have
                experience implementing various research papers in machine learning, data mining, and other
                domains.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question" onClick={toggleFaq}>
                What payment methods do you accept?
                <span className="faq-icon">▼</span>
              </div>
              <div className="faq-answer">
                We accept various payment methods including bank transfer, UPI, online payment gateways, and
                more. Payment is typically split into milestones - initial advance when starting,
                mid-project
                payment after key features, and final payment upon delivery. We can discuss a payment plan
                that
                works for your situation.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section" id="contact">
        <div className="container">
          <h2 style={{ fontSize: '25px', marginBottom: '20px' }}>Ready to Start Your Project?</h2>
          <p style={{ fontSize: '17px', marginBottom: '30px' }}>Let's discuss your requirements and deliver a
            successful
            project</p>

          <div className="contact-form">
            <form id="contactForm" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Your Name *</label>
                <input type="text" id="name" name="name" required placeholder="e.g. John Doe" />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input type="email" id="email" name="email" required placeholder="e.g. john@example.com" />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input type="tel" id="phone" name="phone" required placeholder="e.g. +1 (555) 000-0000" />
              </div>

              <div className="form-group">
                <label htmlFor="university">University/College Name *</label>
                <input type="text" id="university" name="university" required placeholder="e.g. University of Technology" />
              </div>

              <div className="form-group">
                <label htmlFor="projectType">Project Type *</label>
                <select id="projectType" name="projectType" required>
                  <option value="">Select Project Type</option>
                  <option value="final-year">Final Year Project</option>
                  <option value="semester">Semester Project</option>
                  <option value="mini">Mini Project</option>
                  <option value="internship">Internship Project</option>
                  <option value="assignment">Assignment</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="deadline">Submission Deadline *</label>
                <input type="date" id="deadline" name="deadline" required />
              </div>

              <div className="form-group">
                <label htmlFor="message">Project Requirements *</label>
                <textarea id="message" name="message" required
                  placeholder="Describe your project topic, required features, technologies, university guidelines, etc."></textarea>
              </div>

              <button type="submit" className="submit-button">Submit Requirements</button>
            </form>
          </div>
        </div>
      </section>
    </section>
  );
};

export default StudentsProjects;