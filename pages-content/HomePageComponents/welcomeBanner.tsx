import './welcomeBanner.css';

const WelcomeBanner = () => {
  return (
    <section className="welcome-section">
      <div className="welcome-container">
        <p className="welcome-tag">Greetings & Welcome</p>
        <h2 className="welcome-title">BR Publications</h2>
        <div className="title-underline"></div>
        <p className="welcome-text">
          <strong>BR Publications</strong> is dedicated to publishing a diverse range of high-quality academic and professional works for readers and researchers with a passion for knowledge across multidisciplinary domains. Our publications span <strong>Sciences, Medical Sciences, Engineering, Technology, Humanities</strong> and more—reflecting our commitment to academic excellence and intellectual growth.
        </p>
      </div>
    </section>
  );
};

export default WelcomeBanner;