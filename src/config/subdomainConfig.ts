// Configuration for admin subdomain behavior
export const ADMIN_SUBDOMAIN_DISABLED = true; // Set to false when ready to enable admin subdomain

// Check if current URL is on admin subdomain
export const isAdminSubdomain = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  return hostname.startsWith('admin.') || hostname === 'admin.localhost';
};

// Get the main domain URL (without admin subdomain)
export const getMainDomainUrl = (): string => {
  if (typeof window === 'undefined') return '/';
  
  const hostname = window.location.hostname;
  const mainHostname = hostname.replace(/^admin\./, '');
  
  return `${window.location.protocol}//${mainHostname}${window.location.port ? `:${window.location.port}` : ''}`;
};
