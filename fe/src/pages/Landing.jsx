import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../css/Landing.css';

// Importer le logo avec gestion d'erreur
import logoTap from '../assets/logo-etap.png'; // À ajuster selon votre chemin d'image

function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('presentation');
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const openETAPWebsite = () => {
    window.open('https://www.SMART-TRADE 360°.com.tn/', '_blank');
  };

  // Données pour l'évolution de l'effectif
  const effectifEvolution = [
    { year: 2016, total: 700 },
    { year: 2017, total: 720 },
    { year: 2018, total: 710 },
    { year: 2019, total: 730 },
    { year: 2020, total: 715 },
    { year: 2021, total: 725 },
    { year: 2022, total: 740 },
    { year: 2023, total: 735 },
    { year: 2024, total: 728 },
    { year: 2025, total: 728 }
  ];

  // Données pour les dépenses par thème de formation
  const trainingThemes = [
    { name: "Forage Géologie Réservoir et Production", percentage: 25, color: "#3b82f6" },
    { name: "Informatique et logiciel", percentage: 15, color: "#10b981" },
    { name: "Langues", percentage: 10, color: "#f59e0b" },
    { name: "Gestion Management et Commerce", percentage: 12, color: "#ef4444" },
    { name: "Conférences Congrès Colloques", percentage: 8, color: "#8b5cf6" },
    { name: "Autres", percentage: 30, color: "#6b7280" }
  ];

  // Trouver la valeur maximale pour l'échelle du graphique
  const maxEffectif = Math.max(...effectifEvolution.map(e => e.total));

  return (
    <div className="landing">
      {/* ========== NAVIGATION AVEC LOGO ========== */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="landing-nav-inner">
          {/* Logo ajouté à gauche avec fallback */}
          <div className="logo-nav">
            {!logoError ? (
              <img 
                src={logoTap} 
                alt="Logo SMART-TRADE 360°" 
                className="logo-img"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="logo-placeholder">SMART-TRADE 360° </div>
            )}
          </div>
          
          {/* Logo texte existant */}
          <div 
            className="landing-logo" 
            onClick={openETAPWebsite}
            style={{ cursor: 'pointer' }}
          >
            <div className="landing-logo-text">
              <span>SMART-TRADE 360°</span>
              <small>Entreprise Tunisienne d'Activités Pétrolières</small>
            </div>
          </div>
          
          {/* Liens de navigation */}
          <ul className="landing-nav-links">
            <li><a href="#qui-sommes-nous">Qui sommes-nous ?</a></li>
            <li><a href="#mission">Mission</a></li>
            <li><a href="#vision">Vision & Valeurs</a></li>
            <li><a href="#capital-humain">Capital humain</a></li>
            <li><a href="#laboratoires">Laboratoires</a></li>
            <li><a href="#smart-trade">SMART-TRADE 360°</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
          
          {/* CTA Button */}
          <Link to="/login" className="landing-cta-nav">Connexion</Link>
        </div>
      </nav>

      {/* ========== HERO SECTION AVEC BACKGROUND ========== */}
      <section className="hero">
        <div className="hero-content">
          <div 
            className="hero-badge" 
            onClick={openETAPWebsite}
            style={{ cursor: 'pointer' }}
          >
            Plateforme Officielle SMART-TRADE 360° 
          </div>
          <h1>Entreprise Tunisienne <span>d'Activités Pétrolières</span></h1>
          <p>
            Plateforme assure l'exploration, la production et la commercialisation des hydrocarbures 
            pour son propre compte et pour le compte de l'État tunisien.
          </p>
          <div className="hero-buttons">
            <Link to="/login" className="btn-hero-primary">
              Accéder au Dashboard
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
            <a href="#qui-sommes-nous" className="btn-hero-secondary">Découvrir la SMART-TRADE 360°</a>
          </div>
        </div>
      </section>

      {/* ========== QUI SOMMES-NOUS SECTION ========== */}
      <section className="qui-sommes-nous" id="qui-sommes-nous">
        <div className="section-header">
          <div className="section-label">Présentation</div>
          <h2>Qui sommes-nous ?</h2>
        </div>

        <div className="presentation-tabs">
          <button 
            className={`tab-btn ${activeTab === 'presentation' ? 'active' : ''}`}
            onClick={() => setActiveTab('presentation')}
          >
            📋 Présentation Générale
          </button>
          <button 
            className={`tab-btn ${activeTab === 'infos' ? 'active' : ''}`}
            onClick={() => setActiveTab('infos')}
          >
            📊 Informations Légales
          </button>
          <button 
            className={`tab-btn ${activeTab === 'textes' ? 'active' : ''}`}
            onClick={() => setActiveTab('textes')}
          >
            📜 Textes Fondateurs
          </button>
        </div>

        {/* TAB: Présentation Générale */}
        {activeTab === 'presentation' && (
          <div className="presentation-content">
            <div className="presentation-text">
              <h3>L'Entreprise Tunisienne d'Activités Pétrolières « SMART-TRADE 360° »</h3>
              <p>
                La SMART-TRADE 360° a été créée en vertu de la <strong>Loi N° 72-22 du 10 Mars 1972</strong>, 
                elle est entrée en activité effective en 1974 (déclaration d'existence du 01/07/1974 
                et inscription au Registre de Commerce du 16/07/1974).
              </p>
              <p>
                La SMART-TRADE 360° est classée conformément au <strong>Décret N° 97-564 du 31 mars 1997</strong> 
                parmi les établissements publics à caractère non administratif (EPNA), sous tutelle 
                du <strong>Ministère de l'Industrie, des Mines et de l'Energie</strong>.
              </p>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Secteur Economique :</span>
                  <span>Industries Pétrolières</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Secteur d'activités :</span>
                  <span>Exploration, Production & Commercialisation des Hydrocarbures en Tunisie</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Produits :</span>
                  <span>Pétrole Brut, Gaz Naturel et GPL</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Informations Légales */}
        {activeTab === 'infos' && (
          <div className="infos-content">
            <h3>Informations Légales</h3>
            <div className="legal-grid">
              <div className="legal-card">
                <span className="legal-icon">📝</span>
                <span className="legal-label">Registre de Commerce</span>
                <span className="legal-value">C 144 1998</span>
              </div>
              <div className="legal-card">
                <span className="legal-icon">🆔</span>
                <span className="legal-label">Identifiant en Douane</span>
                <span className="legal-value">121 892 B</span>
              </div>
              <div className="legal-card">
                <span className="legal-icon">💰</span>
                <span className="legal-label">Matricule Fiscale</span>
                <span className="legal-value">02766 BAM 000</span>
              </div>
            </div>
            <div className="address-info">
              <h4>📍 Siège Social</h4>
              <p>54, Avenue Mohamed V - 1002 Tunis, Tunisie</p>
              <p>📞 Tel : (+216) 71 28 50 97</p>
              <p>📠 Fax : (+216) 71 28 52 80</p>
              <p className="update-date">Mis à jour le 17/02/2025 11:49</p>
            </div>
          </div>
        )}

        {/* TAB: Textes Fondateurs */}
        {activeTab === 'textes' && (
          <div className="textes-content">
            <h3>Textes Fondateurs</h3>
            <div className="textes-list">
              <div className="texte-card">
                <span className="texte-icon">📜</span>
                <div>
                  <h4>Décret N° 73-173 du 16 Avril 1973</h4>
                  <p>Portant organisation et fonctionnement de l'SMART-TRADE 360°</p>
                </div>
              </div>
              <div className="texte-card">
                <span className="texte-icon">📜</span>
                <div>
                  <h4>Décret N° 88-2050 du 19 Décembre 1988</h4>
                  <p>Modifiant le décret 73-173 portant organisation du conseil d'administration</p>
                </div>
              </div>
              <div className="texte-card">
                <span className="texte-icon">📜</span>
                <div>
                  <h4>Loi N° 89-9 du 01 Février 1989</h4>
                  <p>Modifiée & complétée par la loi N° 94-102 et N° 96-74 sur les participations et entreprises publiques</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ========== MISSION SECTION ========== */}
      <section className="mission" id="mission">
        <div className="section-header">
          <div className="section-label">Notre Mission</div>
          <h2>Acteur Majeur du Secteur Énergétique Tunisien</h2>
        </div>

        <div className="mission-grid">
          <div className="mission-card">
            <div className="mission-icon">⛽</div>
            <h3>Exploration & Production</h3>
            <p>L'exploration, la production et la commercialisation des hydrocarbures pour son propre compte et pour le compte de l'État.</p>
          </div>
          <div className="mission-card">
            <div className="mission-icon">🏦</div>
            <h3>Gestion du Patrimoine</h3>
            <p>La gestion du patrimoine national dans le domaine des hydrocarbures.</p>
          </div>
          <div className="mission-card">
            <div className="mission-icon">📊</div>
            <h3>Études Stratégiques</h3>
            <p>La conduite et la réalisation de toute étude relative aux activités pétrolières.</p>
          </div>
          <div className="mission-card">
            <div className="mission-icon">🎓</div>
            <h3>Formation Continue</h3>
            <p>La formation des cadres tunisiens dans les différentes branches de l'industrie pétrolière.</p>
          </div>
        </div>
      </section>

      {/* ========== VISION & VALEURS SECTION ========== */}
      <section className="vision" id="vision">
        <div className="section-header">
          <div className="section-label">Vision & Valeurs</div>
          <h2>Notre Engagement pour l'Excellence</h2>
        </div>

        <div className="vision-container">
          <div className="vision-box">
            <h3>Notre Vision</h3>
            <div className="vision-grid">
              <div className="vision-item"><span>🎯</span><p>La relance et la promotion de l'exploration</p></div>
              <div className="vision-item"><span>📈</span><p>L'augmentation de la production</p></div>
              <div className="vision-item"><span>🔄</span><p>La transformation de SMART-TRADE 360°</p></div>
              <div className="vision-item"><span>💰</span><p>La maîtrise des coûts</p></div>
            </div>
          </div>
          <div className="values-box">
            <h3>Nos Valeurs Fondamentales</h3>
            <div className="values-grid">
              <div className="value-item"><div className="value-icon">🤝</div><h4>Respect</h4></div>
              <div className="value-item"><div className="value-icon">👥</div><h4>Esprit d'équipe</h4></div>
              <div className="value-item"><div className="value-icon">⚡</div><h4>Discipline</h4></div>
              <div className="value-item"><div className="value-icon">🔒</div><h4>Intégrité</h4></div>
              <div className="value-item"><div className="value-icon">🏆</div><h4>Reconnaissance</h4></div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CAPITAL HUMAIN SECTION ========== */}
      <section className="capital-humain" id="capital-humain">
        <div className="section-header">
          <div className="section-label">Ressources Humaines</div>
          <h2>Capital Humain</h2>
        </div>

        {/* Indicateurs RH 2025 */}
        <div className="rh-indicators">
          <h3 className="rh-title">INDICATEURS RH 2025</h3>
          <div className="rh-stats-grid">
            <div className="rh-stat-card">
              <div className="rh-stat-value">69%</div>
              <div className="rh-stat-label">Taux d'encadrement</div>
            </div>
            <div className="rh-stat-card">
              <div className="rh-stat-value">59%</div>
              <div className="rh-stat-label">Taux des cadres techniques</div>
              <div className="rh-stat-detail">par rapport au total des cadres</div>
            </div>
            <div className="rh-stat-card">
              <div className="rh-stat-value">77%</div>
              <div className="rh-stat-label">Taux du personnel actif</div>
            </div>
          </div>
        </div>

        {/* Formation Stats */}
        <div className="formation-section">
          <h3>FORMATION 2025</h3>
          <div className="formation-cards">
            <div className="formation-card">
              <div className="value">1 140 263 DT</div>
              <div className="label">Coût Total de la formation</div>
            </div>
            <div className="formation-card">
              <div className="value">3.4 jours</div>
              <div className="label">Nombre moyen de jours de formation par agent</div>
            </div>
            <div className="formation-card">
              <div className="value">2 061 jours</div>
              <div className="label">Nombre de jours de formation</div>
            </div>
          </div>
        </div>

        {/* Dépenses par thème de formation */}
        <div className="training-themes">
          <h4>Dépenses par thème de formation 2025 (%)</h4>
          <div className="themes-grid">
            {trainingThemes.map((theme, index) => (
              <div key={index} className="theme-item">
                <div className="theme-name">{theme.name}</div>
                <div className="theme-bar">
                  <div className="theme-bar-fill" style={{ width: `${theme.percentage}%`, backgroundColor: theme.color }}></div>
                </div>
                <div className="theme-percentage">{theme.percentage}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Répartition de l'effectif */}
        <div className="effectif-repartition">
          <h3>RÉPARTITION DE L'EFFECTIF AVRIL 2026</h3>
          <div className="total-effectif">
            <div className="total-value">728</div>
            <div className="total-label">Effectif Total</div>
          </div>
          <div className="repartition-bars">
            <div className="repartition-bar-item">
              <div className="repartition-bar-label">
                <span>Cadre</span>
                <span>69%</span>
              </div>
              <div className="repartition-bar-bg">
                <div className="repartition-bar-fill fill-cadre">69%</div>
              </div>
            </div>
            <div className="repartition-bar-item">
              <div className="repartition-bar-label">
                <span>Maîtrise</span>
                <span>14%</span>
              </div>
              <div className="repartition-bar-bg">
                <div className="repartition-bar-fill fill-maitrise">14%</div>
              </div>
            </div>
            <div className="repartition-bar-item">
              <div className="repartition-bar-label">
                <span>Exécution</span>
                <span>18%</span>
              </div>
              <div className="repartition-bar-bg">
                <div className="repartition-bar-fill fill-execution">18%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Évolution de l'effectif */}
        <div className="evolution-effectif">
          <h3>Évolution de l'effectif</h3>
          <div className="evolution-chart">
            <div className="chart-bars">
              {effectifEvolution.map((item, index) => {
                const height = ((item.total - 600) / (maxEffectif - 600)) * 150 + 40;
                return (
                  <div key={index} className="chart-bar-container">
                    <div className="chart-bar" style={{ height: `${height}px` }}>
                      <span className="chart-bar-value">{item.total}</span>
                    </div>
                    <div className="chart-bar-label">{item.year}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bilans Sociaux */}
        <div className="bilans-sociaux-section">
          <h3>Bilans Sociaux</h3>
          <p>Consultez nos rapports annuels sur les ressources humaines</p>
          <div className="bilans-links">
            <a href="https://www.SMART-TRADE 360°.com.tn/storage/BilanSocial2022.pdf" target="_blank" rel="noopener noreferrer" className="bilan-link pdf">
              📄 Bilan Social 2022
            </a>
            <a href="https://www.SMART-TRADE 360°.com.tn/storage/BilanSocial2023.pdf" target="_blank" rel="noopener noreferrer" className="bilan-link pdf">
              📄 Bilan Social 2023
            </a>
          </div>
        </div>
      </section>

      {/* ========== LABORATOIRES SECTION ========== */}
      <section className="laboratoires" id="laboratoires">
        <div className="section-header">
          <div className="section-label">Recherche & Développement</div>
          <h2>Activités des Laboratoires</h2>
        </div>

        <div className="laboratoires-content">
          <div className="services-list">
            <h3>Prestations externes et internes</h3>
            <ul className="lab-list">
              <li>Analyses des huiles brutes, de gaz et des dépôts solides organiques</li>
              <li>🧪 Études de compatibilité des huiles brutes</li>
              <li>⚙️ Evaluation de la performance des inhibiteurs de paraffines</li>
              <li>💧 Analyses des eaux et des dépôts solides inorganiques</li>
              <li>🔍 Études de compatibilité des eaux</li>
              <li>🌱 Analyse d'échantillons de sol et de boue</li>
              <li>📊 Études de géochimie organique</li>
              <li>🦴 Études biostratigraphiques</li>
              <li>📈 Analyses pétrophysiques</li>
              <li>🏔️ Études sédimentologiques et pétrographiques</li>
              <li> Analyses au Microscope Électronique à Balayage (MEB)</li>
            </ul>
          </div>
          <div className="laboratoire-info">
            <h3>À propos des Laboratoires</h3>
            <p className="detail-info">Les laboratoires continuent à assurer des prestations en interne et pour le compte de tiers. L'équipe HSE assure le suivi de l'étude de rénovation de l'installation de distribution des gaz des laboratoires au Centre de Recherche et Développement Pétroliers « CRDP ».</p>
            <p className="visites-info">🎓 Les laboratoires de l'SMART-TRADE 360° offrent des visites guidées pour les sociétés pétrolières et les institutions universitaires, assurant ainsi le rôle actif de l'SMART-TRADE 360° dans la formation des étudiants.</p>
            <a
              href="https://www.SMART-TRADE 360°.com.tn/storage/crdp/SMART-TRADE-360_Laboratories_Services_2024.pdf"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                width: 'fit-content',
                marginTop: '16px',
                padding: '12px 28px',
                background: 'linear-gradient(135deg, #e53e3e, #c53030)',
                color: '#ffffff',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '0.9rem',
                textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(197,48,48,0.38)',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              📥 Télécharger la liste des services
            </a>
          </div>
        </div>
      </section>

      {/* ========== CONTACT SECTION ========== */}
      <section className="contact" id="contact">
        <div className="section-header">
          <div className="section-label">Nous Contacter</div>
          <h2>Nos Sièges Sociaux</h2>
          <p>Plusieurs sites à votre disposition</p>
        </div>

        <div className="contact-grid">
          <div className="contact-card">
            <div className="contact-icon">🏢</div>
            <h3>Siège Social Principal</h3>
            <div className="contact-info">
              <p>📍 54, Avenue Mohamed V - 1002 Tunis</p>
              <p>📞 (+216) 71 28 50 97</p>
            </div>
          </div>
          <div className="contact-card">
            <div className="contact-icon">🏛️</div>
            <h3>Kheireddine Pacha</h3>
            <div className="contact-info">
              <p>📍 27 bis, Av. Kheireddine Pacha, Tunis 1002</p>
              <p>📞 (+216) 70 24 90 00</p>
            </div>
          </div>
          <div className="contact-card">
            <div className="contact-icon">🏭</div>
            <h3>CRDP - Charguia</h3>
            <div className="contact-info">
              <p>📍 4 Rue des entrepreneurs - 2035 Charguia II Ariana</p>
              <p>📞 (+216) 70 83 84 40</p>
            </div>
          </div>
        </div>

        <div className="contact-email">
          <div className="email-card">
            <span>✉️</span>
            <p>Pour toute demande d'information :</p>
            <a href="mailto:contact@SMART-TRADE 360°.com.tn">contact@SMART-TRADE 360°.com.tn</a>
          </div>
        </div>
      </section>

      {/* ========== SMART-TRADE 360°  ========== */}
      <section className="decrypt-section" id="smart-trade">
        <div className="section-header">
          <div className="section-label">Comprendre la plateforme</div>
          <h2 className="section-title">SMART-TRADE 360° </h2>
          
        </div>

        <div className="decrypt-words">

          {/* SMART */}
          <div className="decrypt-card decrypt-smart">
            <div className="decrypt-letter">S</div>
            <div className="decrypt-body">
              <div className="decrypt-tag">Mot 1 / 3</div>
              <h3 className="decrypt-word">SMART</h3>
              <p className="decrypt-meaning">Intelligent, connecté, moderne.</p>
              <p className="decrypt-desc">
                Indique que la plateforme utilise des technologies avancées — pas un simple logiciel,
                mais un système qui pense, analyse et aide à décider grâce à l'automatisation
                et aux tableaux de bord en temps réel.
              </p>
              <div className="decrypt-tags-row">
                <span className="dtag">🧠 Automatisation</span>
                <span className="dtag">📊 Tableaux de bord</span>
                <span className="dtag">⚡ Temps réel</span>
              </div>
            </div>
          </div>

          {/* TRADE */}
          <div className="decrypt-card decrypt-trade">
            <div className="decrypt-letter">T</div>
            <div className="decrypt-body">
              <div className="decrypt-tag">Mot 2 / 3</div>
              <h3 className="decrypt-word">TRADE</h3>
              <p className="decrypt-meaning">Commerce / Échange commercial.</p>
              <p className="decrypt-desc">
                Représente le cœur du projet : gestion des ventes, achats, clients, stocks,
                factures — toute l'activité commerciale au quotidien centralisée
                en un seul endroit accessible à tous les acteurs.
              </p>
              <div className="decrypt-tags-row">
                <span className="dtag">🛒 Ventes & Achats</span>
                <span className="dtag">🏢 Clients</span>
                <span className="dtag">📦 Stocks & Factures</span>
              </div>
            </div>
          </div>

          {/* 360° */}
          <div className="decrypt-card decrypt-360">
            <div className="decrypt-letter">°</div>
            <div className="decrypt-body">
              <div className="decrypt-tag">Mot 3 / 3</div>
              <h3 className="decrypt-word">360°</h3>
              <p className="decrypt-meaning">Vision complète, sans angle mort.</p>
              <p className="decrypt-desc">
                Le ° symbolise un cercle parfait — la plateforme tourne autour de votre business
                et couvre absolument tout, du web au mobile, de la sécurité à la traçabilité.
              </p>
              <div className="decrypt-features-grid">
                <div className="decrypt-feature-item">
                  <span className="dfi-icon">🌐</span>
                  <span className="dfi-text">Web + Mobile <small>omnicanal</small></span>
                </div>
                <div className="decrypt-feature-item">
                  <span className="dfi-icon">🔒</span>
                  <span className="dfi-text">Sécurité <small>authentification</small></span>
                </div>
                <div className="decrypt-feature-item">
                  <span className="dfi-icon">📦</span>
                  <span className="dfi-text">Traçabilité <small>QR Code</small></span>
                </div>
                <div className="decrypt-feature-item">
                  <span className="dfi-icon">📊</span>
                  <span className="dfi-text">Dashboard <small>décisionnel</small></span>
                </div>
                <div className="decrypt-feature-item">
                  <span className="dfi-icon">👥</span>
                  <span className="dfi-text">Clients, stocks <small>ventes, factures</small></span>
                </div>
                <div className="decrypt-feature-item">
                  <span className="dfi-icon">⚠️</span>
                  <span className="dfi-text">Pénalités <small>retard automatisé</small></span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Résumé final */}
        <div className="decrypt-summary">
          <div className="decrypt-summary-inner">
            <span className="decrypt-summary-logo">SMART</span>
            <span className="decrypt-summary-sep">+</span>
            <span className="decrypt-summary-logo">TRADE</span>
            <span className="decrypt-summary-sep">+</span>
            <span className="decrypt-summary-logo">360°</span>
            <span className="decrypt-summary-sep">=</span>
            <span className="decrypt-summary-result">Votre plateforme pétrolière tout-en-un</span>
          </div>
        </div>
      </section>

      {/* ========== CTA SECTION ========== */}
      <section className="cta-section">
        <div className="cta-card">
          <h2>Prêt à optimiser vos ressources ?</h2>
          <p>Rejoignez l'écosystème SMART-TRADE 360°  et transformez vos opérations commerciales en un avantage stratégique.</p>
          <Link to="/login" className="btn-hero-primary">
            Commencer l'expérience
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </Link>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <h3 onClick={openETAPWebsite} style={{ cursor: 'pointer' }}>SMART-TRADE 360°</h3>
            <p>Entreprise Tunisienne d'Activités Pétrolières</p>
          </div>
          <div className="footer-links">
            <a href="#qui-sommes-nous">Qui sommes-nous ?</a>
            <a href="#mission">Mission</a>
            <a href="#vision">Vision & Valeurs</a>
            <a href="#capital-humain">Capital humain</a>
            <a href="#laboratoires">Laboratoires</a>
            <a href="#contact">Contact</a>
          </div>
          <p className="footer-copyright">© 2026 SMART-TRADE 360° — Système de Gestion Intégré. Tous droits réservés.</p>
          <p className="footer-credit">Propulsé par l'Ingénierie MERN</p>
        </div>
      </footer>
    </div>
  );
}

export default Landing;