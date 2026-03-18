import React from 'react';
import './bookPublications.css';

const BookPublications: React.FC = () => {

  return (
    <section id="books-page" className="books-page">
      <section className="books-hero">
        <h1>Book Publications</h1>
      </section>

      <div className="books-wrapper">
        <div className="books-container">
          <section className="books-section" id="books-section">
            <div className="books-section-intro">
              At <strong>BR Publication</strong>, we specialize in <em>delivering comprehensive publishing
                solutions</em> for
              <strong>Researchers, Academicians, Institutions, and Independent Authors</strong>. Whether
              you're publishing a
              <strong>Research Book, Technical Handbook, Conference Proceedings, or Journal</strong> we
              ensure
              a smooth,
              professional, and globally recognized publishing experience.
            </div>

            <div className="books-section-header" id="books-section-header">
              <div className="books-section-title-wrapper">
                <h2>Our Publishing Solutions</h2>
              </div>
            </div>

            <div className="books-section-intro">
              <ul>
                <li>Book Formatting & Typesetting – Expertise in LaTeX and Word for professional
                  presentation.
                </li>
                <li>ISBN & DOI Registration – Secure your publication's unique global identifiers.</li>
                <li>Cover Design & Internal Layout – Creative and aesthetic designs for impactful
                  presentation.
                </li>
                <li>Plagiarism & Grammar Checking – Ensure originality and academic integrity.</li>
                <li>Print-Ready PDF Generation – High-quality output ready for print or digital release.
                </li>
                <li>E-Book Formatting & Distribution – Seamless digital publishing for global access.
                </li>
                <li>Conference Proceedings Publishing – Compilation, editing, and publishing support for
                  academic events.</li>
                <li>Promotion & Indexing Assistance – Enhance visibility and academic reach of your
                  work.</li>
              </ul>
              <br />
              <p>At BR Publication, we are dedicated to helping scholars and
                institutions <strong>publish high-quality
                  academic content</strong> with <strong>global visibility, credibility, and
                    recognition.</strong></p>
            </div>

            <section className="books-guidelines" id="books-guidelines">
              <div className="books-section-header " id="books-section-header-2">
                <div className="books-section-title-wrapper">
                  <h2>Author Guidelines For Textbook Preparation</h2>
                  <p className="books-section-subtitle">BR Publications invites authors to contribute
                    high-quality textbooks that combine academic rigor with practical insight. These
                    guidelines ensure uniformity, clarity, and production readiness of submitted
                    manuscripts.</p>
                </div>
              </div>

              <section className="books-section-inner" id="books-guidelines">
                <div className="books-section-header">
                  <div className="books-section-title-wrapper">
                    <h3><i className="fa fa-book" style={{ color: 'var(--accent-gold)', marginRight: '10px' }}></i> Manuscript Structure</h3>
                  </div>
                </div>

                <div className="books-section-intro" style={{ border: 'none', paddingLeft: 0 }}>
                  Each textbook should follow the sequence below:
                </div>

                <div className="books-services-grid">
                  <div className="books-services-card">
                    <h3>Preliminary Pages</h3>
                    <ul>
                      <li>Title Page <small>(Book Title, Author(s), Affiliation, Contact
                        Details)</small></li>
                      <li>Preface</li>
                      <li>Acknowledgements</li>
                      <li>Table of Contents</li>
                      <li>List of Figures and Tables</li>
                      <li>List of Abbreviations (if applicable)</li>
                    </ul>
                  </div>
                  <div className="books-services-card">
                    <h3>Main Content</h3>
                    <p>Each chapter must include:</p>
                    <ol>
                      <li>Chapter Title and Number</li>
                      <li>Learning Objectives / Outcomes</li>
                      <li>Introduction</li>
                      <li>Detailed Content with appropriate headings and subheadings</li>
                      <li>Illustrations / Diagrams / Case Studies</li>
                      <li>Summary or Key Takeaways</li>
                      <li>Review Questions / Exercises / Problems</li>
                      <li>References (APA 7th or IEEE Style)</li>
                    </ol>
                  </div>
                  <div className="books-services-card">
                    <h3>End Matter</h3>
                    <ul>
                      <li>Glossary of Key Terms</li>
                      <li>Bibliography</li>
                      <li>Index</li>
                      <li>Appendices (if any)</li>
                    </ul>
                  </div>
                  <div className="books-services-card">
                    <h3>Formatting Specifications</h3>
                    <table>
                      <tbody>
                        <tr>
                          <th style={{ width: '30%' }}>Element</th>
                          <th>Specification</th>
                        </tr>
                        <tr>
                          <td>Font</td>
                          <td>Times New Roman, 12 pt</td>
                        </tr>
                        <tr>
                          <td>Line Spacing</td>
                          <td>1.5</td>
                        </tr>
                        <tr>
                          <td>Alignment</td>
                          <td>Justified</td>
                        </tr>
                        <tr>
                          <td>Margins</td>
                          <td>1 inch (2.54 cm) on all sides</td>
                        </tr>
                        <tr>
                          <td>Page Size</td>
                          <td>A4 (210 × 297 mm)</td>
                        </tr>
                        <tr>
                          <td>Headings</td>
                          <td>
                            <table style={{ margin: '10px 0', border: 'none' }}>
                              <tbody>
                                <tr>
                                  <th style={{ background: '#efefef' }}>Level</th>
                                  <th style={{ background: '#efefef' }}>Format</th>
                                </tr>
                                <tr>
                                  <td>Chapter Title</td>
                                  <td>16 pt Bold, Center</td>
                                </tr>
                                <tr>
                                  <td>Section (H1)</td>
                                  <td>14 pt Bold</td>
                                </tr>
                                <tr>
                                  <td>Subsection (H2)</td>
                                  <td>12 pt Italic</td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td>Figures and Tables</td>
                          <td>
                            <ul style={{ margin: 0, paddingLeft: '20px' }}>
                              <li>Number sequentially</li>
                              <li>Captions below figures, above tables</li>
                              <li>High-resolution (300 DPI minimum)</li>
                            </ul>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="books-services-card">
                    <h3>Citation and Referencing</h3>
                    <p>Choose one of the following based on subject discipline:</p>
                    <h4>APA (7th Edition):</h4>
                    <p>Kumar, A., & Reddy, S. (2023). Data Analytics Using Python. BR Publications.</p>
                    <h4>IEEE Format:</h4>
                    <p>[1] A. Kumar and S. Reddy, Data Analytics Using Python, BR Publications, 2023.
                    </p>
                  </div>
                  <div className="books-services-card">
                    <h3>Authorship And Biography</h3>
                    <ul>
                      <li>List all contributors who made significant academic or technical
                        contributions.</li>
                      <li>Include short biographies (50–100 words) with recent photographs.</li>
                      <li>Mention affiliations, email IDs, and ORCID IDs (if available).</li>
                    </ul>
                  </div>
                  <div className="books-services-card">
                    <h3>Originality And Plagiarism</h3>
                    <ul>
                      <li>Manuscripts must be <strong>original and unpublished</strong>.</li>
                      <li>Similarity index should be below <strong>15%</strong> (excluding
                        references).</li>
                      <li>Authors are responsible for obtaining permissions for all third-party
                        materials.</li>
                    </ul>
                  </div>
                  <div className="books-services-card">
                    <h3>Pedagogical Elements</h3>
                    <p>To enhance teaching-learning outcomes, authors are encouraged to include:</p>
                    <ul>
                      <li><strong>Learning Objectives</strong> at the beginning of each chapter.</li>
                      <li><strong>Key Terms</strong> highlighted in bold.</li>
                      <li>Case Studies / Real-world Examples.</li>
                      <li>Review Questions, MCQs, and Assignments for self-assessment.</li>
                      <li>Illustrations, Charts, Flow Diagrams, and Concept Summaries.</li>
                    </ul>
                  </div>
                  <div className="books-services-card">
                    <h3>Submission Requirements</h3>
                    <ul>
                      <li>File Format: <strong>MS Word (.docx)</strong></li>
                      <li>Figures: <strong>.jpg / .png / .tif (300 DPI)</strong></li>
                      <li>Equations: <strong>MS Equation Editor / MathType</strong></li>
                      <li>Submit a single, well-organized file with properly named figures and tables.
                      </li>
                    </ul>
                  </div>
                  <div className="books-services-card">
                    <h3>Review And Proofing Process</h3>
                    <ul>
                      <li>Each submission undergoes <strong>Technical Review, Editorial
                        Review,</strong> and <strong>Plagiarism Screening.</strong></li>
                      <li>Authors will receive <strong>proofs</strong> before final publication.</li>
                      <li>Only minor corrections will be accepted at the proof stage.</li>
                    </ul>
                  </div>
                  <div className="books-services-card">
                    <h3>Copyright And Permissions</h3>
                    <ul>
                      <li>Authors will be asked to sign a <strong>Copyright Transfer Agreement
                        (CTA)</strong> upon acceptance.</li>
                      <li>Permissions must be obtained for any reused material, including text,
                        tables, or figures.</li>
                    </ul>
                  </div>
                  <div className="books-services-card">
                    <h3>Optional Sections</h3>
                    <p>Authors may include:</p>
                    <ul>
                      <li><strong>Instructor Resources</strong> – Slides, Question Banks, Lab Manuals.
                      </li>
                      <li><strong>Student Resources</strong> – Datasets, Code Files, Assignments.</li>
                      <li>Online Supplementary Materials.</li>
                    </ul>
                  </div>
                </div>
              </section>
            </section>

            <div className="books-cta-section">
              <h3>Ready to Publish Your Research?</h3>
              <p>Join our community of scholars and researchers worldwide</p>
              <a href="/book-manuscript" className="books-cta-button">Submit Your Book Manuscript</a>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
};

export default BookPublications;