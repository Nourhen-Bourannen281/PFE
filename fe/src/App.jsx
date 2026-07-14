import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';

// Pages Publiques
import ForgotPassword from './pages/ForgotPassword';
import Landing        from './pages/Landing';
import Login          from './pages/Login';
import Historique     from './pages/Historique';

// Pages Admin
import Dashboard      from './pages/admin/AdminDashboard';
import Users          from './pages/Users';
import Tiers          from './pages/admin/Tiers';
import GestionStock   from './pages/admin/GestionStock';

// ✅ Pages Fournisseur
import FournisseurDashboard from './pages/fournisseur/FournisseurDashboard';

// Pages communes
import Chatbot         from './pages/Chatbot';
import PenalitesRetard from './pages/PenalitesRetard';
import Notifications   from './pages/Notifications';

// Pages Référentiels
import Products      from './pages/admin/referentiel/Products';
import Referentiels  from './pages/admin/referentiel/Referentiel';
import TypeProduits  from './pages/admin/referentiel/TypeProduits';
import SousProduits  from './pages/admin/referentiel/SousProduits';
import Pays          from './pages/admin/referentiel/Pays';
import Banques       from './pages/admin/referentiel/Banques';
import Navires       from './pages/admin/referentiel/Navires';
import ModesPaiement from './pages/admin/referentiel/ModesPaiement';
import TypesFacture  from './pages/admin/referentiel/TypesFacture';
import Ports         from './pages/admin/referentiel/Ports';

// Pages Commercial
import CommercialDashboard from './pages/commercial/CommercialDashboard';
import Contrats            from './pages/commercial/Contrats';
import ContratsVente       from './pages/admin/contrats/ContratsVente';
import Ventes              from './pages/Ventes';
import Commandes           from './pages/Commandes';
import Livraisons          from './pages/Livraison';

// Pages Client
import ClientDashboard from './pages/client/ClientDashboard';
import MesCommandes    from './pages/client/MesCommandes';
import MesFactures     from './pages/client/MesFactures';
import MesLivraisons   from './pages/client/MesLivraisons';

// Pages Transporteur
import TransporteurDashboard  from './pages/transporteur/TransporteurDashboard';
import TransporteurLivraisons from './pages/transporteur/TransporteurLivraions';

// Pages Opérationnelles
import Cabotage       from './pages/Cabotage';
import Transport      from './pages/Transport';
import SuiviTempsReel from './pages/SuiviTempsReel';

// Pages Sprint 4
import Factures    from './pages/Factures';
import ExportImport from './pages/ExportImport';
import Conformite  from './pages/Conformite';
import Profile     from './pages/Profile';

function MobileOnly() {
  const navigate = useNavigate();
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', textAlign: 'center', padding: '2rem', gap: '1.5rem'
    }}>
      <div style={{ fontSize: '4rem' }}>📱</div>
      <h2 style={{ fontSize: '1.5rem', color: '#1a3c5e', margin: 0 }}>
        Disponible uniquement sur mobile
      </h2>
      <p style={{ color: '#666', maxWidth: '360px', lineHeight: '1.6' }}>
        Cette fonctionnalité est réservée à l'application mobile SMART-TRADE 360°.
        Rendez-vous sur votre profil pour obtenir votre QR Code et accéder à l'application.
      </p>
      <button
        onClick={() => navigate('/profile')}
        style={{
          background: '#1a3c5e', color: '#fff', border: 'none',
          borderRadius: '8px', padding: '0.75rem 2rem',
          fontSize: '1rem', cursor: 'pointer', fontWeight: 600
        }}
      >
        📲 Aller au Profil — QR Code
      </button>
    </div>
  );
}


function AppLayout() {
  const location = useLocation();
  const hideNavbarRoutes = ['/', '/login', '/forgot-password'];
  const showNavbar = !hideNavbarRoutes.includes(location.pathname);

  return (
    <div className={showNavbar ? 'app-layout' : ''}>
      {showNavbar && <Navbar />}
      <div className={showNavbar ? 'page-content' : ''}>
        <Routes>

          {/* ── Publiques ─────────────────────────────────────── */}
          <Route path="/"               element={<Landing />} />
          <Route path="/login"          element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/profile"         element={<Profile />} />

          {/* ── Admin ────────────────────────────────────────── */}
          <Route path="/dashboard"       element={<Dashboard />} />
          <Route path="/admin-dashboard" element={<Dashboard />} />
          <Route path="/users"           element={<Users />} />
          <Route path="/tiers"           element={<Tiers />} />
          <Route path="/stock"           element={<GestionStock />} />

          {/* ── Référentiels ──────────────────────────────────── */}
          <Route path="/referentiels"   element={<Referentiels />} />
          <Route path="/products"       element={<Products />} />
          <Route path="/type-produits"  element={<TypeProduits />} />
          <Route path="/sous-produits"  element={<SousProduits />} />
          <Route path="/pays"           element={<Pays />} />
          <Route path="/banques"        element={<Banques />} />
          <Route path="/navires"        element={<Navires />} />
          <Route path="/modes-paiement" element={<ModesPaiement />} />
          <Route path="/types-facture"  element={<TypesFacture />} />
          <Route path="/ports"          element={<Ports />} />

          {/* ── Commercial ───────────────────────────────────── */}
          <Route path="/commercial-dashboard" element={<CommercialDashboard />} />
          <Route path="/contrats"             element={<Contrats />} />
          <Route path="/contrats-vente"       element={<ContratsVente />} />
          <Route path="/ventes"               element={<Ventes />} />
          <Route path="/commandes"            element={<Commandes />} />

          {/* ── Client ───────────────────────────────────────── */}
          <Route path="/client-dashboard" element={<ClientDashboard />} />
          <Route path="/mes-commandes"    element={<MesCommandes />} />
          <Route path="/mes-factures"     element={<MesFactures />} />
          <Route path="/mes-livraisons"   element={<MesLivraisons />} />

          {/* ── Transporteur ─────────────────────────────────── */}
          <Route path="/transporteur-dashboard"  element={<TransporteurDashboard />} />
          <Route path="/transporteur-livraisons" element={<TransporteurLivraisons />} />
          <Route path="/livraisons"              element={<Livraisons />} />

          {/* ── Fournisseur ──────────────────────────────────── */}
          <Route path="/fournisseur-dashboard" element={<FournisseurDashboard />} />

          {/* ── Opérationnelles ──────────────────────────────── */}
          <Route path="/cabotage"        element={<Cabotage />} />
          <Route path="/transport"       element={<Transport />} />
          <Route path="/suivi-temps-reel" element={<SuiviTempsReel />} />

          {/* ── Sprint 4 ─────────────────────────────────────── */}
          <Route path="/factures"      element={<Factures />} />
          <Route path="/export-import" element={<ExportImport />} />
          <Route path="/conformite"    element={<Conformite />} />
          <Route path="/historique"    element={<MobileOnly />} />

          {/* ── Sprint 5 — Mobile uniquement (tous rôles) ────── */}
          <Route path="/notifications"    element={<MobileOnly />} />
          <Route path="/penalites-retard" element={<MobileOnly />} />
          <Route path="/chatbot"          element={<MobileOnly />} />

        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}