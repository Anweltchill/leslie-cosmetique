import { createContext, useCallback, useContext, useEffect, useState, type ReactNode, type MouseEvent } from 'react';
import { track } from './track';

interface RouterState {
  path: string;
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterState>({ path: '/', navigate: () => {} });

const normalize = (p: string) => (p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => normalize(window.location.pathname));

  useEffect(() => {
    const onPop = () => setPath(normalize(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((to: string) => {
    const target = normalize(to);
    if (target === normalize(window.location.pathname)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.history.pushState({}, '', target);
    setPath(target);
    track('page_view', { path: target });
  }, []);

  return <RouterContext.Provider value={{ path, navigate }}>{children}</RouterContext.Provider>;
}

export const useRouter = () => useContext(RouterContext);

interface LinkProps {
  to: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
  trackName?: string;
  style?: React.CSSProperties;
}

export function Link({ to, children, className, onClick, ariaLabel, trackName, style }: LinkProps) {
  const { navigate } = useRouter();
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (trackName) track('nav_click', { name: trackName, to });
    onClick?.();
    navigate(to);
  };
  return (
    <a href={to} onClick={handle} className={className} aria-label={ariaLabel} style={style}>
      {children}
    </a>
  );
}
