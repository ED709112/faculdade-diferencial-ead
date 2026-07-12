const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Arquivo muito grande.' });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Arquivo muito grande. Tamanho máximo: 50MB.' });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Campo de arquivo inesperado.' });
  }

  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Erro interno do servidor.';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
