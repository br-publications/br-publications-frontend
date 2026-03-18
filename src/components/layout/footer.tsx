import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { MessageCircle, Phone, Facebook, Twitter, Linkedin, Instagram, ChevronRight, MapPin, Mail } from 'lucide-react';
import { contactService, type ContactDetails } from '../../services/contactService';

export default function Footer() {
  const [hideFloatingButtons, setHideFloatingButtons] = useState(false);
  const [contactDetails, setContactDetails] = useState<ContactDetails | null>(null);

  useEffect(() => {
    const fetchContactDetails = async () => {
      try {
        const response = await contactService.getContactDetails();
        if (response.success && response.data) {
          setContactDetails(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch contact details for footer:', error);
      }
    };

    fetchContactDetails();

    const handleScroll = () => {
      // Logic to hide buttons when overlapping specific sections (like contact page)
      // For now, we'll keep it simple or you can add specific IDs to check against
      const contactSection = document.getElementById('contactPage');
      if (contactSection) {
        const rect = contactSection.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          setHideFloatingButtons(true);
        } else {
          setHideFloatingButtons(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const whatsappNumber = contactDetails?.whatsapp || '+919842768170';
  const phoneNumber = (contactDetails?.phoneNumbers && contactDetails.phoneNumbers.length > 0) ? contactDetails.phoneNumbers[0] : '+91 98427 68170';
  const email = contactDetails?.email || 'info@brpublications.com';
  const address = contactDetails?.officeAddress || 'BR Publications\n6/328-2, Maruthi Nagar\nTrichy Road, Namkkal-637001,\nIndia';

  return (
    <>
      {/* Floating Action Buttons */}
      <section className={`fixed bottom-[25px] right-[25px] flex flex-col gap-[15px] z-[2000] transition-all duration-300 ${hideFloatingButtons ? 'opacity-0 invisible pointer-events-none' : 'opacity-100 visible'}`}>
        <a href={`https://wa.me/${whatsappNumber}`} className="w-[55px] h-[55px] rounded-[25%] flex items-center justify-center text-[25px] text-white shadow-[0_4px_10px_rgba(0,0,0,0.2)] transition-all duration-300 hover:scale-110 hover:shadow-[0_6px_20px_rgba(0,0,0,0.3)] bg-[#25d366]" target="_blank" title="Chat on WhatsApp" rel="noreferrer">
          <MessageCircle size={28} />
        </a>
        <a href={`tel:${phoneNumber}`} className="w-[55px] h-[55px] rounded-[25%] flex items-center justify-center text-[25px] text-white shadow-[0_4px_10px_rgba(0,0,0,0.2)] transition-all duration-300 hover:scale-110 hover:shadow-[0_6px_20px_rgba(0,0,0,0.3)] bg-white text-[#1e5292]!" title="Call Us">
          <Phone size={25} className="text-[#1e5292]" />
        </a>
      </section>

      <footer className="w-full bg-[#ddd] text-black pt-[30px] pb-[15px] font-['Poppins',sans-serif] mt-auto" id="footerPage">
        <div className="mx-auto max-w-[1316px] px-[18px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[40px]">

          {/* About Us */}
          <div className="flex flex-col">
            <h3 className="text-black text-[14px] mb-[10px] font-bold">About Us</h3>
            <div className="w-[25px] h-[3px] bg-[#1e5292] mb-[15px]"></div>
            <p className="text-[12px] leading-[1.7] mb-4">
              BR Publications is committed to publishing high-quality academic
              and scholarly works across all major disciplines. We aim to support
              researchers, authors, and educators by offering trusted publication
              services and global research visibility.
            </p>
            <div className="flex">
              {/* {contactDetails?.facebook && ( */}
              <a href='#' target="_blank" className="inline-flex justify-center items-center mr-[10px] text-[12px] text-black border border-[#1e5292] p-[8px] rounded-full transition-all duration-300 w-[30px] h-[30px] hover:bg-[#1e5292] hover:text-white group" rel="noreferrer">
                <Facebook size={14} className="group-hover:text-white" />
              </a>
              {/* // )} */}
              {/* {contactDetails?.twitter && ( */}
              <a href='#' target="_blank" className="inline-flex justify-center items-center mr-[10px] text-[12px] text-black border border-[#1e5292] p-[8px] rounded-full transition-all duration-300 w-[30px] h-[30px] hover:bg-[#1e5292] hover:text-white group" rel="noreferrer">
                <Twitter size={14} className="group-hover:text-white" />
              </a>
              {/* )} */}
              {/* {contactDetails?.linkedin && ( */}
              <a href='#' target="_blank" className="inline-flex justify-center items-center mr-[10px] text-[12px] text-black border border-[#1e5292] p-[8px] rounded-full transition-all duration-300 w-[30px] h-[30px] hover:bg-[#1e5292] hover:text-white group" rel="noreferrer">
                <Linkedin size={14} className="group-hover:text-white" />
              </a>
              {/* )} */}
              {contactDetails?.instagram && (
                <a href={contactDetails.instagram} target="_blank" className="inline-flex justify-center items-center mr-[10px] text-[12px] text-black border border-[#1e5292] p-[8px] rounded-full transition-all duration-300 w-[30px] h-[30px] hover:bg-[#1e5292] hover:text-white group" rel="noreferrer">
                  <Instagram size={14} className="group-hover:text-white" />
                </a>
              )}
              {contactDetails?.whatsapp && (
                <a href={`https://wa.me/${contactDetails.whatsapp}`} target="_blank" title="Chat on WhatsApp" className="inline-flex justify-center items-center mr-[10px] text-[12px] text-black border border-[#1e5292] p-[8px] rounded-full transition-all duration-300 w-[30px] h-[30px] hover:bg-[#1e5292] hover:text-white group" rel="noreferrer">
                  <MessageCircle size={14} className="group-hover:text-white" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col">
            <h3 className="text-black text-[14px] mb-[10px] font-bold">Quick Links</h3>
            <div className="w-[25px] h-[3px] bg-[#1e5292] mb-[15px]"></div>
            <ul className="list-none p-0">
              <li className="flex items-center mb-[8px]">
                <ChevronRight size={14} className="text-[#1e5292] mr-[8px]" />
                <a href="https://brpublications.com/index.php/James/index" target="_blank" rel="noopener noreferrer" className="text-black no-underline text-[12px] transition-all duration-300 hover:text-[#1e5292] hover:pl-[5px]">Journals & Publications</a>
              </li>
              <li className="flex items-center mb-[8px]">
                <ChevronRight size={14} className="text-[#1e5292] mr-[8px]" />
                <a href="/resnova" className="text-black no-underline text-[12px] transition-all duration-300 hover:text-[#1e5292] hover:pl-[5px]">ResNova Academic Press</a>
              </li>
              <li className="flex items-center mb-[8px]">
                <ChevronRight size={14} className="text-[#1e5292] mr-[8px]" />
                <a href="/bookpublications" className="text-black no-underline text-[12px] transition-all duration-300 hover:text-[#1e5292] hover:pl-[5px]">Book Publications</a>
              </li>
            </ul>
          </div>

          {/* Work With Us */}
          <div className="flex flex-col">
            <h3 className="text-black text-[14px] mb-[10px] font-bold">Work With Us</h3>
            <div className="w-[25px] h-[3px] bg-[#1e5292] mb-[15px]"></div>
            <ul className="list-none p-0">
              <li className="flex items-center mb-[8px]">
                <ChevronRight size={14} className="text-[#1e5292] mr-[8px]" />
                <Link to="/book-chapter-manuscript" className="text-black no-underline text-[12px] transition-all duration-300 hover:text-[#1e5292] hover:pl-[5px]">Contribute a Book Chapter</Link>
              </li>
              <li className="flex items-center mb-[8px]">
                <ChevronRight size={14} className="text-[#1e5292] mr-[8px]" />
                <Link to="/book-manuscript" className="text-black no-underline text-[12px] transition-all duration-300 hover:text-[#1e5292] hover:pl-[5px]">Publish Your Text Book</Link>
              </li>
              <li className="flex items-center mb-[8px]">
                <ChevronRight size={14} className="text-[#1e5292] mr-[8px]" />
                <Link to="/recruitment?role=editor" className="text-black no-underline text-[12px] transition-all duration-300 hover:text-[#1e5292] hover:pl-[5px]">Join as a Book Editor</Link>
              </li>
              <li className="flex items-center mb-[8px]">
                <ChevronRight size={14} className="text-[#1e5292] mr-[8px]" />
                <Link to="/recruitment?role=reviewer" className="text-black no-underline text-[12px] transition-all duration-300 hover:text-[#1e5292] hover:pl-[5px]">Join as a Reviewer</Link>
              </li>
            </ul>
          </div>

          {/* Contact Us */}
          <div className="flex flex-col">
            <h3 className="text-black text-[14px] mb-[10px] font-bold">Contact Us</h3>
            <div className="w-[25px] h-[3px] bg-[#1e5292] mb-[15px]"></div>
            <p className="text-[12px] leading-[1.7] mb-[10px] flex items-start gap-2">
              <MapPin size={14} className="text-[#1e5292] mt-1 shrink-0" />
              <span style={{ whiteSpace: 'pre-line' }}>{address}</span>
            </p>
            <p className="text-[12px] leading-[1.7] mb-[10px] flex items-center gap-2">
              <Phone size={14} className="text-[#1e5292] shrink-0" />
              <span>{phoneNumber}</span>
            </p>
            <p className="text-[12px] leading-[1.7] mb-[10px] flex items-center gap-2">
              <Mail size={14} className="text-[#1e5292] shrink-0" />
              <a href={`mailto:${email}`} className="text-black hover:text-[#1e5292] transition-colors">{email}</a>
            </p>
          </div>

        </div>

        <div className="max-w-[1316px] mx-auto px-[18px] text-center mt-[40px] border-t border-[rgba(0,0,0,0.1)] pt-[15px]">
          <p className="text-[12px] text-black">Copyright © {new Date().getFullYear()} BR Publications. All Rights Reserved.</p>
        </div>
      </footer>
    </>
  )
}