import React, { useState } from 'react';
import Sidebar from '../components/shared/Sidebar';
import Header from '../components/shared/Header';

const MainLayout = ({ children, hidePadding, title }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark font-body text-slate-900 dark:text-slate-100 overflow-x-hidden">
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="print:hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      </div>
      
      <div className="flex-1 flex flex-col min-h-screen relative md:ml-64 transition-all duration-300">
        <div className="print:hidden sticky top-0 z-40">
          <Header 
            title={title || "Hospital Management"} 
            onMenuClick={() => setIsSidebarOpen(true)} 
          />
        </div>
        
        <main className={`flex-1 flex flex-col ${hidePadding ? '' : 'p-4 md:p-8'} animate-in fade-in duration-500`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
