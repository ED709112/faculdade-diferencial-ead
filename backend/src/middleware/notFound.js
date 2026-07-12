const notFound = (req, res, next) => {
  res.status(404).json({
    error: 'Rota não encontrada.',
    path: req.originalUrl,
    method: req.method
  });
};

module.exports = notFound;
