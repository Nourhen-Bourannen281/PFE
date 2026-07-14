
const Emission = require('../models/Emission');
const Reception = require('../models/Reception');
const Contrat = require('../models/Contrat');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Exporter vers Excel
exports.exportToExcel = async (req, res) => {
  try {
    const { type } = req.params; // 'emissions' ou 'receptions'
    let data, worksheetName;
    
    if (type === 'emissions') {
      data = await Emission.find().populate('contrat', 'numeroContrat').populate('destination', 'nom');
      worksheetName = 'Émissions';
    } else {
      data = await Reception.find().populate('contrat', 'numeroContrat').populate('origine', 'nom');
      worksheetName = 'Réceptions';
    }
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(worksheetName);
    
    worksheet.columns = [
      { header: 'Numéro', key: 'numero', width: 20 },
      { header: 'Contrat', key: 'contrat', width: 20 },
      { header: type === 'emissions' ? 'Destination' : 'Origine', key: 'pays', width: 20 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Statut', key: 'statut', width: 15 }
    ];
    
    data.forEach(item => {
      worksheet.addRow({
        numero: item.numeroEmission || item.numeroReception,
        contrat: item.contrat?.numeroContrat || 'N/A',
        pays: type === 'emissions' ? item.destination?.nom || 'N/A' : item.origine?.nom || 'N/A',
        date: new Date(item.dateEmission || item.dateReception).toLocaleDateString(),
        statut: item.statut
      });
    });
    
    const filename = `${type}_${Date.now()}.xlsx`;
    const filepath = path.join('./uploads/exports/', filename);
    
    if (!fs.existsSync('./uploads/exports/')) fs.mkdirSync('./uploads/exports/', { recursive: true });
    
    await workbook.xlsx.writeFile(filepath);
    
    res.download(filepath, filename, (err) => {
      if (err) console.error('Erreur téléchargement:', err);
      setTimeout(() => fs.unlinkSync(filepath), 60000);
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Exporter vers PDF
exports.exportToPDF = async (req, res) => {
  try {
    const { type } = req.params;
    let data, title;
    
    if (type === 'emissions') {
      data = await Emission.find().populate('contrat', 'numeroContrat').populate('destination', 'nom');
      title = 'Liste des Émissions';
    } else {
      data = await Reception.find().populate('contrat', 'numeroContrat').populate('origine', 'nom');
      title = 'Liste des Réceptions';
    }
    
    const doc = new PDFDocument({ margin: 50 });
    const filename = `${type}_${Date.now()}.pdf`;
    const filepath = path.join('./uploads/exports/', filename);
    
    if (!fs.existsSync('./uploads/exports/')) fs.mkdirSync('./uploads/exports/', { recursive: true });
    
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);
    
    doc.fontSize(20).text(title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Généré le: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown();
    
    data.forEach((item, index) => {
      doc.fontSize(12).text(`${index + 1}. ${item.numeroEmission || item.numeroReception}`, { underline: true });
      doc.fontSize(10).text(`Contrat: ${item.contrat?.numeroContrat || 'N/A'}`);
      doc.text(`${type === 'emissions' ? 'Destination' : 'Origine'}: ${type === 'emissions' ? item.destination?.nom || 'N/A' : item.origine?.nom || 'N/A'}`);
      doc.text(`Date: ${new Date(item.dateEmission || item.dateReception).toLocaleDateString()}`);
      doc.text(`Statut: ${item.statut}`);
      doc.moveDown();
    });
    
    doc.end();
    
    stream.on('finish', () => {
      res.download(filepath, filename, (err) => {
        if (err) console.error('Erreur téléchargement:', err);
        setTimeout(() => fs.unlinkSync(filepath), 60000);
      });
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Importer depuis Excel
exports.importFromExcel = async (req, res) => {
  try {
    const { type } = req.params;
    const file = req.file;
    
    if (!file) return res.status(400).json({ message: 'Aucun fichier fourni' });
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(file.path);
    const worksheet = workbook.getWorksheet(1);
    const imported = [];
    
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      const rowData = {
        numero: row.getCell(1).value,
        contratNumero: row.getCell(2).value,
        pays: row.getCell(3).value,
        date: row.getCell(4).value,
        statut: row.getCell(5).value || 'En cours'
      };
      imported.push(rowData);
    });
    
    for (const item of imported) {
      const contrat = await Contrat.findOne({ numeroContrat: item.contratNumero });
      if (contrat) {
        if (type === 'emissions') {
          await Emission.create({
            numeroEmission: item.numero || `EM-${Date.now()}`,
            contrat: contrat._id,
            statut: item.statut
          });
        } else {
          await Reception.create({
            numeroReception: item.numero || `RC-${Date.now()}`,
            contrat: contrat._id,
            statut: item.statut
          });
        }
      }
    }
    
    fs.unlinkSync(file.path);
    res.json({ message: `Import terminé: ${imported.length} lignes importées` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Associer contrat à émission/réception
exports.associateContrat = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { contratId } = req.body;
    
    const contrat = await Contrat.findById(contratId);
    if (!contrat) return res.status(404).json({ message: 'Contrat non trouvé' });
    
    let entity;
    if (type === 'emission') {
      entity = await Emission.findByIdAndUpdate(id, { contrat: contratId }, { new: true });
    } else {
      entity = await Reception.findByIdAndUpdate(id, { contrat: contratId }, { new: true });
    }
    
    res.json({ message: 'Association réussie', entity });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};