const express    = require("express");
const http       = require("http");
const dotenv     = require("dotenv");
const { spawn }  = require("child_process");
const path       = require("path");

dotenv.config();

// ── Lancement du microservice Flask (analyse de risque) ───────────
const PYTHON_EXE = path.resolve(__dirname, "../../venv/Scripts/python.exe");
const FLASK_APP  = path.resolve(__dirname, "../../app.py");

const flaskProcess = spawn(PYTHON_EXE, [FLASK_APP], {
  stdio: "pipe",
  detached: false,
});

flaskProcess.stdout.on("data", (data) => {
  console.log(`🐍 Flask: ${data.toString().trim()}`);
});

flaskProcess.stderr.on("data", (data) => {
  // Flask écrit ses logs sur stderr — on les affiche mais sans bloquer
  console.log(`🐍 Flask: ${data.toString().trim()}`);
});

flaskProcess.on("error", (err) => {
  console.warn(`⚠️  Flask non démarré (${err.message}) — l'analyse de risque sera désactivée`);
});

flaskProcess.on("close", (code) => {
  if (code !== 0) {
    console.warn(`⚠️  Flask s'est arrêté (code ${code}) — l'analyse de risque sera désactivée`);
  }
});

// Arrêter Flask proprement quand Node s'arrête
process.on("exit",    () => flaskProcess.kill());
process.on("SIGINT",  () => { flaskProcess.kill(); process.exit(); });
process.on("SIGTERM", () => { flaskProcess.kill(); process.exit(); });
// ──────────────────────────────────────────────────────────────────

const app    = express();
const server = http.createServer(app);

// ── Config ────────────────────────────────────────────────────────
const connectDB        = require("./config/db");
const { initSocket }   = require("./config/socket");

// ── Middlewares ───────────────────────────────────────────────────
const { notFound, globalError } = require("./middlewares/errorHandler");
const riskMiddleware             = require("./middlewares/riskMiddleware");
// ── Routes ───────────────────────────────────────────────────────
const authRoutes         = require("./routes/authRoutes");
const userRoutes         = require("./routes/userRoutes");
const notifRoutes        = require("./routes/notificationRoutes");
const penaltyRoutes      = require("./routes/penaltyRoutes");
const stockRoutes        = require("./routes/stockRoutes");
const livraisonRoutes    = require("./routes/livraisonRoutes");
const factureRoutes      = require("./routes/factureRoutes");
const commandeRoutes     = require("./routes/commandeRoutes");
const emissionRoutes     = require("./routes/emissionRoutes");
const historiqueRoutes   = require("./routes/historiqueRoutes");
const dashboardRoutes    = require("./routes/dashboardRoutes");
const chatbotRoutes      = require("./routes/chatbotRoutes");
const chatSessionRoutes  = require("./routes/chatSessionRoutes");
const contratRoutes      = require("./routes/contratRoutes");
const productRoutes      = require("./routes/productRoutes");
const transporteurRoutes = require("./routes/transporteurRoutes");
const historyRoutes      = require("./routes/historyRoutes");
const debugRoutes        = require("./routes/debugRoutes");
const initRoutes         = require("./routes/initRoutes");

// ── CRUD générique pour les modèles simples ───────────────────────
const createCrudRoutes = require("./controllers/crudController");
const TypeProduit  = require("./models/TypeProduit");
const Banque       = require("./models/Banque");
const Vente        = require("./models/Vente");
const Cabotage     = require("./models/Cabotage");
const Navire       = require("./models/Navire");
const ModePaiement = require("./models/ModePaiement");
const Cargaison    = require("./models/Cargaison");
const TypeFacture  = require("./models/TypeFacture");
const Port         = require("./models/Port");
const Referentiel  = require("./models/Referentiel");
const SousProduit  = require("./models/SousProduit");
const Tiers        = require("./models/Tiers");
const Document     = require("./models/Document");
const Reception    = require("./models/Reception");
const Conformite   = require("./models/Conformite");
const ExportImport = require("./models/ExportImport");
const Pays         = require("./models/Pays");
// ── Initialisation ────────────────────────────────────────────────
connectDB();
const io = initSocket(server);
// ── Middlewares Express ───────────────────────────────────────────
const cors = require("cors");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Configuration CORS permissive (dev)
app.use(cors({
  origin: function (origin, callback) {
    // Autoriser tous les origins (dev mode)
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
}));
// Gérer les requêtes OPTIONS (preflight) explicitement
app.options('*', cors());
// ── Analyse de risque (fire-and-forget après chaque réponse 2xx) ──
app.use(riskMiddleware);
// ── Montage des routes ────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/notifications', notifRoutes);
app.use('/api/penalties',     penaltyRoutes);
app.use('/api/penalites',     penaltyRoutes);
app.use('/api/stock',         stockRoutes);
app.use('/api/livraisons',    livraisonRoutes);
app.use('/api/factures',      factureRoutes);
app.use('/api/commandes',     commandeRoutes);
app.use('/api/emissions',     emissionRoutes);
app.use('/api/historique',    historiqueRoutes);
app.use('/api/home',          dashboardRoutes);
app.use('/api/chatbot',       chatbotRoutes);
app.use('/api/chat',          chatSessionRoutes);
app.use('/api/contrats', (req, res, next) => {
  const orig = res.json.bind(res);
  res.json = (body) => {
    console.log(`🔍 /api/contrats ${req.method} → ${res.statusCode}`, JSON.stringify(body)?.slice(0, 200));
    return orig(body);
  };
  next();
}, contratRoutes);
app.use('/api/contrats-vente',createCrudRoutes(require('./models/ContratVente'), 'ContratVente', {
  populateFields: ['produit', 'client']
}));
app.use('/api/products',      productRoutes);
app.use('/api/transporteurs', transporteurRoutes);
app.use('/api/history',       historyRoutes);
app.use('/api/debug',         debugRoutes);
app.use('/api/init-data',     initRoutes);
// ── Routes CRUD simples ───────────────────────────────────────────
app.use('/api/type-produits',  createCrudRoutes(TypeProduit,  'TypeProduit'));
app.use('/api/banques',        createCrudRoutes(Banque,       'Banque'));
app.use('/api/ventes',         createCrudRoutes(Vente,        'Vente'));
app.use('/api/cabotage',       createCrudRoutes(Cabotage,     'Cabotage'));
app.use('/api/navires',        createCrudRoutes(Navire,       'Navire'));
app.use('/api/modes-paiement', createCrudRoutes(ModePaiement, 'ModePaiement'));
app.use('/api/cargaisons',     createCrudRoutes(Cargaison,    'Cargaison', {
  populateFields: ['navire', 'produits.produit']
}));
app.use('/api/types-facture',  createCrudRoutes(TypeFacture,  'TypeFacture'));
app.use('/api/ports',          createCrudRoutes(Port,         'Port'));
app.use('/api/referentiels',   createCrudRoutes(Referentiel,  'Referentiel'));
app.use('/api/sous-produits',  createCrudRoutes(SousProduit,  'SousProduit', {
  populateFields: ['produitParent']
}));
app.use('/api/tiers',          createCrudRoutes(Tiers,        'Tiers'));
app.use('/api/documents',      createCrudRoutes(Document,     'Document'));
app.use('/api/receptions',     createCrudRoutes(Reception,    'Reception', {
  populateFields: ['commande']
}));
app.use('/api/conformites',    createCrudRoutes(Conformite,   'Conformite'));
app.use('/api/export-import',  createCrudRoutes(ExportImport, 'ExportImport', {
  populateFields: ['paysOrigine', 'paysDestination', 'produits.produit']
}));
app.use('/api/exports',        createCrudRoutes(ExportImport, 'ExportImport', {
  populateFields: ['paysOrigine', 'paysDestination', 'produits.produit']
}));
app.use('/api/pays',           createCrudRoutes(Pays,         'Pays'));

// ── Health check ──────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API fonctionnelle avec Socket.IO et JWT',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    socket: { connected: io.engine.clientsCount }
  });
});
// ── Middlewares d'erreur (toujours en dernier) ────────────────────
app.use(notFound);
app.use(globalError);

// ── Démarrage ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`\n🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📡 API disponible sur http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket disponible sur ws://localhost:${PORT}`);
  console.log(`\n💡 Comptes de test :`);
});
module.exports = { app, server };