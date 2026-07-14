// pages/admin/referentiel/Referentiel.jsx
import React, { useState } from 'react';
import Pays from './Pays';
import Banques from './Banques';
import Navires from './Navires';
import ModesPaiement from './ModesPaiement';
import TypesFacture from './TypesFacture';
import Products from './Products';
import Ports from './Ports';
import '../../../css/Referentiels.css';

function Referentiel() {
  const [activeTab, setActiveTab] = useState('products');

  const tabs = [
    { id: 'products', label: 'Produits STEG & STIR' },
    { id: 'pays', label: 'Pays' },
    { id: 'banques', label: 'Banques' },
    { id: 'navires', label: 'Navires' },
    {id: 'ports', label : 'Ports '},
    { id: 'modes-paiement', label: 'Modes de Paiement' },
    { id: 'types-facture', label: 'Types de Facture' }
  ];

  const tabComponents = {
    'products': <Products />,
    'pays': <Pays />,
    'banques': <Banques />,
    'navires': <Navires />,
    'ports' : <Ports/>,
    'modes-paiement': <ModesPaiement />,
    'types-facture': <TypesFacture />
  };

  const currentComponent = tabComponents[activeTab];

  return (
    <main className="page-referentiels">
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-title">
            <h1>Gestion du Référentiel</h1>
            <p className="page-subtitle">Paramétrage général - Entreprise Pétrolière (STEG/STIR)</p>
          </div>
        </div>
      </div>

      <div className="tabs-container">
        <div className="tabs-wrapper">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="tab-content">
        {currentComponent}
      </div>
    </main>
  );
}

export default Referentiel;