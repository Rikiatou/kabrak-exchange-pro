const { Currency, RateHistory } = require('../models');

const getAll = async (req, res) => {
  try {
    const currencies = await Currency.findAll({ where: { isActive: true }, order: [['code', 'ASC']] });
    return res.json({ success: true, data: currencies });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const currency = await Currency.findByPk(req.params.id);
    if (!currency) return res.status(404).json({ success: false, message: 'Currency not found.' });
    const history = await RateHistory.findAll({
      where: { currencyCode: currency.code },
      order: [['createdAt', 'DESC']],
      limit: 30
    });
    return res.json({ success: true, data: { ...currency.toJSON(), history } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { code, name, symbol, currentRate, buyRate, sellRate, stockAmount, lowStockAlert, isBase } = req.body;
    if (!code || !name || !symbol || !currentRate) {
      return res.status(400).json({ success: false, message: 'code, name, symbol and currentRate are required.' });
    }
    const existing = await Currency.findOne({ where: { code: code.toUpperCase() } });
    if (existing) return res.status(400).json({ success: false, message: 'Currency code already exists.' });
    const currency = await Currency.create({
      code: code.toUpperCase(), name, symbol,
      currentRate, buyRate, sellRate, stockAmount, lowStockAlert, isBase
    });
    return res.status(201).json({ success: true, message: 'Currency created.', data: currency });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const currency = await Currency.findByPk(req.params.id);
    if (!currency) return res.status(404).json({ success: false, message: 'Currency not found.' });
    const { name, symbol, currentRate, buyRate, sellRate, stockAmount, lowStockAlert } = req.body;

    if (currentRate && parseFloat(currentRate) !== parseFloat(currency.currentRate)) {
      await RateHistory.create({
        currencyCode: currency.code,
        rate: parseFloat(currentRate),
        buyRate: buyRate ? parseFloat(buyRate) : currency.buyRate,
        sellRate: sellRate ? parseFloat(sellRate) : currency.sellRate,
        recordedBy: req.user.id
      });
    }

    await currency.update({ name, symbol, currentRate, buyRate, sellRate, stockAmount, lowStockAlert });
    return res.json({ success: true, message: 'Currency updated.', data: currency });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getRateHistory = async (req, res) => {
  try {
    const { code } = req.params;
    const history = await RateHistory.findAll({
      where: { currencyCode: code.toUpperCase() },
      order: [['createdAt', 'DESC']],
      limit: 60
    });
    return res.json({ success: true, data: history });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/currencies/:id/stock — adjust stock manually
const adjustStock = async (req, res) => {
  try {
    const currency = await Currency.findByPk(req.params.id);
    if (!currency) return res.status(404).json({ success: false, message: 'Currency not found.' });
    const { adjustment, type, notes } = req.body;
    // type: 'set' | 'add' | 'subtract'
    const adj = parseFloat(adjustment);
    if (isNaN(adj) || adj < 0) return res.status(400).json({ success: false, message: 'Montant invalide.' });
    let newStock;
    if (type === 'set') newStock = adj;
    else if (type === 'add') newStock = parseFloat(currency.stockAmount) + adj;
    else if (type === 'subtract') newStock = Math.max(0, parseFloat(currency.stockAmount) - adj);
    else return res.status(400).json({ success: false, message: "type doit être 'set', 'add' ou 'subtract'." });
    await currency.update({ stockAmount: newStock });
    return res.json({ success: true, data: currency, previousStock: parseFloat(currency.stockAmount), newStock });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/currencies/stock — all currencies with stock summary
const getStockSummary = async (req, res) => {
  try {
    const currencies = await Currency.findAll({ where: { isActive: true }, order: [['code', 'ASC']] });
    const summary = currencies.map(c => ({
      id: c.id,
      code: c.code,
      name: c.name,
      symbol: c.symbol,
      stockAmount: parseFloat(c.stockAmount),
      lowStockAlert: parseFloat(c.lowStockAlert),
      isLow: parseFloat(c.stockAmount) <= parseFloat(c.lowStockAlert),
      currentRate: parseFloat(c.currentRate),
      buyRate: parseFloat(c.buyRate || c.currentRate),
      sellRate: parseFloat(c.sellRate || c.currentRate),
    }));
    return res.json({ success: true, data: summary });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, getById, create, update, getRateHistory, adjustStock, getStockSummary };
