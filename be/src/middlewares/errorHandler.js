const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} non trouvée`
  });
};

const globalError = (err, req, res, next) => {
  console.error("❌ Server error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
};

module.exports = { notFound, globalError };