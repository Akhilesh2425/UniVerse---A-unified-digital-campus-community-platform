import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../common/Navbar';
import Footer from '../common/Footer';

const AppLayout = () => {
  const location = useLocation();
  const isSingleFramePage = location.pathname === '/profile';

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FC] dark:bg-[#0F172A] text-[#172033] dark:text-[#F1F5F9] transition-colors duration-200 w-full max-w-full overflow-x-hidden">
      <Navbar />
      <main className={`flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 overflow-x-hidden ${isSingleFramePage ? 'py-3 sm:py-4 flex flex-col justify-center' : 'py-8'}`}>
        <Outlet />
      </main>
      {!isSingleFramePage && <Footer />}
    </div>
  );
};

export default AppLayout;
