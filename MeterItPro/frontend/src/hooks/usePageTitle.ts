// Page Title Hook

import { useEffect } from 'react';

/**
 * Hook to set the document title
 */
export const usePageTitle = (title: string, appName = 'MeterIt'): void => {
  useEffect(() => {
    const previousTitle = document.title;
    
    // Set new title
    document.title = title ? `${title} - ${appName}` : appName;
    
    // Cleanup function to restore previous title
    return () => {
      document.title = previousTitle;
    };
  }, [title, appName]);
};

/**
 * Hook to dynamically update page title based on route and data
 */
export const useDynamicPageTitle = (
  baseTitle: string,
  data?: { name?: string; title?: string; label?: string },
  appName = 'MeterIt'
): void => {
  useEffect(() => {
    let title = baseTitle;
    
    // If we have data with a name/title/label, append it
    if (data) {
      const identifier = data.name || data.title || data.label;
      if (identifier) {
        title = `${identifier} - ${baseTitle}`;
      }
    }
    
    document.title = `${title} - ${appName}`;
    
    return () => {
      document.title = appName;
    };
  }, [baseTitle, data, appName]);
};

export default usePageTitle;