import React from 'react';
import './commonForm.css';

const WebDevelopmentForm: React.FC = () => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('app-alert', {
      detail: {
        type: 'success',
        title: 'Form Submitted',
        message: 'Thank you for your interest! We will contact you within 24 hours.'
      }
    }));
    e.currentTarget.reset();
  };

  return (
    <section className="contact-section" id="contact">
      <div className="container">
        <h2 style={{ fontSize: '2.5em', marginBottom: '20px' }}>Ready to Start Your Project?</h2>
        <p style={{ fontSize: '1.2em', marginBottom: '30px' }}>Let's discuss your requirements and turn your vision
          into
          reality</p>

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
              <label htmlFor="phone">Phone Number</label>
              <input type="tel" id="phone" name="phone" required placeholder="e.g. +1 (555) 000-0000" />
            </div>

            <div className="form-group">
              <label htmlFor="company">Company Name</label>
              <input type="text" id="company" name="company" required placeholder="e.g. Acme Corp" />
            </div>

            <div className="form-group">
              <label htmlFor="message">Tell Us About Your Project *</label>
              <textarea id="message" name="message" required
                placeholder="Describe your web app idea, key features, timeline, budget, etc."></textarea>
            </div>

            <button type="submit" className="submit-button">Send Message</button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default WebDevelopmentForm;