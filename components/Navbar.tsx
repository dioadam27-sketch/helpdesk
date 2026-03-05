import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, PlusCircle, History, AlertTriangle, LayoutGrid } from 'lucide-react';

interface NavbarProps {
  userRole: 'student' | 'admin' | null;
  onLogout: () => void;
  logoSrc: string;
}

const Navbar: React.FC<NavbarProps> = ({ userRole, onLogout, logoSrc }) => {
  const location = useLocation();
  if (!userRole) return null;

  return (
    <div className="bg-[#003B73] shadow-md mb-6">
      <nav className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        
        {/* LOGO */}
        <Link to="/menu" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-white/20">
             <img src={logoSrc} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-extrabold text-white tracking-widest uppercase font-mono leading-tight">
              HELPDESK <span className="text-[#FFC700]">PDB</span>
            </h1>
            <span className="text-[10px] text-blue-200 font-semibold tracking-wider">UNIVERSITAS AIRLANGGA</span>
          </div>
        </Link>

        {/* MENU */}
        <div className="flex gap-1 bg-[#002d5a] p-1 rounded-lg border border-[#004b91]">
           {userRole === 'student' && (
             <>
               <NavBtn to="/menu" active={location.pathname === '/menu'} icon={LayoutGrid}>MENU</NavBtn>
               <NavBtn to="/form" active={location.pathname === '/form'} icon={PlusCircle}>SURAT</NavBtn>
               <NavBtn to="/history" active={location.pathname === '/history'} icon={History}>RIWAYAT</NavBtn>
               <NavBtn to="/complain" active={location.pathname === '/complain'} icon={AlertTriangle}>KOMPLAIN</NavBtn>
             </>
           )}
           {userRole === 'admin' && (
             <div className="px-4 py-2 text-xs font-bold text-[#FFC700] flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" /> DASHBOARD ADMIN
             </div>
           )}
        </div>

        {/* ACTIONS */}
        <div className="flex gap-2">
           <button onClick={onLogout} className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-all" title="Keluar">
              <LogOut className="w-5 h-5" />
           </button>
        </div>

      </nav>
    </div>
  );
};

const NavBtn = ({ active, to, children, icon: Icon }: any) => (
  <Link 
    to={to}
    className={`px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded flex items-center gap-2 transition-all ${active ? 'bg-[#FFC700] text-[#003B73] shadow-sm' : 'text-blue-200 hover:text-white hover:bg-white/5'}`}
  >
    <Icon className="w-3.5 h-3.5" />
    {children}
  </Link>
);

export default Navbar;