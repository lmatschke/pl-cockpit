import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router';
import { api } from './api';
import { CheckIcon, DataIcon, HomeIcon, ProgressIcon, RiskIcon, TimelineIcon } from './icons';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

const NAV_MAIN: NavItem[] = [
  { to: '/', label: 'Start', icon: <HomeIcon /> },
  { to: '/planung', label: 'Projektplanung', icon: <TimelineIcon /> },
  { to: '/aufgaben', label: 'Aufgaben', icon: <CheckIcon /> },
  { to: '/risiken', label: 'Risiken', icon: <RiskIcon /> },
];

const NAV_SECONDARY: NavItem[] = [
  { to: '/weiterentwicklung', label: 'Weiterentwicklung', icon: <ProgressIcon /> },
  { to: '/stammdaten', label: 'Stammdaten', icon: <DataIcon /> },
];

function NavList({ items }: { items: NavItem[] }) {
  return (
    <ul className="nav-list">
      {items.map((item) => (
        <li key={item.to}>
          <NavLink to={item.to} end={item.to === '/'} className="nav-link">
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

function ConnectionStatus() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    api
      .get<{ status: string }>('/api/health')
      .then((h) => setOnline(h.status === 'ok'))
      .catch(() => setOnline(false));
  }, []);

  if (online === null) return null;
  return (
    <p className={`connection ${online ? 'is-online' : 'is-offline'}`}>
      <span className="connection-dot" aria-hidden="true" />
      {online ? 'Verbunden' : 'Server nicht erreichbar'}
    </p>
  );
}

export function Layout() {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            PL
          </span>
          <span className="brand-name">PL-Cockpit</span>
        </div>
        <nav aria-label="Hauptnavigation" className="nav">
          <NavList items={NAV_MAIN} />
          <div className="nav-divider" />
          <NavList items={NAV_SECONDARY} />
        </nav>
        <ConnectionStatus />
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
