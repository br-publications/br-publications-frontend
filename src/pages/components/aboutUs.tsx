import NewspaperIcon from '@mui/icons-material/Newspaper';
import SecurityIcon from '@mui/icons-material/Security';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ScienceIcon from '@mui/icons-material/Science';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function AboutUs() {
  return (
    <div className="font-sans text-[#333333] leading-[1.6] bg-white overflow-x-hidden">
      
      {/* Hero Section */}
      <header className="bg-[#1e5292] text-white py-[50px] px-[20px] text-center border-b-[4px] border-[#164175] w-full">
        <h1 className="text-[25px] uppercase tracking-[1px] max-[480px]:text-[20px] font-bold">Who We Are</h1>
      </header>

      <main className="max-w-[1100px] mx-auto my-[40px] px-[20px] w-full">

        {/* Section Header */}
        <div className="mb-[10px] border-b-[2px] border-[#1e5292] inline-block pb-[5px]">
          <h2 className="text-[16px] text-[#1e5292] font-bold">About BR Publications</h2>
        </div>

        {/* Intro Text */}
        <div className="text-[12px] mb-[15px] text-[#333333]">
          <p>
            <strong>BR Publications</strong> is dedicated to publishing a diverse range of high-quality
            academic and professional works for readers and researchers with a passion for knowledge
            across multidisciplinary domains. Our publications span <span className="text-[#1e5292] font-bold">Sciences,
            Medical Sciences, Engineering, Technology, Humanities</span> and more—reflecting our
            commitment to academic excellence and intellectual growth.
          </p>
        </div>

        {/* Divisions Section */}
        <section>
          <h3 className="text-[14px] text-[#1e5292] mb-[5px] font-bold">Under the BR Publications umbrella, we operate specialized publishing divisions:</h3>
          
          <div className="p-[15px] mb-[15px] bg-[#f9f9f9] border border-[#dddddd] border-l-[4px] border-l-[#1e5292]">
            <h3 className="text-[14px] mb-[8px] font-bold">ResNova Academic Press</h3>
            <p className="text-[12px] text-[#666666]">which publishes <strong>Book Chapters, Edited Volumes, and Academic Compilations</strong> serving as
              a premier platform for scholars and researchers to share innovative findings across disciplines.</p>
          </div>

          <div className="p-[15px] mb-[15px] bg-[#f9f9f9] border border-[#dddddd] border-l-[4px] border-l-[#1e5292]">
            <h3 className="text-[14px] mb-[8px] font-bold">BR Book Publications</h3>
            <p className="text-[12px] text-[#666666]">which focuses on <strong>Comprehensive Textbooks and Reference Materials</strong> for higher
              education, offering well-structured content designed to support both teaching and learning.</p>
          </div>
        </section>

        {/* Info Box (Blue) */}
        <div className="border border-[#dddddd] p-[15px] my-[30px] w-full bg-[#1e5292] text-white">
          <div className="flex items-center gap-[12px] justify-center mb-[12px]">
            <NewspaperIcon style={{ fontSize: '20px' }} />
            <h3 className="text-[14px] uppercase mb-0 font-bold">Our Flagship Journal</h3>
          </div>
          <p className="text-[12px]">
            An integral part of our publishing ecosystem is the <a href="#" className="font-bold underline text-white">Journal of Advances
            in Management, Engineering and Science (JAMES)</a>, a scholarly open-access international journal
            providing authors with the opportunity to publish peer-reviewed original research papers across
            management, engineering, science, and their real-world applications.
          </p>
        </div>

        {/* Info Box (White) */}
        <div className="border border-[#dddddd] p-[15px] my-[30px] w-full">
          <div className="flex items-center gap-[12px] justify-center mb-[12px]">
            <SecurityIcon style={{ fontSize: '20px', color: '#1e5292' }} />
            <h3 className="text-[14px] uppercase mb-0 font-bold">Patent Filing & Consultation Services</h3>
          </div>
          <p className="text-[12px]">
            In addition to publishing, we offer <strong>Exclusive Patent Filing and Consultation Services</strong> to
            protect your ideas and innovations. Our expert team provides comprehensive guidance on patent-related
            processes, ensuring your intellectual property receives the best possible protection—both nationally and
            internationally.
          </p>
        </div>

        {/* Mission & Vision Grid */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[30px] my-[40px] max-[480px]:grid-cols-1">
          <div className="border border-[#dddddd] p-[18px] bg-[#f9f9f9] text-center">
            <div className="flex items-center gap-[12px] justify-center mb-[12px]">
              <TrackChangesIcon style={{ fontSize: '16px', color: '#1e5292' }} />
              <h3 className="text-[#1e5292] text-[16px] uppercase font-bold">Our Mission</h3>
            </div>
            <p className="text-[12px] text-[#666666] italic">
              "To disseminate knowledge through high-quality publications, foster interdisciplinary research, and
              protect innovations with reliable patent services. We are committed to empowering authors,
              researchers, and inventors by providing platforms that enhance learning, advance discovery, and
              safeguard intellectual property."
            </p>
          </div>
          <div className="border border-[#dddddd] p-[18px] bg-[#f9f9f9] text-center">
            <div className="flex items-center gap-[12px] justify-center mb-[12px]">
              <VisibilityIcon style={{ fontSize: '16px', color: '#1e5292' }} />
              <h3 className="text-[#1e5292] text-[16px] uppercase font-bold">Our Vision</h3>
            </div>
            <p className="text-[12px] text-[#666666] italic">
              "To become a globally recognized hub for academic excellence and innovation—where books inspire,
              journals advance research, and patents protect creativity—contributing to the growth of education,
              science, and technology for a sustainable future."
            </p>
          </div>
        </div>

        {/* Commitment Section */}
        <section className="border border-[#dddddd] p-[15px] my-[30px] w-full bg-[#f9f9f9] text-center">
          <h3 className="text-[#1e5292] text-[14px] uppercase mb-[10px] font-bold">Our Commitment to Excellence</h3>
          <p className="mb-[20px] text-[12px]">
            At <strong>BR Publications</strong>, we are committed to delivering
            exceptional services powered by innovation, technology, and integrity. Our goal is to empower authors,
            researchers, and inventors by helping them <strong>publish, promote, and protect</strong> their creative
            and intellectual contributions to society.
          </p>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[20px] mt-[20px]">
            {[
              { icon: <LightbulbIcon style={{ fontSize: '20px', color: '#1e5292' }} />, title: 'Innovation', desc: 'Cutting-edge publishing solutions' },
              { icon: <ScienceIcon style={{ fontSize: '20px', color: '#1e5292' }} />, title: 'Technology', desc: 'Advanced digital platforms' },
              { icon: <CheckCircleIcon style={{ fontSize: '20px', color: '#1e5292' }} />, title: 'Integrity', desc: 'Ethical publishing standards' }
            ].map((item, index) => (
              <div key={index} className="text-center p-[20px] border border-[#dddddd] bg-white flex flex-col items-center">
                <div className="mb-[10px]">{item.icon}</div>
                <h4 className="text-[14px] text-[#1e5292] mb-[5px] font-bold">{item.title}</h4>
                <p className="text-[12px] text-[#666666]">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}