import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/Transport.css';

function Transport() {
  const [livraisons, setLivraisons] = useState([]);
  const [cargaisons, setCargaisons] = useState([]);
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const api = axios.create({
    baseURL: 'http://localhost:5001/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  useEffect(() => {
    fetchLivraisons();
    fetchCargaisons();
  }, []);

  const fetchLivraisons = async () => {
    try {
      const res = await api.get('/livraisons');
      setLivraisons(res.data);
    } catch (error) {
      console.error('Erreur chargement livraisons:', error);
    }
  };

  const fetchCargaisons = async () => {
    try {
      const res = await api.get('/cargaisons');
      setCargaisons(res.data);
    } catch (error) {
      console.error('Erreur chargement cargaisons:', error);
    }
  };

  const demarrerTransport = async (livraisonId) => {
    try {
      await api.post(`/cargaisons/${livraisonId}/demarrer`, { typeTransport: 'Camion' });
      alert('Transport démarré avec succès');
      fetchLivraisons();
      fetchCargaisons();
    } catch (error) {
      console.error('Erreur démarrage:', error);
      alert(error.response?.data?.message || 'Erreur lors du démarrage');
    }
  };

  const terminerTransport = async (livraisonId) => {
    try {
      await api.post(`/cargaisons/${livraisonId}/terminer`);
      alert('Transport terminé avec succès');
      fetchLivraisons();
      fetchCargaisons();
    } catch (error) {
      console.error('Erreur terminaison:', error);
      alert(error.response?.data?.message || 'Erreur lors de la terminaison');
    }
  };

  return (
    <div className="page-container">
      <h2>Mes Livraisons Assignées</h2>
      
      <table className="data-table">
        <thead>
          <tr>
            <th>N° Livraison</th>
            <th>Commande</th>
            <th>État Livraison</th>
            <th>Statut Transport</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {livraisons.map(liv => {
            const cargaison = cargaisons.find(c => c.livraison?._id === liv._id);
            return (
              <tr key={liv._id}>
                <td>{liv.numeroLivraison}</td>
                <td>{liv.commande?.numeroCommande}</td>
                <td className={`status ${liv.etat.toLowerCase().replace(' ', '-')}`}>
                  {liv.etat}
                </td>
                <td>{cargaison?.statutTransport || 'Non démarré'}</td>
                <td>
                  {liv.etat === 'Prête' && (!cargaison || cargaison.statutTransport === 'En attente') && (
                    <button 
                      className="btn-success" 
                      onClick={() => demarrerTransport(liv._id)}
                    >
                      Démarrer Transport
                    </button>
                  )}
                  {cargaison?.statutTransport === 'En cours' && (
                    <button 
                      className="btn-primary" 
                      onClick={() => terminerTransport(liv._id)}
                    >
                      Terminer Transport
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default Transport;