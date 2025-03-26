import React, { useState, useEffect } from 'react';
import './Layout.css';

const Layout = ({ children, isGame = false }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <div className={`app-layout ${isGame ? 'game-layout' : ''} ${isMobile ? 'mobile' : 'desktop'}`}>
      {children}
      
      {isMobile && isGame && (
        <div className="mobile-orientation-warning">
          <div className="warning-content">
            <i className="rotate-icon">↻</i>
            <p>Please rotate your device for a better gaming experience</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
