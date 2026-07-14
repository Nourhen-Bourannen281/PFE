const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const dir = './uploads/documents/';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

exports.generateFacturePDF = async (facture) => {
  return new Promise((resolve, reject) => {
    const filename = `facture_${facture.numeroFacture}_${Date.now()}.pdf`;
    const filepath = path.join(dir, filename);
    
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);
    
    // En-tête
    doc.fontSize(20).font('Helvetica-Bold').text('FACTURE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica');
    
    // Informations facture
    doc.text(`N° Facture: ${facture.numeroFacture}`);
    doc.text(`Date d'émission: ${new Date(facture.dateEmission).toLocaleDateString()}`);
    doc.text(`Date d'échéance: ${new Date(facture.dateEcheance).toLocaleDateString()}`);
    doc.text(`Devise: ${facture.devise}`);
    doc.moveDown();
    
    // Montants
    doc.font('Helvetica-Bold').text('Détails financiers', { underline: true });
    doc.font('Helvetica');
    doc.text(`Montant HT: ${facture.montantHT.toLocaleString()} ${facture.devise}`);
    doc.text(`TVA (${facture.devise === 'TND' ? '19%' : '0%'}): ${facture.montantTVA.toLocaleString()} ${facture.devise}`);
    doc.font('Helvetica-Bold');
    doc.text(`Montant TTC: ${facture.montantTTC.toLocaleString()} ${facture.devise}`);
    doc.moveDown();
    
    // Statut
    doc.text(`Statut: ${facture.statut}`);
    
    doc.end();
    
    stream.on('finish', () => resolve(filepath));
    stream.on('error', reject);
  });
};

exports.generateDouanierPDF = async (entity, type) => {
  return new Promise((resolve, reject) => {
    const filename = `${type}_${entity.numeroEmission || entity.numeroReception}_${Date.now()}.pdf`;
    const filepath = path.join(dir, filename);
    
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);
    
    doc.fontSize(20).font('Helvetica-Bold').text(`CERTIFICAT DOUANIER - ${type === 'Emission' ? 'EXPORTATION' : 'IMPORTATION'}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica');
    
    doc.text(`Numéro: ${entity.numeroEmission || entity.numeroReception}`);
    doc.text(`Date: ${new Date(entity.dateEmission || entity.dateReception).toLocaleDateString()}`);
    doc.text(`Statut: ${entity.statut}`);
    doc.text(`${type === 'Emission' ? 'Destination' : 'Origine'}: ${entity.destination || entity.origine || 'N/A'}`);
    doc.moveDown();
    
    doc.font('Helvetica-Bold').text('Produits:', { underline: true });
    doc.font('Helvetica');
    entity.produits.forEach((p, i) => {
      doc.text(`${i+1}. ${p.sousProduit} - Quantité: ${p.quantite}`);
    });
    
    doc.end();
    
    stream.on('finish', () => resolve(filepath));
    stream.on('error', reject);
  });
};