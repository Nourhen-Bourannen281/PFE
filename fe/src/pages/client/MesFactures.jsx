import React, { useState,  } from 'react';
import '../../css/MesFactures.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const mockFactures = [
  {
    _id: 'FAC001',
    numeroFacture: 'FAC-2026-0001',
    numeroCommande: 'CMD-2026-0001',
    dateFacture: '2026-05-11',
    dateEcheance: '2026-06-10',
    montantHT: 320.000,
    montantTVA: 19.200,
    montantTTC: 339.200,
    statut: 'Payée',
    fournisseur: 'STEG',
    modePaiement: 'Carte bancaire',
    datePaiement: '2026-05-11',
    produits: [
      {
        id: 'P1',
        nom: 'Électricité Basse Tension',
        quantite: 1000,
        uniteMesure: 'kWh',
        prixUnitaire: 0.320,
        montant: 320.000
      }
    ]
  },
  {
    _id: 'FAC002',
    numeroFacture: 'FAC-2026-0002',
    numeroCommande: 'CMD-2026-0002',
    dateFacture: '2026-05-12',
    dateEcheance: '2026-06-11',
    montantHT: 150.000,
    montantTVA: 9.000,
    montantTTC: 159.000,
    statut: 'En attente',
    fournisseur: 'STEG',
    modePaiement: null,
    datePaiement: null,
    produits: [
      {
        id: 'P2',
        nom: 'Gaz Naturel Domestique',
        quantite: 500,
        uniteMesure: 'm³',
        prixUnitaire: 0.280,
        montant: 140.000
      }
    ]
  },
  {
    _id: 'FAC003',
    numeroFacture: 'FAC-2026-0003',
    numeroCommande: 'CMD-2026-0003',
    dateFacture: '2026-05-13',
    dateEcheance: '2026-06-12',
    montantHT: 500.000,
    montantTVA: 30.000,
    montantTTC: 530.000,
    statut: 'Payée',
    fournisseur: 'STIR',
    modePaiement: 'Espèces',
    datePaiement: '2026-05-13',
    produits: [
      {
        id: 'P3',
        nom: 'Essence Sans Plomb 95',
        quantite: 200,
        uniteMesure: 'Litre',
        prixUnitaire: 2.500,
        montant: 500.000
      }
    ]
  },
  {
    _id: 'FAC004',
    numeroFacture: 'FAC-2026-0004',
    numeroCommande: 'CMD-2026-0004',
    dateFacture: '2026-05-14',
    dateEcheance: '2026-06-13',
    montantHT: 875.750,
    montantTVA: 52.545,
    montantTTC: 928.295,
    statut: 'En retard',
    fournisseur: 'STEG',
    modePaiement: null,
    datePaiement: null,
    produits: [
      {
        id: 'P4',
        nom: 'Transformateur Électrique',
        quantite: 1,
        uniteMesure: 'Unité',
        prixUnitaire: 875.750,
        montant: 875.750
      }
    ]
  },
  {
    _id: 'FAC005',
    numeroFacture: 'FAC-2026-0005',
    numeroCommande: 'CMD-2026-0005',
    dateFacture: '2026-05-15',
    dateEcheance: '2026-06-14',
    montantHT: 245.300,
    montantTVA: 14.718,
    montantTTC: 260.018,
    statut: 'Payée',
    fournisseur: 'STIR',
    modePaiement: 'Carte bancaire',
    datePaiement: '2026-05-15',
    produits: [
      {
        id: 'P5',
        nom: 'Gasoil (Diesel)',
        quantite: 100,
        uniteMesure: 'Litre',
        prixUnitaire: 2.200,
        montant: 220.000
      },
      {
        id: 'P6',
        nom: 'Huile Moteur 10W40',
        quantite: 10,
        uniteMesure: 'Litre',
        prixUnitaire: 15.000,
        montant: 150.000
      }
    ]
  }
];

function MesFactures() {
  const [factures, setFactures] = useState(mockFactures);
  const [showModal, setShowModal] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState(null);
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [filtreFournisseur, setFiltreFournisseur] = useState('all');
  const [filtreMois, setFiltreMois] = useState('all');
  const [downloading, setDownloading] = useState(null);

  const formatPrix = (prix) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(prix);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusClass = (statut) => {
    switch (statut) {
      case 'Payée':
        return 'status-payee';
      case 'En attente':
        return 'status-attente';
      case 'En retard':
        return 'status-retard';
      default:
        return '';
    }
  };

  const getStatusIcon = (statut) => {
    switch (statut) {
      case 'Payée':
        return '✅';
      case 'En attente':
        return '⏳';
      case 'En retard':
        return '⚠️';
      default:
        return '📄';
    }
  };

  const getFournisseurIcon = (fournisseur) => {
    return fournisseur === 'STEG' ? '⚡' : '⛽';
  };

  const getFournisseurColor = (fournisseur) => {
    return fournisseur === 'STEG' ? 'steg' : 'stir';
  };

  // ✅ GÉNÉRATION PDF CORRIGÉE
  const telechargerFacture = (facture) => {
    setDownloading(facture._id);
    
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const marginX = 20;
      let yPosition = 20;

      // === ENTÊTE ===
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 60, 94);
      doc.text('FACTURE', doc.internal.pageSize.getWidth() / 2, yPosition, { align: 'center' });

      yPosition += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(facture.numeroFacture, doc.internal.pageSize.getWidth() / 2, yPosition, { align: 'center' });

      yPosition += 15;
      doc.setDrawColor(200, 200, 200);
      doc.line(marginX, yPosition, doc.internal.pageSize.getWidth() - marginX, yPosition);
      yPosition += 10;

      // === INFORMATIONS FACTURE ===
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 60, 94);
      doc.text('INFORMATIONS FACTURE', marginX, yPosition);

      yPosition += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      const infoFacture = [
        ['Numéro facture', facture.numeroFacture],
        ['Numéro commande', facture.numeroCommande],
        ['Date facture', formatDate(facture.dateFacture)],
        ['Date échéance', formatDate(facture.dateEcheance)],
        ['Fournisseur', `${getFournisseurIcon(facture.fournisseur)} ${facture.fournisseur}`],
        ['Statut', facture.statut],
        ...(facture.datePaiement ? [['Date paiement', formatDate(facture.datePaiement)]] : []),
        ...(facture.modePaiement ? [['Mode paiement', facture.modePaiement]] : [])
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Information', 'Valeur']],
        body: infoFacture,
        theme: 'striped',
        headStyles: { fillColor: [26, 60, 94], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { cellWidth: 110 } },
        margin: { left: marginX, right: marginX }
      });

      yPosition = doc.lastAutoTable.finalY + 10;

      // === PRODUITS ===
      if (facture.produits && facture.produits.length > 0) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(26, 60, 94);
        doc.text('PRODUITS / SERVICES', marginX, yPosition);

        yPosition += 7;

        const produitsData = facture.produits.map((p, index) => [
          index + 1,
          p.nom,
          `${p.quantite} ${p.uniteMesure}`,
          `${p.prixUnitaire.toFixed(3)} TND`,
          `${p.montant.toFixed(3)} TND`
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['#', 'Description', 'Quantité', 'Prix unitaire', 'Total']],
          body: produitsData,
          theme: 'striped',
          headStyles: { fillColor: [26, 60, 94], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
          bodyStyles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 70 },
            2: { cellWidth: 30, halign: 'center' },
            3: { cellWidth: 40, halign: 'right' },
            4: { cellWidth: 40, halign: 'right' }
          },
          margin: { left: marginX, right: marginX }
        });

        yPosition = doc.lastAutoTable.finalY + 10;
      }

      // === MONTANTS ===
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 60, 94);
      doc.text('RÉCAPITULATIF', marginX, yPosition);

      yPosition += 7;

      const montantsInfo = [
        ['Montant HT', `${facture.montantHT.toFixed(3)} TND`],
        ['TVA (19%)', `${facture.montantTVA.toFixed(3)} TND`],
        ['Montant TTC', `${facture.montantTTC.toFixed(3)} TND`, facture.statut === 'Payée' ? '✓ PAYÉE' : 'À PAYER']
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Désignation', 'Montant', 'Statut']],
        body: montantsInfo,
        theme: 'striped',
        headStyles: { fillColor: [26, 60, 94], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 }, 1: { cellWidth: 60, halign: 'right' }, 2: { cellWidth: 50, halign: 'center' } },
        margin: { left: marginX, right: marginX }
      });

      // === PIED DE PAGE ===
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Généré le ${new Date().toLocaleString('fr-FR')}`,
        marginX,
        doc.internal.pageSize.getHeight() - 10
      );
      doc.text(
        `Facture ${facture.numeroFacture}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
      doc.text(
        `Page 1/1`,
        doc.internal.pageSize.getWidth() - marginX,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'right' }
      );

      // === SAUVEGARDE DU FICHIER ===
      const fileName = `Facture_${facture.numeroFacture}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      // Notification de succès
      alert(`✅ Facture ${facture.numeroFacture} téléchargée avec succès !`);
      
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      alert(`❌ Erreur lors du téléchargement de la facture ${facture.numeroFacture}`);
    } finally {
      setDownloading(null);
    }
  };

  const handlePayer = (facture) => {
    setSelectedFacture(facture);
    setShowModal(true);
  };

  const confirmerPaiement = () => {
    const updatedFactures = factures.map(facture => {
      if (facture._id === selectedFacture._id) {
        return {
          ...facture,
          statut: 'Payée',
          modePaiement: 'Carte bancaire',
          datePaiement: new Date().toISOString().split('T')[0]
        };
      }
      return facture;
    });
    
    setFactures(updatedFactures);
    setShowModal(false);
    setSelectedFacture(null);
    alert(`✅ Paiement de la facture ${selectedFacture.numeroFacture} effectué avec succès !`);
  };

  const getFacturesFiltrees = () => {
    return factures.filter(facture => {
      if (filtreStatut !== 'all' && facture.statut !== filtreStatut) return false;
      if (filtreFournisseur !== 'all' && facture.fournisseur !== filtreFournisseur) return false;
      if (filtreMois !== 'all') {
        const dateFacture = new Date(facture.dateFacture);
        const moisAnnee = `${dateFacture.getMonth() + 1}/${dateFacture.getFullYear()}`;
        if (moisAnnee !== filtreMois) return false;
      }
      return true;
    });
  };

  const stats = {
    total: factures.length,
    payees: factures.filter(f => f.statut === 'Payée').length,
    enAttente: factures.filter(f => f.statut === 'En attente').length,
    enRetard: factures.filter(f => f.statut === 'En retard').length,
    montantTotal: factures.reduce((sum, f) => sum + f.montantTTC, 0),
    montantImpaye: factures
      .filter(f => f.statut !== 'Payée')
      .reduce((sum, f) => sum + f.montantTTC, 0)
  };

  const facturesFiltrees = getFacturesFiltrees();

  const moisUniques = [...new Set(factures.map(f => {
    const date = new Date(f.dateFacture);
    return `${date.getMonth() + 1}/${date.getFullYear()}`;
  }))].sort().reverse();

  return (
    <div className="mes-factures-page">
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>📄 Mes Factures</h1>
            <p>Gérez et suivez toutes vos factures STEG et STIR</p>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="factures-stats">
        <div className="stat-card total">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Total Factures</p>
          </div>
        </div>
        <div className="stat-card payee">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{stats.payees}</h3>
            <p>Payées</p>
          </div>
        </div>
        <div className="stat-card attente">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>{stats.enAttente}</h3>
            <p>En attente</p>
          </div>
        </div>
        <div className="stat-card retard">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <h3>{stats.enRetard}</h3>
            <p>En retard</p>
          </div>
        </div>
        <div className="stat-card montant">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>{formatPrix(stats.montantTotal)}</h3>
            <p>Total TTC</p>
          </div>
        </div>
        <div className="stat-card impaye">
          <div className="stat-icon">❌</div>
          <div className="stat-info">
            <h3>{formatPrix(stats.montantImpaye)}</h3>
            <p>Impayé</p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="filtres-section">
        <div className="filtre-group">
          <label>📌 Statut :</label>
          <div className="filtre-buttons">
            <button 
              className={`filtre-btn ${filtreStatut === 'all' ? 'active' : ''}`}
              onClick={() => setFiltreStatut('all')}
            >
              Tous
            </button>
            <button 
              className={`filtre-btn ${filtreStatut === 'Payée' ? 'active' : ''}`}
              onClick={() => setFiltreStatut('Payée')}
            >
              Payées
            </button>
            <button 
              className={`filtre-btn ${filtreStatut === 'En attente' ? 'active' : ''}`}
              onClick={() => setFiltreStatut('En attente')}
            >
              En attente
            </button>
            <button 
              className={`filtre-btn ${filtreStatut === 'En retard' ? 'active' : ''}`}
              onClick={() => setFiltreStatut('En retard')}
            >
              En retard
            </button>
          </div>
        </div>

        <div className="filtre-group">
          <label>🏢 Fournisseur :</label>
          <div className="filtre-buttons">
            <button 
              className={`filtre-btn ${filtreFournisseur === 'all' ? 'active' : ''}`}
              onClick={() => setFiltreFournisseur('all')}
            >
              Tous
            </button>
            <button 
              className={`filtre-btn steg-btn ${filtreFournisseur === 'STEG' ? 'active' : ''}`}
              onClick={() => setFiltreFournisseur('STEG')}
            >
              ⚡ STEG
            </button>
            <button 
              className={`filtre-btn stir-btn ${filtreFournisseur === 'STIR' ? 'active' : ''}`}
              onClick={() => setFiltreFournisseur('STIR')}
            >
              ⛽ STIR
            </button>
          </div>
        </div>

        <div className="filtre-group">
          <label>📅 Mois :</label>
          <div className="filtre-buttons">
            <button 
              className={`filtre-btn ${filtreMois === 'all' ? 'active' : ''}`}
              onClick={() => setFiltreMois('all')}
            >
              Tous
            </button>
            {moisUniques.map(mois => (
              <button 
                key={mois}
                className={`filtre-btn ${filtreMois === mois ? 'active' : ''}`}
                onClick={() => setFiltreMois(mois)}
              >
                {mois}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste des factures */}
      <div className="factures-container">
        {facturesFiltrees.length === 0 ? (
          <div className="empty-factures">
            <div className="empty-icon">📄</div>
            <h3>Aucune facture trouvée</h3>
            <p>Essayez de modifier vos filtres</p>
          </div>
        ) : (
          facturesFiltrees.map((facture) => (
            <div key={facture._id} className={`facture-card ${getFournisseurColor(facture.fournisseur)}`}>
              <div className="facture-header">
                <div className="facture-info">
                  <h3>{facture.numeroFacture}</h3>
                  <span className="facture-commande">
                    Commande: {facture.numeroCommande}
                  </span>
                </div>
                <div className={`facture-status ${getStatusClass(facture.statut)}`}>
                  {getStatusIcon(facture.statut)} {facture.statut}
                </div>
              </div>

              <div className="facture-details">
                <div className="detail-row">
                  <span className="detail-label">📅 Date facture:</span>
                  <span>{formatDate(facture.dateFacture)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">⏰ Date échéance:</span>
                  <span className={new Date(facture.dateEcheance) < new Date() && facture.statut !== 'Payée' ? 'date-retard' : ''}>
                    {formatDate(facture.dateEcheance)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">🏢 Fournisseur:</span>
                  <span className={`fournisseur-badge ${facture.fournisseur === 'STEG' ? 'steg-badge' : 'stir-badge'}`}>
                    {getFournisseurIcon(facture.fournisseur)} {facture.fournisseur}
                  </span>
                </div>
                {facture.datePaiement && (
                  <div className="detail-row">
                    <span className="detail-label">✅ Date paiement:</span>
                    <span>{formatDate(facture.datePaiement)}</span>
                  </div>
                )}
                {facture.modePaiement && (
                  <div className="detail-row">
                    <span className="detail-label">💳 Mode paiement:</span>
                    <span>{facture.modePaiement}</span>
                  </div>
                )}
              </div>

              <div className="facture-produits">
                <h4>Produits commandés</h4>
                <div className="produits-list">
                  {facture.produits.map((produit, index) => (
                    <div key={index} className="facture-produit-item">
                      <div className="produit-nom">⚡ {produit.nom}</div>
                      <div className="produit-detail">
                        {produit.quantite} {produit.uniteMesure} × {formatPrix(produit.prixUnitaire)}
                      </div>
                      <div className="produit-montant">{formatPrix(produit.montant)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="facture-montants">
                <div className="montant-line">
                  <span>Montant HT:</span>
                  <span>{formatPrix(facture.montantHT)}</span>
                </div>
                <div className="montant-line">
                  <span>TVA (19%):</span>
                  <span>{formatPrix(facture.montantTVA)}</span>
                </div>
                <div className="montant-line total">
                  <span>Total TTC:</span>
                  <strong>{formatPrix(facture.montantTTC)}</strong>
                </div>
              </div>

              <div className="facture-actions">
                <button 
                  className="btn-telecharger"
                  onClick={() => telechargerFacture(facture)}
                  disabled={downloading === facture._id}
                >
                  {downloading === facture._id ? '⏳ Génération...' : '📥 Télécharger PDF'}
                </button>
                {facture.statut !== 'Payée' && (
                  <button 
                    className="btn-payer"
                    onClick={() => handlePayer(facture)}
                  >
                    💳 Payer maintenant
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de paiement */}
      {showModal && selectedFacture && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💳 Paiement de la facture</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="payment-info">
                <p><strong>Facture:</strong> {selectedFacture.numeroFacture}</p>
                <p><strong>Montant à payer:</strong> {formatPrix(selectedFacture.montantTTC)}</p>
                <p><strong>Fournisseur:</strong> {getFournisseurIcon(selectedFacture.fournisseur)} {selectedFacture.fournisseur}</p>
              </div>
              
              <div className="payment-methods">
                <h3>Mode de paiement</h3>
                <div className="payment-options">
                  <label className="payment-option">
                    <input type="radio" name="payment" defaultChecked />
                    <span>💳 Carte bancaire</span>
                  </label>
                  <label className="payment-option">
                    <input type="radio" name="payment" />
                    <span>🏦 Virement bancaire</span>
                  </label>
                  <label className="payment-option">
                    <input type="radio" name="payment" />
                    <span>📱 Paiement mobile</span>
                  </label>
                </div>
              </div>

              <div className="payment-summary">
                <div className="summary-line">
                  <span>Montant TTC:</span>
                  <span>{formatPrix(selectedFacture.montantTTC)}</span>
                </div>
                <div className="summary-line total">
                  <span>Total à payer:</span>
                  <strong>{formatPrix(selectedFacture.montantTTC)}</strong>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-annuler" onClick={() => setShowModal(false)}>
                Annuler
              </button>
              <button className="btn-confirmer" onClick={confirmerPaiement}>
                Confirmer le paiement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MesFactures;