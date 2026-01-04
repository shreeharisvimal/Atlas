import { Link, useLocation, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ticketsApi } from '../api/tickets';
import type { Ticket } from '../types';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

export const Breadcrumbs = () => {
  const location = useLocation();
  const params = useParams();
  const [ticketTitle, setTicketTitle] = useState<string | null>(null);
  const [loadingTicket, setLoadingTicket] = useState(false);

  // Don't show breadcrumbs on login page
  if (location.pathname === '/login') {
    return null;
  }

  useEffect(() => {
    // Load ticket title if we're on a ticket detail page
    if (params.id && location.pathname.startsWith('/tickets/') && !location.pathname.includes('/new')) {
      loadTicketTitle(parseInt(params.id));
    }
  }, [params.id, location.pathname]);

  const loadTicketTitle = async (ticketId: number) => {
    try {
      setLoadingTicket(true);
      const ticket = await ticketsApi.getTicket(ticketId);
      setTicketTitle(ticket.title);
    } catch (error) {
      console.error('Failed to load ticket title:', error);
    } finally {
      setLoadingTicket(false);
    }
  };

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const path = location.pathname;
    
    // Handle root path and dashboard
    if (path === '/' || path === '/dashboard') {
      return [{ label: 'Dashboard' }];
    }

    const crumbs: BreadcrumbItem[] = [{ label: 'Dashboard', path: '/dashboard' }];

    // Handle tickets routes
    if (path.startsWith('/tickets')) {
      crumbs.push({ label: 'Tickets', path: '/tickets' });

      if (path === '/tickets/new') {
        crumbs.push({ label: 'Create Ticket' });
      } else if (params.id) {
        if (loadingTicket) {
          crumbs.push({ label: 'Loading...' });
        } else if (ticketTitle) {
          crumbs.push({ label: ticketTitle.length > 50 ? ticketTitle.substring(0, 50) + '...' : ticketTitle });
        } else {
          crumbs.push({ label: `Ticket #${params.id}` });
        }
      }
      return crumbs;
    }

    // Handle other routes
    if (path === '/users') {
      crumbs.push({ label: 'Users' });
      return crumbs;
    }

    if (path === '/profile') {
      crumbs.push({ label: 'Profile' });
      return crumbs;
    }

    if (path === '/settings') {
      crumbs.push({ label: 'Settings' });
      return crumbs;
    }

    if (path === '/tags') {
      crumbs.push({ label: 'Tags' });
      return crumbs;
    }

    // Default: just show Dashboard link for unknown routes
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className="mb-6 animate-fade-in" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <svg
                className="w-4 h-4 text-gray-400 dark:text-gray-500 mx-3 transition-transform duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            )}
            {crumb.path && index < breadcrumbs.length - 1 ? (
              <Link
                to={crumb.path}
                className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-all duration-200 hover:scale-105 px-2 py-1 rounded-lg hover:bg-primary-50/50 dark:hover:bg-primary-900/20"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-gray-900 dark:text-white font-bold px-2 py-1 rounded-lg bg-primary-50/50 dark:bg-primary-900/20">
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

