import { ChevronRight, User, BookOpen, Lightbulb, FileText, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './subjects.css';

const Subjects = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  const handleCategoryClick = (e: React.MouseEvent<HTMLAnchorElement>, category: string) => {
    e.preventDefault();
    navigate('/bookchapters', { state: { category } });
  };

  useEffect(() => {
    const user = sessionStorage.getItem('user') || localStorage.getItem('user');
    setIsLoggedIn(!!user);
  }, []);

  return (
    <section className="subjects-section">
      <div className="subjects-container">
        <div className="subjects-box">
          <h3>Subjects</h3>
          <ul className="subject-list">
            <li>
              <a href="#" onClick={(e) => handleCategoryClick(e, 'Engineering & Management')}>
                Engineering & Management <ChevronRight size={12} />
              </a>
            </li>
            <li>
              <a href="#" onClick={(e) => handleCategoryClick(e, 'Medical & Health Sciences')}>
                Medical & Health Sciences <ChevronRight size={12} />
              </a>
            </li>
            <li>
              <a href="#" onClick={(e) => handleCategoryClick(e, 'Interdisciplinary Sciences')}>
                Interdisciplinary Sciences <ChevronRight size={12} />
              </a>
            </li>
          </ul>
          <a
            href={isLoggedIn ? '#' : '/login'}
            className="subject-login-btn"
            style={isLoggedIn ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            onClick={(e) => isLoggedIn && e.preventDefault()}
          >
            <User size={14} /> Login
          </a>
        </div>

        <div className="action-buttons">
          <a href="https://brpublications.com/index.php/James/about/submissions" target="_blank" rel="noopener noreferrer" className="action-card">
            <BookOpen className="icon" size={20} />
            <span>Submit a Journal Manuscript</span>
          </a>
          <Link to="/book-chapter-manuscript" className="action-card">
            <Lightbulb className="icon" size={20} />
            <span>Submit a Book Proposal</span>
          </Link>
          <Link to="/book-manuscript" className="action-card">
            <FileText className="icon" size={20} />
            <span>Submit a textbook</span>
          </Link>
          <Link to="/ipr" className="action-card">
            <Shield className="icon" size={20} />
            <span>IPR Services</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Subjects;