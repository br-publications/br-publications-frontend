import logo from '../../../assets/BR_logo.png';

interface DashboardHeaderProps {
  role?: string;
}

export default function DashboardHeader({ role = "User" }: DashboardHeaderProps) {
  return (
    <header className="bg-[#1e5292] text-white shadow-lg">
      <div className="w-full mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center h-12 sm:h-14">
          {/* Logo + Title */}
          <a
            href="/"
            className="flex items-center gap-2 sm:gap-3 flex-shrink-0 no-underline text-white hover:opacity-90 transition-opacity min-w-0"
          >
            <img
              src={logo}
              alt="BR Publications Logo"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex flex-col justify-center min-w-0">
              <h1 className="text-sm sm:text-base font-bold leading-tight m-0 truncate">
                BR Publications
                <span className="italic font-normal text-xs sm:text-sm opacity-90 ml-1.5">
                  — {role} Dashboard
                </span>
              </h1>
            </div>
          </a>
        </div>
      </div>
    </header>
  );
}