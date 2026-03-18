import React from 'react';
import './commonForm.css';

const StudentsInternshipForm: React.FC = () => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('app-alert', {
      detail: {
        type: 'success',
        title: 'Application Submitted',
        message: 'Thank you for applying! We will contact you within 24 hours with further details about the internship program.'
      }
    }));
    e.currentTarget.reset();
  };

  return (
    <section className="contact-section" id="contact">
      <div className="container">
        <h2 style={{ fontSize: '25px', marginBottom: '20px' }}>Ready to Start Your Internship Journey?</h2>
        <p style={{ fontSize: '17px', marginBottom: '30px' }}>Apply now and take the first step towards industry
          readiness</p>

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
              <label htmlFor="college">College/University Name *</label>
              <input type="text" id="college" name="college" required placeholder="e.g. University of Technology" />
            </div>

            <div className="form-group">
              <label htmlFor="course">Course (B.Tech/B.Sc/BCA) *</label>
              <input type="text" id="course" name="course" required placeholder="e.g. B.Tech Computer Science" />
            </div>

            <div className="form-group">
              <label htmlFor="year">Current Year of Study *</label>
              <select id="year" name="year" required>
                <option value="">Select Year</option>
                <option value="1st-year">1st Year</option>
                <option value="2nd-year">2nd Year</option>
                <option value="3rd-year">3rd Year</option>
                <option value="4th-year">4th Year / Final Year</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="domain">Preferred Domain *</label>
              <select id="domain" name="domain" required>
                <option value="">Select Domain</option>
                <option value="deep-learning">Deep Learning</option>
                <option value="computer-vision">Computer Vision (CV)</option>
                <option value="nlp">Natural Language Processing (NLP)</option>
                <option value="gen-ai">Generative AI & LLMs</option>
                <option value="data-engineering">Data Engineering</option>
                <option value="web-dev">Web Development (Full Stack)</option>
                <option value="iot">Internet of Things (IoT)</option>
                <option value="responsible-ai">Responsible AI</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="message">Why do you want to join this internship? *</label>
              <textarea id="message" name="message" required
                placeholder="Tell us about your interests, goals, and what you hope to achieve through this internship..."></textarea>
            </div>

            <button type="submit" className="submit-button">Submit Application</button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default StudentsInternshipForm;