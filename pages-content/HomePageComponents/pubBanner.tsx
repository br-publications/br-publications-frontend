import './pubBanner.css';

const PubBanner = () => {
  return (
    <section className="pub-banner">
      <div className="pub-content">
        <h2><span className="highlight-text">BR</span> Publications</h2>
        <span className="pub-subtitle">Publishing opportunities across 250+ topics in five major domains</span>
        <div className="pub-domains">
          <span>Business & Management</span>
          <span>Education & Social Sciences</span>
          <span>Engineering Science</span>
          <span>Scientific, Technical & Medical</span>
          <span>Interdisciplinary Sciences</span>
        </div>
        <a href="#" className="discover-btn">Discover More</a>
      </div>
    </section>
  );
};

export default PubBanner;