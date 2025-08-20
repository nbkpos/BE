module.exports = (schema) => (req, res, next) => {
  const payload = ['GET', 'DELETE'].includes(req.method) ? req.query : req.body;
  const { error, value } = schema.validate(payload, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({ success: false, error: 'Validation error', details: error.details.map(d => d.message) });
  }
  if (['GET', 'DELETE'].includes(req.method)) req.query = value;
  else req.body = value;
  next();
};
