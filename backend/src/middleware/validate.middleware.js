const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const messages = error.details.map(d => d.message.replace(/"/g, "'"));
    return res.status(400).json({ success: false, message: messages.join('; ') });
  }
  next();
};

module.exports = validate;
