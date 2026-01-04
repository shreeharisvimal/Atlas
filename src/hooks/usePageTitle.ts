import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const routeTitleMap: Record<string, string> = {
  '/': 'Dashboard',
  '/login': 'Login',
  '/dashboard': 'Dashboard',
  '/tickets': 'Tickets',
  '/tickets/new': 'Create Ticket',
  '/users': 'Users',
  '/profile': 'Profile',
  '/settings': 'Settings',
  '/tags': 'Tags',
};

export const usePageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const baseTitle = 'SETU AI Atlas';
    
    // Get the page name from the route
    let pageName = 'Dashboard'; // default
    
    // Check for exact matches first
    if (routeTitleMap[location.pathname]) {
      pageName = routeTitleMap[location.pathname];
    } else if (location.pathname.startsWith('/tickets/')) {
      // For ticket detail pages, we'll use "Ticket Detail"
      // You could enhance this later to show the actual ticket title
      pageName = 'Ticket Detail';
    }
    
    document.title = `${baseTitle} | ${pageName}`;
  }, [location.pathname]);
};

