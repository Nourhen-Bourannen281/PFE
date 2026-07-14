// pages/MesCommandes.jsx - Version corrigée pour utiliser les bons champs
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import '../../css/MesCommandes.css';

function MesCommandes() {
  const [commandes, setCommandes] = useState([]);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [produitsDisponibles, setProduitsDisponibles] = useState([]);
  const [showCommandeModal, setShowCommandeModal] = useState(false);
  const [produitsSelectionnes, setProduitsSelectionnes] = useState([]);
  const [soumission, setSoumission] = useState(false);
  const [notes, setNotes] = useState('');
  const [conditionsPaiement, setConditionsPaiement] = useState('30 jours');
  const [dateLivraisonPrevue, setDateLivraisonPrevue] = useState('');

  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: 'http://localhost:5001/api',
      headers: { 'Content-Type': 'application/json' },
    });

    instance.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    return instance;
  }, []);

  // Charger les commandes
  const fetchCommandes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/commandes/mes-commandes');
      const data = response.data?.data || response.data || [];
      setCommandes(data);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur de chargement des commandes');
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Charger les produits depuis l'API
  const fetchProduits = useCallback(async () => {
    try {
      const response = await api.get('/products');
      let data = response.data?.data || response.data || [];
      
      // ✅ CORRECTION : Utiliser les bons champs du produit
      const produitsAvecPrix = data.map(p => ({
        ...p,
        // Le prix est dans 'prixUnitaire' (pas 'prixVente')
        prixReel: p.prixUnitaire || p.prixVente || p.prix || 0,
        // L'unité est dans 'unite'
        uniteReelle: p.unite || 'unité'
      }));
      
      console.log('Produits chargés:', produitsAvecPrix.map(p => ({ nom: p.nom, prix: p.prixReel, unite: p.uniteReelle })));
      setProduitsDisponibles(produitsAvecPrix);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
      toast.error('Erreur chargement des produits');
    }
  }, [api]);

  useEffect(() => {
    fetchCommandes();
    fetchProduits();
  }, [fetchCommandes, fetchProduits]);

  // Ajouter un produit - CORRIGÉ
  const ajouterProduit = (produit) => {
    console.log('Ajout produit:', produit);
    
    // ✅ Utiliser le bon champ pour le prix
    const prixUnitaire = produit.prixReel || produit.prixUnitaire || 0;
    
    if (prixUnitaire === 0) {
      toast.error(`Le produit ${produit.nom} n'a pas de prix défini. Veuillez contacter l'administrateur.`);
      return;
    }
    
    const existant = produitsSelectionnes.find(p => p.sousProduit === produit._id);
    
    if (existant) {
      setProduitsSelectionnes(prev => prev.map(p => 
        p.sousProduit === produit._id 
          ? { ...p, quantite: p.quantite + 1 }
          : p
      ));
    } else {
      setProduitsSelectionnes(prev => [...prev, {
        sousProduit: produit._id,
        nom: produit.nom,
        quantite: 1,
        prixUnitaire: prixUnitaire,  // ✅ Utiliser le prix récupéré
        tva: 19,  // TVA par défaut 19%
        remise: 0,
        unite: produit.uniteReelle || produit.unite || 'unité'
      }]);
    }
    
    toast.success(`${produit.nom} ajouté (${prixUnitaire.toLocaleString()} DT/${produit.uniteReelle || 'unité'})`);
  };

  // Modifier quantité
  const modifierQuantite = (index, nouvelleQuantite) => {
    if (nouvelleQuantite <= 0) {
      setProduitsSelectionnes(prev => prev.filter((_, i) => i !== index));
      return;
    }
    
    setProduitsSelectionnes(prev => prev.map((p, i) => 
      i === index ? { ...p, quantite: nouvelleQuantite } : p
    ));
  };

  // Supprimer un produit
  const supprimerProduit = (index) => {
    setProduitsSelectionnes(prev => prev.filter((_, i) => i !== index));
    toast.info('Produit retiré');
  };

  // Calculer les totaux
  const calculerTotaux = () => {
    let totalHT = 0;
    produitsSelectionnes.forEach(p => {
      totalHT += p.quantite * p.prixUnitaire;
    });
    const tva = totalHT * 0.19;
    const totalTTC = totalHT + tva;
    return { totalHT, totalTTC, tva };
  };

  const { totalHT, totalTTC, tva } = calculerTotaux();

  // Soumettre commande
  const soumettreCommande = async () => {
    if (produitsSelectionnes.length === 0) {
      toast.error('Ajoutez au moins un produit');
      return;
    }

    // Vérifier que tous les produits ont un prix valide
    const produitsSansPrix = produitsSelectionnes.filter(p => !p.prixUnitaire || p.prixUnitaire <= 0);
    if (produitsSansPrix.length > 0) {
      toast.error(`Certains produits n'ont pas de prix: ${produitsSansPrix.map(p => p.nom).join(', ')}`);
      return;
    }

    console.log('Soumission commande:', produitsSelectionnes);

    try {
      setSoumission(true);
      
      const commandeData = {
        produits: produitsSelectionnes.map(p => ({
          sousProduit: p.sousProduit,
          nom: p.nom,
          quantite: p.quantite,
          prixUnitaire: p.prixUnitaire,
          tva: p.tva || 19,
          remise: p.remise || 0
        })),
        notes: notes || '',
        conditionsPaiement: conditionsPaiement,
        dateLivraisonPrevue: dateLivraisonPrevue || undefined
      };
      
      console.log('Envoi au backend:', commandeData);
      
      const response = await api.post('/commandes', commandeData);
      
      if (response.data.success) {
        toast.success(response.data.message);
        // Réinitialiser
        setProduitsSelectionnes([]);
        setNotes('');
        setConditionsPaiement('30 jours');
        setDateLivraisonPrevue('');
        setShowCommandeModal(false);
        await fetchCommandes();
      }
    } catch (error) {
      console.error('Erreur détaillée:', error);
      console.error('Réponse erreur:', error.response?.data);
      
      const message = error.response?.data?.message || 'Erreur lors de la création';
      toast.error(message);
    } finally {
      setSoumission(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const getStatutClass = (statut) => {
    const classes = {
      'En attente': 'statut-attente',
      'Validée': 'statut-validee',
      'Refusée': 'statut-refusee',
      'Livrée': 'statut-livree'
    };
    return classes[statut] || '';
  };

  const getStatutIcon = (statut) => {
    const icons = {
      'En attente': '⏳',
      'Validée': '✅',
      'Refusée': '❌',
      'Livrée': '📦'
    };
    return icons[statut] || '📄';
  };

  return (
    <div className="commandes-page">
      <div className="commandes-header">
        <div className="header-left">
          <h2>📦 Mes Commandes</h2>
          <p>Consultez l'historique de vos commandes</p>
        </div>
        <button className="btn-nouveau" onClick={() => setShowCommandeModal(true)}>
          + Nouvelle Commande
        </button>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      ) : commandes.length === 0 ? (
        <div className="empty-state">
          <h3>📭 Aucune commande</h3>
          <p>Vous n'avez pas encore passé de commande</p>
          <button className="btn-commander" onClick={() => setShowCommandeModal(true)}>
            Passer une commande
          </button>
        </div>
      ) : (
        <div className="commandes-grid">
          {commandes.map((commande) => (
            <div key={commande._id} className="commande-card">
              <div className="commande-header">
                <div>
                  <div className="commande-num">{commande.numeroCommande}</div>
                  <div className="commande-date">{formatDate(commande.dateCreation)}</div>
                </div>
                <div className={`commande-statut ${getStatutClass(commande.statut)}`}>
                  {getStatutIcon(commande.statut)} {commande.statut}
                </div>
              </div>
              <div className="commande-body">
                <div>
                  <strong>Montant:</strong> {(commande.montantTTC || 0).toLocaleString()} {commande.devise || 'TND'}
                </div>
                <div>
                  <strong>Produits:</strong> {commande.produits?.length || 0}
                </div>
              </div>
              <div className="commande-actions">
                <button className="btn-detail" onClick={() => {
                  setSelectedCommande(commande);
                  setShowDetailModal(true);
                }}>
                  👁️ Détails
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nouvelle Commande */}
      {showCommandeModal && (
        <div className="modal-overlay" onClick={() => setShowCommandeModal(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📝 Nouvelle commande</h3>
              <button className="modal-close" onClick={() => setShowCommandeModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="nouvelle-commande-container">
                {/* Liste des produits */}
                <div className="produits-liste">
                  <h4>🛍️ Produits disponibles</h4>
                  <div className="produits-grid-mini">
                    {produitsDisponibles.map(produit => (
                      <div key={produit._id} className="produit-item-mini">
                        <div>
                          <strong>{produit.nom}</strong>
                          <br />
                          <small className="prix-produit">
                            {produit.prixReel > 0 
                              ? `${produit.prixReel.toLocaleString()} DT/${produit.uniteReelle}`
                              : 'Prix non défini'
                            }
                          </small>
                          {produit.stockInitial > 0 && (
                            <small className="stock-info">Stock: {produit.stockInitial} {produit.uniteReelle}</small>
                          )}
                        </div>
                        <button 
                          onClick={() => ajouterProduit(produit)}
                          disabled={!produit.prixReel || produit.prixReel === 0}
                          title={!produit.prixReel ? "Prix non défini" : "Ajouter"}
                        >
                          +
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Panier */}
                <div className="panier-commande">
                  <h4>🛒 Votre commande</h4>
                  {produitsSelectionnes.length === 0 ? (
                    <p className="panier-vide">Aucun produit sélectionné</p>
                  ) : (
                    <>
                      {produitsSelectionnes.map((produit, index) => (
                        <div key={index} className="panier-item-simple">
                          <span className="produit-nom">{produit.nom}</span>
                          <div className="quantite-controls">
                            <button onClick={() => modifierQuantite(index, produit.quantite - 1)}>-</button>
                            <span>{produit.quantite}</span>
                            <button onClick={() => modifierQuantite(index, produit.quantite + 1)}>+</button>
                          </div>
                          <span className="produit-prix">
                            {(produit.quantite * produit.prixUnitaire).toLocaleString()} DT
                          </span>
                          <span className="produit-unite">{produit.unite || 'unité'}</span>
                          <button onClick={() => supprimerProduit(index)}>🗑️</button>
                        </div>
                      ))}
                      
                      <div className="total-commande">
                        <div>Total HT: {totalHT.toLocaleString()} DT</div>
                        <div>TVA (19%): {tva.toLocaleString()} DT</div>
                        <div className="total-grand">
                          <strong>Total TTC: {totalTTC.toLocaleString()} DT</strong>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="commande-infos">
                <div className="form-group">
                  <label>Conditions de paiement:</label>
                  <select value={conditionsPaiement} onChange={(e) => setConditionsPaiement(e.target.value)}>
                    <option value="30 jours">30 jours</option>
                    <option value="45 jours">45 jours</option>
                    <option value="60 jours">60 jours</option>
                    <option value="À réception">À réception</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date livraison souhaitée:</label>
                  <input 
                    type="date" 
                    value={dateLivraisonPrevue} 
                    onChange={(e) => setDateLivraisonPrevue(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label>Notes:</label>
                  <textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    rows="2" 
                    placeholder="Instructions particulières..."
                  />
                </div>
              </div>
            </div>
            <div className="modal-buttons">
              <button onClick={() => setShowCommandeModal(false)}>Annuler</button>
              <button 
                onClick={soumettreCommande} 
                disabled={soumission || produitsSelectionnes.length === 0}
                className="btn-confirmer"
              >
                {soumission ? '⏳ Création...' : '✅ Confirmer la commande'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Détails */}
      {showDetailModal && selectedCommande && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📄 Détails de la commande</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-info">
                <p><strong>N° Commande:</strong> {selectedCommande.numeroCommande}</p>
                <p><strong>Date:</strong> {formatDate(selectedCommande.dateCreation)}</p>
                <p><strong>Statut:</strong> <span className={`statut-badge ${getStatutClass(selectedCommande.statut)}`}>
                  {getStatutIcon(selectedCommande.statut)} {selectedCommande.statut}
                </span></p>
                <p><strong>Montant total:</strong> {(selectedCommande.montantTTC || 0).toLocaleString()} {selectedCommande.devise || 'TND'}</p>
                <p><strong>Conditions de paiement:</strong> {selectedCommande.conditionsPaiement || '30 jours'}</p>
                {selectedCommande.dateLivraisonPrevue && (
                  <p><strong>Livraison prévue:</strong> {formatDate(selectedCommande.dateLivraisonPrevue)}</p>
                )}
              </div>
              
              <h4>Produits commandés:</h4>
              <table className="detail-table">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Quantité</th>
                    <th>Prix unitaire</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCommande.produits?.map((p, i) => (
                    <tr key={i}>
                      <td>{p.nom}</td>
                      <td>{p.quantite} {p.unite || ''}</td>
                      <td>{p.prixUnitaire?.toLocaleString()} {selectedCommande.devise}</td>
                      <td>{(p.quantite * p.prixUnitaire).toLocaleString()} {selectedCommande.devise}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {selectedCommande.notes && (
                <>
                  <h4>Notes:</h4>
                  <p className="notes-content">{selectedCommande.notes}</p>
                </>
              )}
            </div>
            <div className="modal-buttons">
              <button onClick={() => setShowDetailModal(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MesCommandes;