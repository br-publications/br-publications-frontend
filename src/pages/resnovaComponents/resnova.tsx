import React from 'react';
import { Link } from 'react-router-dom';
import './resNova.css';

const ResNova: React.FC = () => {

  const handleSidebarClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
  };

  return (
    <main className="content">
      {/* ResNova Page */}
      <section id="resNovaPage" className="resNova-page">
        <section className="resNova-hero">
          <h1>BR ResNova Academic Press</h1>
          <p>Empowering Knowledge. Inspiring Discovery</p>
        </section>

        <div className="resNova-wrapper">
          {/* Sidebar */}
          <aside className="resNova-sidebar">
            <div className="sidebar-card">
              <h3>🤝 Work With Us</h3>
              <ul>
                <li><Link to="/book-chapter-manuscript"><i className="fas fa-angle-right"></i> Contribute a Book Chapter</Link></li>
                <li><Link to="/book-manuscript"><i className="fas fa-angle-right"></i> Publish Your Text Book</Link></li>
                <li><Link to="/recruitment?role=editor"><i className="fas fa-angle-right"></i> Join as a Book Editor</Link></li>
                <li><Link to="/recruitment?role=reviewer"><i className="fas fa-angle-right"></i> Join as a Reviewer</Link></li>
              </ul>
            </div>
          </aside>

          {/* Main Content */}
          <div className="resNova-container">
            {/* Overview Section */}
            <section className="resNova-section" id="resNova-overview">
              <div className="resNova-section-intro">
                BR ResNova Academic Press is a premier platform dedicated to advancing scholarly
                communication,
                fostering innovation, and disseminating high-quality academic knowledge globally. With a
                focus on
                research excellence and interdisciplinary collaboration, the press publishes edited books,
                book
                chapters, and academic volumes across domains such as Engineering, Science, Technology,
                Management,
                Humanities, and Education. We serve as a bridge between researchers, educators, and industry
                experts, transforming innovative ideas into impactful academic contributions that inspire
                learning
                and global progress.
              </div>

              <div className="resNova-section-header" id="resNova-mission">
                <div className="resNova-section-icon">🎯</div>
                <div className="resNova-section-title-wrapper">
                  <h2>Our Mission</h2>
                </div>
              </div>

              <div className="resNova-section-intro">
                To promote excellence in research and academic writing by providing an inclusive and
                credible
                platform for scholars to publish, collaborate, and share their expertise with the global
                research
                community.
              </div>

              <div className="benefits-section">
                <h3>Committee on Publication Ethics (COPE)</h3>
                <div className="benefits-grid">
                  <div className="benefit-item">
                    <div className="benefit-text">
                      <h4>Trustee Board</h4>
                      <p>Dr.V.Bhoopathy Rajan<br />Professor, Department of CSE,<br />Sree Rama
                        Engineering College, AP,India<br /></p>
                      <a target="_blank" rel="noopener noreferrer" href="mailto:v.bhoopathy@sreerama.ac.in">v.bhoopathy@sreerama.ac.in</a>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <div className="benefit-text">
                      <h4>Council (Governing Council) & Chair</h4>
                      <p>Dr.R.Rajagopal<br />Professor, Department of CSE,<br />Sree Rama Engineering
                        College, AP,India<br /></p>
                      <a target="_blank" rel="noopener noreferrer" href="mailto:rajagopal.r@sreerama.ac.in">rajagopal.r@sreerama.ac.in</a>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <div className="benefit-text">
                      <h4>Executive Team</h4>
                      <p>Polinpapilinho F. Katina, Ph.D., CPEM<br />Assistant Professor, Informatics and
                        Engineering Systems<br />University of South Carolina Upstate,<br />Spartanburg,
                        SC 29303 South Carolina, USA<br /></p>
                      <a target="_blank" rel="noopener noreferrer" href="mailto:PKATINA@uscupstate.edu">PKATINA@uscupstate.edu</a>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <div className="benefit-text">
                      <h4>Executive Team</h4>
                      <p>Dr. Hatem S. A. Hamatta<br />Department of Applied Sciences, Aqaba University
                        College,<br />Al Balqa Applied University, Aqaba, Jordan.<br /></p>
                      <a target="_blank" rel="noopener noreferrer" href="mailto:hatem@bau.edu.jo">hatem@bau.edu.jo</a>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <div className="benefit-text">
                      <h4>Executive Team</h4>
                      <p>Dr.Shams Tabrez Siddiqui<br />Department of computer science,<br />College of
                        computer science and information technology,<br />Jazan University Jazan,
                        Saudi Arabia<br /></p>
                      <a target="_blank" rel="noopener noreferrer" href="mailto:stabrez@jazanu.edu.sa">stabrez@jazanu.edu.sa</a>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <div className="benefit-text">
                      <h4>Executive Team</h4>
                      <p>Dr.S.Prabu<br />Associate Professor, Department of Banking
                        Technology<br />Pondicherry University, India<br /></p>
                      <a target="_blank" rel="noopener noreferrer" href="mailto:prabu.sevugan@pondiuni.ac.in">prabu.sevugan@pondiuni.ac.in</a>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <div className="benefit-text">
                      <h4>Executive Team</h4>
                      <p>Dr.Roseline Jesudas,<br />Professor, Department of Languages and Translation,
                        College of Humanities and Social Sciences,<br />Northern Border University,
                        Arar, Kingdom of Saudi Arabia<br /></p>
                      <a target="_blank" rel="noopener noreferrer" href="mailto:roseline.jesudas@nbu.edu.sa">roseline.jesudas@nbu.edu.sa</a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="resNova-section-header" id="resNova-areas">
                <div className="resNova-section-title-wrapper">
                  <h2>BR ResNova Academic Press welcomes book chapters and edited volumes in the following
                    areas</h2>
                </div>
              </div>

              <div className="services-grid">
                <div className="service-card">
                  <h3>Artificial Intelligence, Machine Learning & Data Science</h3>
                </div>
                <div className="service-card">
                  <h3>Internet of Things (IoT), Smart Systems, and Automation</h3>
                </div>
                <div className="service-card">
                  <h3>Computer Science, Cybersecurity & Cloud Computing</h3>
                </div>
                <div className="service-card">
                  <h3>Electrical, Electronics & Communication Engineering</h3>
                </div>
                <div className="service-card">
                  <h3>Mechanical, Civil, and Environmental Engineering</h3>
                </div>
                <div className="service-card">
                  <h3>Management, Entrepreneurship, and Innovation Studies</h3>
                </div>
                <div className="service-card">
                  <h3>Education Technology, Digital Learning, and Higher Education</h3>
                </div>
                <div className="service-card">
                  <h3>Interdisciplinary and Emerging Research Domains</h3>
                </div>
              </div>
            </section>

            {/* Author Guidelines Section */}
            <section className="resNova-section" id="guidelines">
              <div className="resNova-section-header">
                <div className="resNova-section-icon">📋</div>
                <div className="resNova-section-title-wrapper">
                  <h2>Author Guidelines</h2>
                  <p className="resNova-section-subtitle">Publication Ethics Statement</p>
                </div>
              </div>

              <div className="resNova-section-intro">
                BR ResNova Academic Press is committed to upholding the highest ethical standards in
                scholarly
                publishing. We follow the core practices recommended by the Committee on Publication Ethics
                (COPE)
                and adhere to international publication standards.
              </div>

              <div className="services-grid">
                <div className="service-card">
                  <h3>Authorship and Originality</h3>
                  <p>Authors must ensure that all submissions are original, unpublished, and not under
                    review
                    elsewhere. Proper acknowledgment should be given to all contributors and funding
                    sources.</p>
                </div>
                <div className="service-card">
                  <h3>Ethical Standards</h3>
                  <p>Plagiarism, falsification of data, or use of AI-generated content without disclosure
                    are
                    strictly prohibited. All manuscripts undergo plagiarism screening before review.</p>
                </div>
                <div className="service-card">
                  <h3>Peer Review Policy</h3>
                  <p>All submissions undergo double-blind peer review to ensure quality, accuracy, and
                    scholarly
                    rigor. Reviewers maintain confidentiality and objectivity throughout the process.
                  </p>
                </div>
                <div className="service-card">
                  <h3>Diversity and Inclusion</h3>
                  <p>We value diversity of thought and representation. No discrimination is tolerated
                    based on
                    gender, age, ethnicity, religion, nationality, or affiliation.</p>
                </div>
                <div className="service-card">
                  <h3>Copyright and Licensing</h3>
                  <p>Authors sign an Author Agreement Form confirming originality and granting BR
                    Publications
                    the right to publish and distribute the work.</p>
                </div>
                <div className="service-card">
                  <h3>Open Access Policy</h3>
                  <p>We support open access dissemination to maximize visibility, citations, and impact
                    within
                    the global research community.</p>
                </div>
              </div>

              <div className="benefits-section">
                <h3>Publication Process</h3>
                <div className="benefits-grid">
                  <div className="benefit-item">
                    <div className="benefit-text">
                      <h4>Abstract Submission</h4>
                      <p>Authors submit abstracts for initial screening</p>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <div className="benefit-text">
                      <h4>Chapter Review</h4>
                      <p>Full chapters undergo peer review and revision</p>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <div className="benefit-text">
                      <h4>Formatting</h4>
                      <p>Standardized layout and reference formatting (APA/IEEE)</p>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <div className="benefit-text">
                      <h4>Final Publication</h4>
                      <p>With ISBN, DOI, and Google indexing</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Book Chapter Section */}
            <section className="resNova-section" id="resNova-chapter">
              <div className="resNova-section-header">
                <div className="resNova-section-icon">📚</div>
                <div className="resNova-section-title-wrapper">
                  <h2>Book Chapter Publication Features</h2>
                </div>
              </div>

              <div className="services-grid">
                <div className="service-card">
                  <h3>Peer-Reviewed Process</h3>
                  <p>Each chapter undergoes rigorous double-blind peer review to ensure originality,
                    relevance,
                    and scholarly merit.</p>
                </div>
                <div className="service-card">
                  <h3>ISBN & DOI Registration</h3>
                  <p>All published books carry ISBN numbers, and each chapter is assigned a unique DOI for
                    easy
                    indexing and citation.</p>
                </div>
                <div className="service-card">
                  <h3>Indexing & Visibility</h3>
                  <p>Our publications are indexed in major academic databases to maximize research
                    visibility
                    and impact.</p>
                </div>
                <div className="service-card">
                  <h3>Open Access</h3>
                  <p>Authors can choose open-access publication to make their work freely accessible
                    worldwide.
                  </p>
                </div>
                <div className="service-card">
                  <h3>Author Recognition</h3>
                  <p>Certificates of publication and editorial participation are provided to all
                    contributors.
                  </p>
                </div>
                <div className="service-card">
                  <h3>Global Collaboration</h3>
                  <p>We encourage multi-institutional and international contributions to promote global
                    knowledge exchange.</p>
                </div>
              </div>

              <div className="cta-section">
                <h3>Ready to Publish Your Research?</h3>
                <p>Join our community of scholars and researchers worldwide</p>
                <a href="/book-chapter-manuscript" className="cta-button">Submit Your Book Chapter Manuscript</a>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ResNova;