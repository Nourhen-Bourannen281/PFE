// components/Navbar.jsx - Version finale optimisée
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTachometerAlt, faUsers, faBoxOpen, faBuilding, faFileContract,
  faShoppingCart, faTruckFast, faFileInvoiceDollar, faCheckCircle,
  faHistory, faBars, faRightFromBracket, faExchangeAlt, faChevronDown,
  faBell, faExclamationTriangle, faRobot, faGlobe
} from '@fortawesome/free-solid-svg-icons';
import '../css/Navbar.css';
import { useLanguage } from '../store/languageStore';
import { LANGUAGES } from '../utils/translations';

const LANG_META = {
  fr: { label: 'Français',  short: 'FR', icon: '🇫🇷' },
  en: { label: 'English',   short: 'EN', icon: '🇬🇧' },
  ar: { label: 'العربية',   short: 'AR', icon: '🇹🇳' },
};

function LanguageSwitcher() {
  const { lang, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="lang-switcher" ref={ref}>
      <button className="lang-btn" onClick={() => setOpen(v => !v)} aria-label="Changer la langue">
        <FontAwesomeIcon icon={faGlobe} />
        <span className="lang-btn__code">{LANG_META[lang].short}</span>
        <span className="lang-btn__arrow">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="lang-dropdown" role="listbox">
          {Object.entries(LANG_META).map(([code, meta]) => {
            const active = code === lang;
            return (
              <button
                key={code}
                role="option"
                aria-selected={active}
                className={`lang-option${active ? ' lang-option--active' : ''}`}
                onClick={() => { setLanguage(code); setOpen(false); }}
              >
                <span className="lang-option__icon">{meta.icon}</span>
                <span className="lang-option__label">{meta.label}</span>
                <span className="lang-option__short">{meta.short}</span>
                {active && <span className="lang-option__check">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tr } = useLanguage();

  // ── Hooks avant tout return ────────────────────────────────
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  }, []);

  const role = user?.role;

  const [sidebarPathname, setSidebarPathname] = useState(null);
  const [dropdownPathname, setDropdownPathname] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);

  const isSidebarOpen = sidebarPathname === location.pathname;
  const activeDropdown = dropdownPathname === location.pathname ? openDropdown : null;

  const dashboardPath = useMemo(() => {
    switch (role) {
      case 'Admin': return '/dashboard';
      case 'Commercial': return '/commercial-dashboard';
      case 'Client': return '/client-dashboard';
      case 'Transporteur': return '/transporteur-dashboard';
      case 'Fournisseur': return '/fournisseur-dashboard';
      default: return '/dashboard';
    }
  }, [role]);

  // ── Initiales pour l'avatar ────────────────────────────────
  const initiales = useMemo(() => {
    const nom = user?.nom || user?.name || user?.pseudo || role || 'U';
    const parts = nom.split(' ').slice(0, 2);
    return parts.map(w => w[0]?.toUpperCase() || '').join('') || 'U';
  }, [user, role]);

  // ── Return anticipé après tous les hooks ───────────────────
  const token = localStorage.getItem('token');
  if (!token || location.pathname === '/' || location.pathname === '/login' || location.pathname === '/forgot-password') {
    return null;
  }

  // ── Handlers ───────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const openSidebar = () => setSidebarPathname(location.pathname);
  const closeSidebar = () => setSidebarPathname(null);
  const toggleSidebar = () => isSidebarOpen ? closeSidebar() : openSidebar();

  const toggleDropdown = (name) => {
    if (activeDropdown === name) {
      setOpenDropdown(null);
      setDropdownPathname(null);
    } else {
      setOpenDropdown(name);
      setDropdownPathname(location.pathname);
    }
  };

  const handleNavigation = () => {
    closeSidebar();
    setOpenDropdown(null);
    setDropdownPathname(null);
  };

  const isActive = (path) => location.pathname === path ? 'active-link' : '';
  const isDropdownActive = (paths) => paths.some(p => location.pathname === p) ? 'active' : '';

  // ── Dashboard link ─────────────────────────────────────────
  const dashboardLink = (
    <Link to={dashboardPath} className={`sidebar-link ${isActive(dashboardPath)}`} onClick={handleNavigation}>
      <FontAwesomeIcon icon={faTachometerAlt} />
      <span>{tr('dashboard')}</span>
    </Link>
  );

  // ── Dropdown Produits Nationaux ────────────────────────────
  const renderDropdownProduitsNationaux = () => (
    <div className="sidebar-dropdown">
      <button
        className={`sidebar-dropdown-btn ${activeDropdown === 'produitsNationaux' || isDropdownActive(['/ventes', '/cabotage']) ? 'active' : ''}`}
        onClick={() => toggleDropdown('produitsNationaux')}
      >
        <FontAwesomeIcon icon={faBoxOpen} />
        <span>Produits Nationaux</span>
        <FontAwesomeIcon icon={faChevronDown} className={`dropdown-arrow ${activeDropdown === 'produitsNationaux' ? 'rotated' : ''}`} />
      </button>
      <div className={`sidebar-dropdown-menu ${activeDropdown === 'produitsNationaux' ? 'open' : ''}`}>
        <Link to="/ventes" className={`sidebar-dropdown-item ${isActive('/ventes')}`} onClick={handleNavigation}>
          Vente STEG (Gaz Naturel)
        </Link>
        <Link to="/cabotage" className={`sidebar-dropdown-item ${isActive('/cabotage')}`} onClick={handleNavigation}>
          Cabotage STIR (Brut)
        </Link>
      </div>
    </div>
  );

  // ── Routes par rôle ────────────────────────────────────────
  const navLink = (to, icon, key) => (
    <Link key={to} to={to} className={`sidebar-link ${isActive(to)}`} onClick={handleNavigation}>
      <FontAwesomeIcon icon={icon} />
      <span>{tr(key)}</span>
    </Link>
  );

  const renderAdminRoutes = () => (
    <>
      {navLink('/users',          faUsers,               'users')}
      {navLink('/referentiels',   faBuilding,            'referentiels')}
      {navLink('/stock',          faBoxOpen,             'stock')}
      {navLink('/contrats',       faFileContract,        'contracts')}
      {navLink('/commandes',      faShoppingCart,        'orders')}
      {navLink('/livraisons',     faTruckFast,           'deliveries')}
      {navLink('/factures',       faFileInvoiceDollar,   'invoices')}
      {navLink('/export-import',  faExchangeAlt,         'export')}
      {navLink('/conformite',     faCheckCircle,         'compliance')}
      {navLink('/tiers',          faFileInvoiceDollar,   'tiers')}
      {navLink('/historique',     faHistory,             'history')}
      {navLink('/notifications',  faBell,                'notifications')}
      {navLink('/penalites-retard', faExclamationTriangle, 'penalties')}
      {navLink('/chatbot',        faRobot,               'assistant')}
      {renderDropdownProduitsNationaux()}
    </>
  );

  const renderCommercialRoutes = () => (
    <>
      {navLink('/contrats',         faFileContract,      'contracts')}
      {navLink('/commandes',        faShoppingCart,      'orders')}
      {navLink('/factures',         faFileInvoiceDollar, 'invoices')}
      {navLink('/export-import',    faExchangeAlt,       'export')}
      {navLink('/conformite',       faCheckCircle,       'compliance')}
      {navLink('/tiers',            faFileInvoiceDollar, 'tiers')}
      {navLink('/historique',       faHistory,           'history')}
      {navLink('/notifications',    faBell,              'notifications')}
      {navLink('/penalites-retard', faExclamationTriangle,'penalties')}
      {navLink('/chatbot',          faRobot,             'assistant')}
      {renderDropdownProduitsNationaux()}
    </>
  );

  const renderFournisseurRoutes = () => (
    <>
      {navLink('/commandes',        faShoppingCart,      'orders')}
      {navLink('/livraisons',       faTruckFast,         'deliveries')}
      {navLink('/tiers',            faFileInvoiceDollar, 'tiers')}
      {navLink('/mes-factures',     faFileInvoiceDollar, 'myInvoices')}
      {navLink('/historique',       faHistory,           'history')}
      {navLink('/notifications',    faBell,              'notifications')}
      {navLink('/penalites-retard', faExclamationTriangle,'penalties')}
      {navLink('/chatbot',          faRobot,             'assistant')}
    </>
  );

  const renderClientRoutes = () => (
    <>
      {navLink('/mes-commandes',    faShoppingCart,      'myOrders')}
      {navLink('/mes-livraisons',   faTruckFast,         'myDeliveries')}
      {navLink('/mes-factures',     faFileInvoiceDollar, 'myInvoices')}
      {navLink('/tiers',            faFileInvoiceDollar, 'tiers')}
      {navLink('/historique',       faHistory,           'history')}
      {navLink('/notifications',    faBell,              'notifications')}
      {navLink('/penalites-retard', faExclamationTriangle,'penalties')}
      {navLink('/chatbot',          faRobot,             'assistant')}
    </>
  );

  const renderTransporteurRoutes = () => (
    <>
      {navLink('/transporteur-livraisons', faTruckFast,         'myDeliveries')}
      {navLink('/tiers',                   faFileInvoiceDollar, 'tiers')}
      {navLink('/historique',              faHistory,           'history')}
      {navLink('/notifications',           faBell,              'notifications')}
      {navLink('/penalites-retard',        faExclamationTriangle,'penalties')}
      {navLink('/chatbot',                 faRobot,             'assistant')}
    </>
  );

  // ── JSX final ──────────────────────────────────────────────
  return (
    <>
      <header className="topbar">
        <button className="burger-btn" onClick={toggleSidebar} aria-label="Menu">
          <FontAwesomeIcon icon={faBars} />
        </button>

        <div className="topbar-right">
          <LanguageSwitcher />

          {/* Profil dans le topbar - visible pour tous les rôles */}
          <Link to="/profile" className="topbar-profile-link" title={`Profil — ${role || 'Invité'}`}>
            <span className="topbar-avatar">{initiales}</span>
            <span className="topbar-role-label">{role || 'Invité'}</span>
          </Link>

          <button className="topbar-logout" onClick={handleLogout} aria-label="Se déconnecter">
            <FontAwesomeIcon icon={faRightFromBracket} />
          </button>
        </div>
      </header>

      {isSidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} aria-hidden="true" />}

      <aside className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">SMART-TRADE 360°</div>
          <small>{role || 'Utilisateur'}</small>
        </div>
        <nav className="sidebar-nav" aria-label="Navigation principale">
          {dashboardLink}
          {role === 'Admin' && renderAdminRoutes()}
          {role === 'Commercial' && renderCommercialRoutes()}
          {role === 'Fournisseur' && renderFournisseurRoutes()}
          {role === 'Client' && renderClientRoutes()}
          {role === 'Transporteur' && renderTransporteurRoutes()}
        </nav>
      </aside>
    </>
  );
}

export default Navbar;