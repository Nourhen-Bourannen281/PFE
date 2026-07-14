const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFService {
  static async generateContratPDF(contrat, userRole) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks = [];
        
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        
        // En-tête
        doc.fontSize(20)
          .font('Helvetica-Bold')
          .text('CONTRAT', { align: 'center' })
          .moveDown();
        
        doc.fontSize(12)
          .font('Helvetica')
          .text(`N° Contrat: ${contrat.numeroContrat}`, { align: 'center' })
          .moveDown();
        
        // Ligne de séparation
        doc.strokeColor('#000000')
          .lineWidth(1)
          .moveTo(50, doc.y)
          .lineTo(550, doc.y)
          .stroke()
          .moveDown();
        
        // Informations du contrat
        doc.fontSize(14)
          .font('Helvetica-Bold')
          .text('Informations du contrat', { underline: true })
          .moveDown(0.5);
        
        doc.fontSize(10)
          .font('Helvetica')
          .text(`Type: ${contrat.type === 'Vente' ? '📝 Vente' : '💰 Achat'}`, { continued: false })
          .text(`Date de création: ${new Date(contrat.dateCreation).toLocaleDateString('fr-FR')}`)
          .text(`Date de début: ${contrat.dateDebut ? new Date(contrat.dateDebut).toLocaleDateString('fr-FR') : 'Non spécifiée'}`)
          .text(`Date de fin: ${contrat.dateFin ? new Date(contrat.dateFin).toLocaleDateString('fr-FR') : 'Non spécifiée'}`)
          .text(`Statut: ${this.getStatutText(contrat.statut)}`)
          .text(`Devise: ${contrat.devise || 'TND'}`)
          .moveDown();
        
        // Informations du tiers
        doc.fontSize(14)
          .font('Helvetica-Bold')
          .text(`Informations du ${contrat.type === 'Vente' ? 'Client' : 'Fournisseur'}`, { underline: true })
          .moveDown(0.5);
        
        doc.fontSize(10)
          .font('Helvetica')
          .text(`Nom / Raison sociale: ${contrat.tiers?.raisonSociale || '-'}`)
          .text(`Type: ${contrat.tiers?.type === 0 ? 'Client' : 'Fournisseur'}`)
          .text(`Email: ${contrat.tiers?.email || '-'}`)
          .text(`Téléphone: ${contrat.tiers?.telephone || '-'}`)
          .text(`Adresse: ${contrat.tiers?.adresse || '-'}`)
          .moveDown();
        
        // Détails des produits
        doc.fontSize(14)
          .font('Helvetica-Bold')
          .text('Détails des produits', { underline: true })
          .moveDown(0.5);
        
        // Tableau des produits
        const startY = doc.y;
        const tableTop = startY;
        const itemX = 50;
        const productX = 50;
        const qtyX = 250;
        const priceX = 350;
        const totalX = 450;
        
        // En-têtes du tableau
        doc.fontSize(9)
          .font('Helvetica-Bold')
          .text('Produit', productX, tableTop)
          .text('Quantité', qtyX, tableTop)
          .text('Prix unitaire', priceX, tableTop)
          .text('Total', totalX, tableTop);
        
        doc.moveDown();
        
        let y = tableTop + 20;
        let totalGeneral = 0;
        
        contrat.produits?.forEach((produit, index) => {
          const nom = produit.sousProduit?.nom || 'Produit';
          const quantite = produit.quantite;
          const prixUnitaire = produit.prixUnitaire;
          const total = quantite * prixUnitaire;
          totalGeneral += total;
          
          doc.font('Helvetica')
            .fontSize(9)
            .text(nom, productX, y)
            .text(`${quantite} ${produit.sousProduit?.uniteMesure || ''}`, qtyX, y)
            .text(`${prixUnitaire.toLocaleString()} ${contrat.devise || 'TND'}`, priceX, y)
            .text(`${total.toLocaleString()} ${contrat.devise || 'TND'}`, totalX, y);
          
          y += 20;
        });
        
        // Total général
        y += 10;
        doc.font('Helvetica-Bold')
          .fontSize(11)
          .text('Total général:', totalX - 80, y)
          .text(`${totalGeneral.toLocaleString()} ${contrat.devise || 'TND'}`, totalX, y);
        
        y += 30;
        
        // Pied de page
        doc.fontSize(8)
          .font('Helvetica')
          .text('Document généré le ' + new Date().toLocaleDateString('fr-FR'), 50, 750, { align: 'center' });
        
        doc.text(`Généré par: ${userRole === 'Admin' ? 'Administrateur' : userRole === 'Commercial' ? 'Commercial' : 'Client/Fournisseur'}`, 50, 770, { align: 'center' });
        
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
  
  static getStatutText(statut) {
    switch(statut) {
      case 'En cours': return '⏳ En cours';
      case 'Terminé': return '✅ Terminé';
      case 'Renouvelé': return '🔄 Renouvelé';
      default: return statut;
    }
  }
}

module.exports = PDFService;