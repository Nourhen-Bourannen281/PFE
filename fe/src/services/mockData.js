// src/services/mockData.js

// Produits pétroliers mockés
export const mockProducts = [
  {
    _id: '1',
    nom: 'Essence Sans Plomb',
    code: 'ESP-001',
    description: 'Essence sans plomb 95 octanes, idéale pour les véhicules essence modernes',
    prixUnitaire: 2.850,
    uniteMesure: 'Litre',
    typeProduit: 'Carburant',
    categorie: 'Essence',
    stockDisponible: 50000,
    imageIcon: '⛽'
  },
  {
    _id: '2',
    nom: 'Gas-oil (Diesel)',
    code: 'GOD-002',
    description: 'Gas-oil pour moteurs diesel, haute performance',
    prixUnitaire: 2.650,
    uniteMesure: 'Litre',
    typeProduit: 'Carburant',
    categorie: 'Diesel',
    stockDisponible: 75000,
    imageIcon: '🛢️'
  },
  {
    _id: '3',
    nom: 'Kérosène',
    code: 'KER-003',
    description: 'Kérosène pour aviation et chauffage',
    prixUnitaire: 3.200,
    uniteMesure: 'Litre',
    typeProduit: 'Carburant',
    categorie: 'Aviation',
    stockDisponible: 30000,
    imageIcon: '✈️'
  },
  {
    _id: '4',
    nom: 'Pétrole Brut',
    code: 'BRU-004',
    description: 'Pétrole brut non raffiné',
    prixUnitaire: 2.400,
    uniteMesure: 'Litre',
    typeProduit: 'Matière première',
    categorie: 'Brut',
    stockDisponible: 100000,
    imageIcon: '🛢️'
  },
  {
    _id: '5',
    nom: 'Gaz Naturel',
    code: 'GAZ-005',
    description: 'Gaz naturel pour usage domestique et industriel',
    prixUnitaire: 1.950,
    uniteMesure: 'm³',
    typeProduit: 'Gaz',
    categorie: 'Naturel',
    stockDisponible: 200000,
    imageIcon: '🔥'
  },
  {
    _id: '6',
    nom: 'GPL (Gaz de Pétrole Liquéfié)',
    code: 'GPL-006',
    description: 'Gaz de pétrole liquéfié pour véhicules et usage domestique',
    prixUnitaire: 1.750,
    uniteMesure: 'kg',
    typeProduit: 'Gaz',
    categorie: 'Liquéfié',
    stockDisponible: 40000,
    imageIcon: '🫙'
  }
];

// Commandes mockées
export const mockCommandes = [
  {
    _id: 'CMD001',
    numeroCommande: 'CMD-2024-0001',
    dateCreation: '2024-12-15T10:30:00.000Z',
    statut: 'Livrée',
    montantTotal: 2850,
    typeLivraison: 'domicile',
    produits: [
      {
        nom: 'Essence Sans Plomb',
        quantite: 1000,
        prixUnitaire: 2.850,
        uniteMesure: 'Litre'
      }
    ]
  },
  {
    _id: 'CMD002',
    numeroCommande: 'CMD-2024-0002',
    dateCreation: '2024-12-20T14:15:00.000Z',
    statut: 'Validée',
    montantTotal: 5300,
    typeLivraison: 'station',
    produits: [
      {
        nom: 'Gas-oil (Diesel)',
        quantite: 2000,
        prixUnitaire: 2.650,
        uniteMesure: 'Litre'
      }
    ]
  },
  {
    _id: 'CMD003',
    numeroCommande: 'CMD-2024-0003',
    dateCreation: '2024-12-25T09:45:00.000Z',
    statut: 'En attente',
    montantTotal: 1950,
    typeLivraison: 'domicile',
    produits: [
      {
        nom: 'Gaz Naturel',
        quantite: 1000,
        prixUnitaire: 1.950,
        uniteMesure: 'm³'
      }
    ]
  }
];