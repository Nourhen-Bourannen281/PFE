const Devis = require("../models/Devis");
const ContratVente = require("../models/ContratVente");
const { createAndSendNotification } = require("../config/socket");
const PDFDocument = require("pdfkit");

// ── Générer numéro de devis automatique ──────────────────────────
const generateNumeroDevis = async () => {
  const year = new Date().getFullYear();
  const count = await Devis.countDocuments();
  return `DEV-${year}-${String(count + 1).padStart(4, '0')}`;
};

// ── GET /api/devis ───────────────────────────────────────────────
exports.getAllDevis = async (req, res) => {
  try {
    const { statut, client, commercial, page = 1, limit = 20 } = req.query;

    const query = {};
    if (statut) query.statut = statut;
    if (client) query.client = client;
    if (commercial) query.commercial = commercial;

    // Si rôle Client : voir seulement ses propres devis
    if (req.user.role === 'Client') {
      query.client = req.user._id;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [devis, total] = await Promise.all([
      Devis.find(query)
        .populate('client', 'nom prenom email raisonSociale telephone')
        .populate('commercial', 'nom prenom email')
        .populate('lignes.produit', 'nom prixUnitaire uniteMesure')
        .populate('contratGenere', 'numeroContrat statut')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Devis.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: devis,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Erreur getAllDevis:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/devis/:id ───────────────────────────────────────────
exports.getDevisById = async (req, res) => {
  try {
    const devis = await Devis.findById(req.params.id)
      .populate('client', 'nom prenom email raisonSociale telephone adresse')
      .populate('commercial', 'nom prenom email')
      .populate('lignes.produit', 'nom prixUnitaire uniteMesure description')
      .populate('contratGenere', 'numeroContrat statut montantTotal');

    if (!devis) {
      return res.status(404).json({ success: false, message: 'Devis non trouvé' });
    }

    res.json({ success: true, data: devis });
  } catch (err) {
    console.error('Erreur getDevisById:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/devis ──────────────────────────────────────────────
exports.createDevis = async (req, res) => {
  try {
    const {
      client, lignes, remiseGlobale, tva, devise,
      dateExpiration, conditionsPaiement,
      delaiLivraison, noteInterne, noteClient
    } = req.body;

    if (!client) {
      return res.status(400).json({ success: false, message: 'Client requis' });
    }
    if (!lignes || lignes.length === 0) {
      return res.status(400).json({ success: false, message: 'Au moins une ligne requise' });
    }

    const numeroDevis = await generateNumeroDevis();

    const devis = await Devis.create({
      numeroDevis,
      client,
      commercial: req.user._id,
      lignes,
      remiseGlobale: remiseGlobale || 0,
      tva: tva || 19,
      devise: devise || 'TND',
      dateExpiration: dateExpiration || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      conditionsPaiement: conditionsPaiement || '',
      delaiLivraison: delaiLivraison || '',
      noteInterne: noteInterne || '',
      noteClient: noteClient || '',
      statut: 'Brouillon'
    });

    // Notification au client
    await createAndSendNotification(
      client,
      'Nouveau devis reçu',
      `Un devis ${devis.numeroDevis} a été créé pour vous. Montant TTC: ${devis.montantTTC.toFixed(2)} ${devis.devise}`,
      'info',
      { devisId: devis._id }
    );

    const populated = await Devis.findById(devis._id)
      .populate('client', 'nom prenom email raisonSociale')
      .populate('commercial', 'nom prenom email')
      .populate('lignes.produit', 'nom prixUnitaire');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error('Erreur createDevis:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── PUT /api/devis/:id ───────────────────────────────────────────
exports.updateDevis = async (req, res) => {
  try {
    const devis = await Devis.findById(req.params.id);
    if (!devis) {
      return res.status(404).json({ success: false, message: 'Devis non trouvé' });
    }

    // Seul un devis en Brouillon peut être modifié librement
    if (devis.statut !== 'Brouillon' && req.user.role !== 'Admin') {
      return res.status(400).json({
        success: false,
        message: 'Seul un devis en brouillon peut être modifié'
      });
    }

    const {
      lignes, remiseGlobale, tva, devise,
      dateExpiration, conditionsPaiement,
      delaiLivraison, noteInterne, noteClient
    } = req.body;

    if (lignes) devis.lignes = lignes;
    if (remiseGlobale !== undefined) devis.remiseGlobale = remiseGlobale;
    if (tva !== undefined) devis.tva = tva;
    if (devise) devis.devise = devise;
    if (dateExpiration) devis.dateExpiration = dateExpiration;
    if (conditionsPaiement !== undefined) devis.conditionsPaiement = conditionsPaiement;
    if (delaiLivraison !== undefined) devis.delaiLivraison = delaiLivraison;
    if (noteInterne !== undefined) devis.noteInterne = noteInterne;
    if (noteClient !== undefined) devis.noteClient = noteClient;

    await devis.save();

    const updated = await Devis.findById(devis._id)
      .populate('client', 'nom prenom email raisonSociale')
      .populate('commercial', 'nom prenom email')
      .populate('lignes.produit', 'nom prixUnitaire');

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Erreur updateDevis:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/devis/:id/statut ──────────────────────────────────
exports.updateStatut = async (req, res) => {
  try {
    const { statut } = req.body;
    const validStatuts = ['Brouillon', 'Envoyé', 'Accepté', 'Refusé', 'Expiré', 'Converti'];

    if (!statut || !validStatuts.includes(statut)) {
      return res.status(400).json({
        success: false,
        message: `Statut invalide. Valeurs: ${validStatuts.join(', ')}`
      });
    }

    const devis = await Devis.findById(req.params.id);
    if (!devis) {
      return res.status(404).json({ success: false, message: 'Devis non trouvé' });
    }

    const ancienStatut = devis.statut;
    devis.statut = statut;

    if (statut === 'Accepté') {
      devis.dateAcceptation = new Date();
    }

    await devis.save();

    // Notifier le client du changement de statut
    const messages = {
      'Envoyé':   `Votre devis ${devis.numeroDevis} a été envoyé.`,
      'Accepté':  `Votre devis ${devis.numeroDevis} a été accepté ! Montant TTC: ${devis.montantTTC.toFixed(2)} ${devis.devise}`,
      'Refusé':   `Votre devis ${devis.numeroDevis} a été refusé.`,
      'Expiré':   `Votre devis ${devis.numeroDevis} a expiré.`,
      'Converti': `Votre devis ${devis.numeroDevis} a été converti en contrat.`
    };

    if (messages[statut]) {
      await createAndSendNotification(
        devis.client,
        `Devis ${statut}`,
        messages[statut],
        statut === 'Accepté' ? 'success' : statut === 'Refusé' ? 'error' : 'info',
        { devisId: devis._id }
      );
    }

    const updated = await Devis.findById(devis._id)
      .populate('client', 'nom prenom email raisonSociale')
      .populate('commercial', 'nom prenom email');

    res.json({ success: true, data: updated, message: `Statut mis à jour: ${ancienStatut} → ${statut}` });
  } catch (err) {
    console.error('Erreur updateStatut:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/devis/:id/envoyer ──────────────────────────────────
exports.envoyerDevis = async (req, res) => {
  try {
    const devis = await Devis.findById(req.params.id)
      .populate('client', 'nom prenom email raisonSociale');

    if (!devis) {
      return res.status(404).json({ success: false, message: 'Devis non trouvé' });
    }
    if (devis.statut !== 'Brouillon') {
      return res.status(400).json({
        success: false,
        message: 'Seul un devis en brouillon peut être envoyé'
      });
    }

    devis.statut = 'Envoyé';
    await devis.save();

    await createAndSendNotification(
      devis.client._id,
      'Nouveau devis à consulter',
      `Vous avez reçu le devis ${devis.numeroDevis} d'un montant de ${devis.montantTTC.toFixed(2)} ${devis.devise}. Veuillez le consulter et donner votre accord.`,
      'info',
      { devisId: devis._id }
    );

    res.json({ success: true, message: 'Devis envoyé au client', data: devis });
  } catch (err) {
    console.error('Erreur envoyerDevis:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/devis/:id/accepter ─────────────────────────────────
exports.accepterDevis = async (req, res) => {
  try {
    const devis = await Devis.findById(req.params.id)
      .populate('client', 'nom prenom email raisonSociale')
      .populate('lignes.produit', 'nom prixUnitaire');

    if (!devis) {
      return res.status(404).json({ success: false, message: 'Devis non trouvé' });
    }
    if (devis.statut !== 'Envoyé') {
      return res.status(400).json({
        success: false,
        message: 'Seul un devis envoyé peut être accepté'
      });
    }

    devis.statut = 'Accepté';
    devis.dateAcceptation = new Date();
    devis.signatureClient = true;
    devis.dateSignature = new Date();
    await devis.save();

    // Notifier le commercial
    if (devis.commercial) {
      await createAndSendNotification(
        devis.commercial,
        'Devis accepté !',
        `Le client ${devis.client.raisonSociale || devis.client.nom} a accepté le devis ${devis.numeroDevis}.`,
        'success',
        { devisId: devis._id }
      );
    }

    res.json({ success: true, message: 'Devis accepté', data: devis });
  } catch (err) {
    console.error('Erreur accepterDevis:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/devis/:id/refuser ──────────────────────────────────
exports.refuserDevis = async (req, res) => {
  try {
    const { motifRefus } = req.body;

    const devis = await Devis.findById(req.params.id)
      .populate('client', 'nom prenom email raisonSociale');

    if (!devis) {
      return res.status(404).json({ success: false, message: 'Devis non trouvé' });
    }
    if (devis.statut !== 'Envoyé') {
      return res.status(400).json({
        success: false,
        message: 'Seul un devis envoyé peut être refusé'
      });
    }

    devis.statut = 'Refusé';
    if (motifRefus) devis.noteInterne = motifRefus;
    await devis.save();

    // Notifier le commercial
    if (devis.commercial) {
      await createAndSendNotification(
        devis.commercial,
        'Devis refusé',
        `Le client ${devis.client.raisonSociale || devis.client.nom} a refusé le devis ${devis.numeroDevis}.${motifRefus ? ' Motif: ' + motifRefus : ''}`,
        'warning',
        { devisId: devis._id }
      );
    }

    res.json({ success: true, message: 'Devis refusé', data: devis });
  } catch (err) {
    console.error('Erreur refuserDevis:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/devis/:id/convertir-contrat ────────────────────────
exports.convertirEnContrat = async (req, res) => {
  try {
    const devis = await Devis.findById(req.params.id)
      .populate('client')
      .populate('lignes.produit');

    if (!devis) {
      return res.status(404).json({ success: false, message: 'Devis non trouvé' });
    }
    if (devis.statut !== 'Accepté') {
      return res.status(400).json({
        success: false,
        message: 'Seul un devis accepté peut être converti en contrat'
      });
    }
    if (devis.contratGenere) {
      return res.status(400).json({
        success: false,
        message: 'Ce devis a déjà été converti en contrat'
      });
    }

    const { dateDebut, dateFin } = req.body;

    if (!dateDebut || !dateFin) {
      return res.status(400).json({
        success: false,
        message: 'Dates de début et de fin requises pour créer le contrat'
      });
    }

    // Prendre la première ligne pour créer le contrat
    const premiereLigne = devis.lignes[0];

    const countContrat = await ContratVente.countDocuments();
    const numeroContrat = `CV-${new Date().getFullYear()}-${String(countContrat + 1).padStart(4, '0')}`;

    const contrat = await ContratVente.create({
      numeroContrat,
      produit: premiereLigne.produit._id,
      client: devis.client._id,
      quantite: premiereLigne.quantite,
      prixUnitaire: premiereLigne.prixUnitaire,
      montantTotal: devis.montantTTC,
      dateDebut: new Date(dateDebut),
      dateFin: new Date(dateFin),
      conditionsPaiement: devis.conditionsPaiement,
      statut: 'En Cours'
    });

    // Mettre à jour le devis
    devis.statut = 'Converti';
    devis.contratGenere = contrat._id;
    await devis.save();

    // Notifier le client
    await createAndSendNotification(
      devis.client._id,
      'Contrat créé',
      `Votre devis ${devis.numeroDevis} a été converti en contrat ${contrat.numeroContrat}.`,
      'success',
      { devisId: devis._id, contratId: contrat._id }
    );

    res.json({
      success: true,
      message: 'Devis converti en contrat avec succès',
      data: { devis, contrat }
    });
  } catch (err) {
    console.error('Erreur convertirEnContrat:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/devis/:id/dupliquer ────────────────────────────────
exports.dupliquerDevis = async (req, res) => {
  try {
    const original = await Devis.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ success: false, message: 'Devis non trouvé' });
    }

    const numeroDevis = await generateNumeroDevis();

    const copie = await Devis.create({
      numeroDevis,
      client: original.client,
      commercial: req.user._id,
      lignes: original.lignes,
      remiseGlobale: original.remiseGlobale,
      tva: original.tva,
      devise: original.devise,
      conditionsPaiement: original.conditionsPaiement,
      delaiLivraison: original.delaiLivraison,
      noteInterne: `Copie de ${original.numeroDevis}`,
      noteClient: original.noteClient,
      dateExpiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      statut: 'Brouillon'
    });

    const populated = await Devis.findById(copie._id)
      .populate('client', 'nom prenom email raisonSociale')
      .populate('commercial', 'nom prenom email')
      .populate('lignes.produit', 'nom prixUnitaire');

    res.status(201).json({
      success: true,
      message: `Devis dupliqué : ${copie.numeroDevis}`,
      data: populated
    });
  } catch (err) {
    console.error('Erreur dupliquerDevis:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/devis/:id ────────────────────────────────────────
exports.deleteDevis = async (req, res) => {
  try {
    const devis = await Devis.findById(req.params.id);
    if (!devis) {
      return res.status(404).json({ success: false, message: 'Devis non trouvé' });
    }
    if (devis.statut === 'Converti') {
      return res.status(400).json({
        success: false,
        message: 'Un devis converti en contrat ne peut pas être supprimé'
      });
    }

    await Devis.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Devis supprimé' });
  } catch (err) {
    console.error('Erreur deleteDevis:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/devis/stats ─────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const query = req.user.role === 'Client' ? { client: req.user._id } : {};

    const [
      total, brouillon, envoye, accepte,
      refuse, expire, converti,
      montantTotal
    ] = await Promise.all([
      Devis.countDocuments(query),
      Devis.countDocuments({ ...query, statut: 'Brouillon' }),
      Devis.countDocuments({ ...query, statut: 'Envoyé' }),
      Devis.countDocuments({ ...query, statut: 'Accepté' }),
      Devis.countDocuments({ ...query, statut: 'Refusé' }),
      Devis.countDocuments({ ...query, statut: 'Expiré' }),
      Devis.countDocuments({ ...query, statut: 'Converti' }),
      Devis.aggregate([
        { $match: { ...query, statut: { $in: ['Accepté', 'Converti'] } } },
        { $group: { _id: null, total: { $sum: '$montantTTC' } } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        total, brouillon, envoye, accepte,
        refuse, expire, converti,
        montantTotalAccepte: montantTotal[0]?.total || 0
      }
    });
  } catch (err) {
    console.error('Erreur getStats:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/devis/:id/pdf ───────────────────────────────────────
exports.generatePDF = async (req, res) => {
  try {
    const devis = await Devis.findById(req.params.id)
      .populate('client', 'nom prenom email raisonSociale telephone adresse')
      .populate('commercial', 'nom prenom email')
      .populate('lignes.produit', 'nom description uniteMesure')
      .lean();

    if (!devis) {
      return res.status(404).json({ success: false, message: 'Devis non trouvé' });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `attachment; filename="devis_${devis.numeroDevis}.pdf"`);
    doc.pipe(res);

    // ── En-tête ──────────────────────────────────────────────────
    doc.fontSize(26).font('Helvetica-Bold').fillColor('#0a2540')
       .text('DEVIS', 50, 50, { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(13).font('Helvetica').fillColor('#666')
       .text(devis.numeroDevis, { align: 'center' });
    doc.moveDown(0.5);

    // Statut badge
    const statutColors = {
      Brouillon: '#888', Envoyé: '#2196F3', Accepté: '#4CAF50',
      Refusé: '#f44336', Expiré: '#FF9800', Converti: '#9C27B0'
    };
    doc.fontSize(11).font('Helvetica-Bold')
       .fillColor(statutColors[devis.statut] || '#888')
       .text(`[ ${devis.statut.toUpperCase()} ]`, { align: 'center' });
    doc.moveDown(1);

    // Ligne séparatrice
    doc.strokeColor('#dbe5f5').lineWidth(1)
       .moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.8);

    // ── Informations client / commercial ─────────────────────────
    const colLeft = 50, colRight = 300;
    const yInfo = doc.y;

    // Bloc client
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#0a2540')
       .text('CLIENT', colLeft, yInfo);
    doc.moveDown(0.2);
    const client = devis.client;
    doc.fontSize(10).font('Helvetica').fillColor('#333');
    doc.text(client?.raisonSociale || `${client?.nom} ${client?.prenom}` || 'N/A');
    if (client?.email) doc.text(client.email);
    if (client?.telephone) doc.text(client.telephone);
    if (client?.adresse) doc.text(client.adresse);

    // Bloc devis info
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#0a2540')
       .text('INFORMATIONS', colRight, yInfo);
    doc.fontSize(10).font('Helvetica').fillColor('#333');
    const infoLines = [
      ['Date:', new Date(devis.dateDevis).toLocaleDateString('fr-FR')],
      ['Expiration:', devis.dateExpiration ? new Date(devis.dateExpiration).toLocaleDateString('fr-FR') : 'N/A'],
      ['Commercial:', devis.commercial ? `${devis.commercial.nom} ${devis.commercial.prenom}` : 'N/A'],
      ['Devise:', devis.devise]
    ];
    infoLines.forEach(([label, value]) => {
      doc.font('Helvetica-Bold').text(label, colRight, doc.y, { continued: true, width: 100 });
      doc.font('Helvetica').text(` ${value}`);
    });

    doc.moveDown(2);

    // ── Tableau des lignes ────────────────────────────────────────
    doc.strokeColor('#dbe5f5').lineWidth(1)
       .moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // En-tête tableau
    const tableY = doc.y;
    doc.rect(50, tableY, 495, 22).fill('#0a2540');
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#fff');
    doc.text('Désignation', 55, tableY + 6, { width: 180 });
    doc.text('Qté', 240, tableY + 6, { width: 50, align: 'right' });
    doc.text('Prix Unit.', 295, tableY + 6, { width: 70, align: 'right' });
    doc.text('Remise', 370, tableY + 6, { width: 50, align: 'right' });
    doc.text('Montant HT', 425, tableY + 6, { width: 115, align: 'right' });

    let y = tableY + 24;

    devis.lignes.forEach((ligne, i) => {
      const bgColor = i % 2 === 0 ? '#f0f5fb' : '#ffffff';
      doc.rect(50, y, 495, 20).fill(bgColor);
      doc.fontSize(9).font('Helvetica').fillColor('#333');
      doc.text(ligne.designation || ligne.produit?.nom || 'N/A', 55, y + 5, { width: 180 });
      doc.text(String(ligne.quantite), 240, y + 5, { width: 50, align: 'right' });
      doc.text(`${ligne.prixUnitaire.toFixed(2)} ${devis.devise}`, 295, y + 5, { width: 70, align: 'right' });
      doc.text(`${ligne.remise || 0}%`, 370, y + 5, { width: 50, align: 'right' });
      doc.text(`${(ligne.montantHT || 0).toFixed(2)} ${devis.devise}`, 425, y + 5, { width: 115, align: 'right' });
      y += 22;

      if (y > 720) { doc.addPage(); y = 50; }
    });

    doc.moveDown(1);
    y += 10;

    // ── Totaux ───────────────────────────────────────────────────
    doc.strokeColor('#dbe5f5').lineWidth(1).moveTo(50, y).lineTo(545, y).stroke();
    y += 12;

    const totaux = [
      ['Montant HT :', `${devis.montantHT.toFixed(2)} ${devis.devise}`],
      [`Remise globale (${devis.remiseGlobale}%) :`, `-${(devis.montantHT * devis.remiseGlobale / 100).toFixed(2)} ${devis.devise}`],
      [`TVA (${devis.tva}%) :`, `${devis.montantTVA.toFixed(2)} ${devis.devise}`]
    ];

    totaux.forEach(([label, value]) => {
      doc.fontSize(10).font('Helvetica').fillColor('#555')
         .text(label, 350, y, { width: 130, align: 'right' });
      doc.text(value, 490, y, { width: 55, align: 'right' });
      y += 18;
    });

    y += 5;
    doc.rect(340, y, 205, 26).fill('#0a2540');
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#fff')
       .text('TOTAL TTC :', 345, y + 6, { width: 130, align: 'right' });
    doc.text(`${devis.montantTTC.toFixed(2)} ${devis.devise}`, 490, y + 6, { width: 50, align: 'right' });
    y += 35;

    // ── Conditions ───────────────────────────────────────────────
    if (devis.conditionsPaiement || devis.delaiLivraison || devis.noteClient) {
      y += 10;
      doc.strokeColor('#dbe5f5').lineWidth(1).moveTo(50, y).lineTo(545, y).stroke();
      y += 12;

      if (devis.conditionsPaiement) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#0a2540')
           .text('Conditions de paiement :', 50, y);
        y += 16;
        doc.fontSize(9).font('Helvetica').fillColor('#555')
           .text(devis.conditionsPaiement, 50, y, { width: 495 });
        y += 20;
      }
      if (devis.delaiLivraison) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#0a2540')
           .text('Délai de livraison :', 50, y);
        y += 16;
        doc.fontSize(9).font('Helvetica').fillColor('#555')
           .text(devis.delaiLivraison, 50, y, { width: 495 });
        y += 20;
      }
      if (devis.noteClient) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#0a2540')
           .text('Notes :', 50, y);
        y += 16;
        doc.fontSize(9).font('Helvetica').fillColor('#555')
           .text(devis.noteClient, 50, y, { width: 495 });
      }
    }

    // ── Pied de page ─────────────────────────────────────────────
    doc.fontSize(8).fillColor('#aaa').font('Helvetica')
       .text(
         `Devis généré le ${new Date().toLocaleDateString('fr-FR')} — ETAP`,
         50, 770, { align: 'center', width: 495 }
       );

    doc.end();
  } catch (err) {
    console.error('Erreur generatePDF:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};