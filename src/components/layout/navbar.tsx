import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState('Home');
  const navRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { name: 'Home', link: '/' },
    {
      name: 'Journals & Publications',
      dropdown: ['JAMES']
    },
    {
      name: 'ResNova Academic Press',
      link: '/resnova',
      dropdown: ['Author Guidelines', 'Submit Book Chapter', 'Recent Advances']
    },
    {
      name: 'Book Publications',
      link: '/bookpublications',
      dropdown: ['Author Guidelines', 'Submit Book Content', 'Our Products']
    },
    {
      name: 'IPR',
      link: '/ipr',
      dropdown: ['Patent Filing', 'Copyright Registration', 'Trademark']
    },
    {
      name: 'Research & Projects',
      dropdown: ['Web Application Development', 'Mobile Application Development', 'Internship & Projects']
    },
    { name: 'About Us', link: '/about' },
    { name: 'Contact Us', link: '/contact' },
  ];

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close mobile menu on window resize to prevent layout issues on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 940) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll to top on route change unless a specific section (hash) is present
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');

      const scrollToElement = (el: HTMLElement) => {
        const yOffset = -100; // Offset to ensure header is visible
        const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      };

      const element = document.getElementById(id);
      if (element) {
        scrollToElement(element);
      } else {
        // Retry after a short delay to allow content to render
        setTimeout(() => {
          const el = document.getElementById(id);
          if (el) scrollToElement(el);
        }, 100);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  const handleDropdownToggle = (e: React.MouseEvent, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeDropdown === name) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(name);
    }
  };

  const getDropdownLink = (menuName: string, subItem: string) => {
    if (menuName === 'IPR') {
      if (subItem === 'Patent Filing') return '/ipr#patent';
      if (subItem === 'Copyright Registration') return '/ipr#copyright';
      if (subItem === 'Trademark') return '/ipr#trademark';
    }

    if (menuName === 'Research & Projects') {
      if (subItem === 'Web Application Development') return '/webappdevelopment';
      if (subItem === 'Mobile Application Development') return '/mobileappdevelopment';
      if (subItem === 'Internship & Projects') return '/students-internship-program';
    }

    if (menuName === 'Journals & Publications') {
      if (subItem === 'JAMES') return 'https://brpublications.com/index.php/James/index';
    }

    if (menuName === 'ResNova Academic Press') {
      if (subItem === 'Author Guidelines') return '/resnova#guidelines';
      if (subItem === 'Submit Book Chapter') return '/book-chapter-manuscript';
      if (subItem === 'Recent Advances') return '/bookchapters';
    }

    if (menuName === 'Book Publications') {
      if (subItem === 'Author Guidelines') return '/bookpublications#books-guidelines';
      if (subItem === 'Submit Book Content') return '/book-manuscript';
      if (subItem === 'Our Products') return '/books';
    }
    return '#';
  };

  return (
    <>
      {/* Navigation Container */}
      <nav className="bg-[#2c3e50] relative z-[1000]" ref={navRef}>
        <div className="max-w-[1316px] mx-auto px-[18px] flex justify-center items-center min-h-[45px] relative">

          {/* Mobile Toggle */}
          <button
            className="hidden max-[940px]:flex flex-col gap-[4px] bg-transparent border-none cursor-pointer p-[10px] absolute left-[18px]"
            onClick={(e) => {
              e.stopPropagation();
              setIsMobileMenuOpen(!isMobileMenuOpen);
            }}
            aria-label="Toggle Menu"
          >
            <span className="block w-[22px] h-[2px] bg-white"></span>
            <span className="block w-[22px] h-[2px] bg-white"></span>
            <span className="block w-[22px] h-[2px] bg-white"></span>
          </button>

          {/* Navigation List */}
          <ul className={`
            list-none flex items-center gap-[2px] justify-center m-0 p-0
            max-[940px]:hidden
            ${isMobileMenuOpen ? '!flex flex-col absolute top-full left-0 right-0 bg-[#2c3e50] items-stretch justify-start' : ''}
          `}>
            {menuItems.map((item) => {
              const isActive = activeItem === item.name;
              const isOpen = activeDropdown === item.name;
              const hasDropdown = !!item.dropdown;

              return (
                <li
                  key={item.name}
                  className={`relative ${isActive ? 'active' : ''} ${isOpen ? 'open' : ''}`}
                  onMouseEnter={() => window.innerWidth > 940 && setActiveDropdown(item.name)}
                  onMouseLeave={() => window.innerWidth > 940 && setActiveDropdown(null)}
                >
                  {hasDropdown ? (
                    <>
                      {item.link ? (
                        <Link
                          to={item.link}
                          className={`
                            text-white no-underline text-[12px] font-medium px-[14px] py-[11px] opacity-85 transition-all duration-300 flex items-center cursor-pointer border-none bg-transparent whitespace-nowrap
                            hover:opacity-100 hover:bg-[rgba(255,255,255,0.25)]
                            ${isActive || isOpen ? 'opacity-100 bg-[rgba(255,255,255,0.25)]' : ''}
                            max-[940px]:text-[14px] max-[940px]:justify-between max-[940px]:px-[25px] max-[940px]:py-[15px] max-[940px]:w-full
                          `}
                          onClick={() => {
                            setActiveItem(item.name);
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          {item.name}
                          <span
                            className={`ml-[5px] text-[12px] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} p-1`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDropdownToggle(e, item.name);
                            }}
                          >
                            ▾
                          </span>
                        </Link>
                      ) : (
                        <button
                          className={`
                            text-white no-underline text-[12px] font-medium px-[14px] py-[11px] opacity-85 transition-all duration-300 flex items-center cursor-pointer border-none bg-transparent whitespace-nowrap
                            hover:opacity-100 hover:bg-[rgba(255,255,255,0.25)]
                            ${isActive || isOpen ? 'opacity-100 bg-[rgba(255,255,255,0.25)]' : ''}
                            max-[940px]:text-[14px] max-[940px]:justify-between max-[940px]:px-[25px] max-[940px]:py-[15px] max-[940px]:w-full
                          `}
                          onClick={(e) => handleDropdownToggle(e, item.name)}
                          aria-expanded={isOpen}
                        >
                          {item.name}
                          <span className={`ml-[5px] text-[12px] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▾</span>
                        </button>
                      )}

                      <div className={`
                        ${isOpen ? 'block' : 'hidden'}
                        absolute top-full left-0 bg-[#1e5292] min-w-full shadow-[0_8px_16px_rgba(0,0,0,0.2)] rounded-b-[4px] overflow-hidden
                        max-[940px]:static max-[940px]:translate-x-0 max-[940px]:w-full max-[940px]:bg-[rgba(0,0,0,0.1)] max-[940px]:shadow-none max-[940px]:rounded-none
                      `}>
                        {item.dropdown?.map((subLink) => {
                          const linkTo = getDropdownLink(item.name, subLink);
                          const isExternal = linkTo.startsWith('http');

                          return isExternal ? (
                            <a
                              key={subLink}
                              href={linkTo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-white block px-[14px] py-[11px] no-underline text-[12px] text-left border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.15)] whitespace-nowrap"
                              onClick={() => {
                                setActiveItem(item.name);
                                setActiveDropdown(null);
                                setIsMobileMenuOpen(false);
                              }}
                            >
                              {subLink}
                            </a>
                          ) : (
                            <Link
                              key={subLink}
                              to={linkTo}
                              className="text-white block px-[14px] py-[11px] no-underline text-[12px] text-left border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.15)] whitespace-nowrap"
                              onClick={() => {
                                setActiveItem(item.name);
                                setActiveDropdown(null);
                                setIsMobileMenuOpen(false);
                              }}
                            >
                              {subLink}
                            </Link>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <Link
                      to={item.link}
                      className={`
                        text-white no-underline text-[12px] font-medium px-[14px] py-[11px] opacity-85 transition-all duration-300 flex items-center cursor-pointer border-none bg-transparent whitespace-nowrap
                        hover:opacity-100 hover:bg-[rgba(255,255,255,0.25)]
                        ${isActive ? 'opacity-100 bg-[rgba(255,255,255,0.25)]' : ''}
                        max-[940px]:text-[14px] max-[940px]:justify-between max-[940px]:px-[25px] max-[940px]:py-[15px] max-[940px]:w-full
                      `}
                      onClick={() => {
                        setActiveItem(item.name);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      {item.name}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </>
  );
}