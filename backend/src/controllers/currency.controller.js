const { Currency, RateHistory, RateAlert, Alert } = require('../models');
const axios = require('axios');

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

    // --- Feature 8: Check rate alert thresholds ---
    try {
      const rateAlerts = await RateAlert.findAll({ where: { currencyCode: currency.code, isActive: true } });
      for (const ra of rateAlerts) {
        const rateVal = ra.rateType === 'buyRate' ? parseFloat(buyRate || currency.buyRate)
          : ra.rateType === 'sellRate' ? parseFloat(sellRate || currency.sellRate)
          : parseFloat(currentRate || currency.currentRate);
        const threshold = parseFloat(ra.threshold);
        const triggered = (ra.condition === 'above' && rateVal >= threshold) || (ra.condition === 'below' && rateVal <= threshold);
        if (triggered) {
          const direction = ra.condition === 'above' ? '↑ au-dessus' : '↓ en-dessous';
          await Alert.create({
            type: 'rate_change',
            title: `Alerte taux: ${currency.code} ${direction} de ${threshold}`,
            message: `Le taux ${ra.rateType} de ${currency.code} est à ${rateVal} (seuil: ${threshold}). ${ra.notes || ''}`,
            entityId: currency.id,
            entityType: 'currency',
            severity: 'warning'
          });
          await ra.update({ lastTriggeredAt: new Date() });
        }
      }
    } catch (alertErr) {
      console.error('Rate alert check error:', alertErr.message);
    }

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
      isBase: c.isBase,
      stockAmount: parseFloat(c.stockAmount),
      lowStockAlert: parseFloat(c.lowStockAlert),
      isLow: !c.isBase && parseFloat(c.lowStockAlert) > 0 && parseFloat(c.stockAmount) <= parseFloat(c.lowStockAlert),
      currentRate: parseFloat(c.currentRate),
      buyRate: parseFloat(c.buyRate || c.currentRate),
      sellRate: parseFloat(c.sellRate || c.currentRate),
    }));
    return res.json({ success: true, data: summary });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/currencies/rate-for-pair?from=EUR&to=XOF&type=sell
const getRateForPair = async (req, res) => {
  try {
    const { from, to, type = 'sell' } = req.query;
    if (!from || !to) return res.status(400).json({ success: false, message: 'from and to are required.' });
    const currFrom = await Currency.findOne({ where: { code: from.toUpperCase(), isActive: true } });
    const currTo = await Currency.findOne({ where: { code: to.toUpperCase(), isActive: true } });
    if (!currFrom || !currTo) return res.json({ success: true, data: { suggestedRate: null, message: 'Currency not configured.' } });

    const fromBuy = parseFloat(currFrom.buyRate || currFrom.currentRate);
    const fromSell = parseFloat(currFrom.sellRate || currFrom.currentRate);
    const toBuy = parseFloat(currTo.buyRate || currTo.currentRate);
    const toSell = parseFloat(currTo.sellRate || currTo.currentRate);

    let suggestedRate, marketRate;
    if (type === 'sell') {
      marketRate = toSell / fromBuy;
      suggestedRate = marketRate;
    } else if (type === 'buy') {
      marketRate = toBuy / fromSell;
      suggestedRate = marketRate;
    } else {
      marketRate = parseFloat(currTo.currentRate) / parseFloat(currFrom.currentRate);
      suggestedRate = marketRate;
    }

    return res.json({
      success: true,
      data: {
        suggestedRate: Math.round(suggestedRate * 10000) / 10000,
        marketRate: Math.round(marketRate * 10000) / 10000,
        fromCurrency: { code: currFrom.code, buyRate: fromBuy, sellRate: fromSell },
        toCurrency: { code: currTo.code, buyRate: toBuy, sellRate: toSell }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- Feature 8: Rate Alert CRUD ---
const getRateAlerts = async (req, res) => {
  try {
    const alerts = await RateAlert.findAll({ where: { isActive: true }, order: [['createdAt', 'DESC']] });
    return res.json({ success: true, data: alerts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createRateAlert = async (req, res) => {
  try {
    const { currencyCode, condition, threshold, rateType, notes } = req.body;
    if (!currencyCode || !condition || !threshold) {
      return res.status(400).json({ success: false, message: 'currencyCode, condition and threshold are required.' });
    }
    const alert = await RateAlert.create({
      currencyCode: currencyCode.toUpperCase(),
      condition,
      threshold: parseFloat(threshold),
      rateType: rateType || 'currentRate',
      userId: req.user.id,
      notes
    });
    return res.status(201).json({ success: true, message: 'Rate alert created.', data: alert });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteRateAlert = async (req, res) => {
  try {
    const alert = await RateAlert.findByPk(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: 'Rate alert not found.' });
    await alert.update({ isActive: false });
    return res.json({ success: true, message: 'Rate alert deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Auto-sync market rates into Currency records ───────────────────────────
const syncMarketRates = async (triggeredBy = 'auto') => {
  try {
    const currencies = await Currency.findAll({ where: { isActive: true } });
    if (!currencies.length) return { updated: 0, skipped: 0 };

    // Fetch all rates based on EUR as pivot
    const res = await axios.get('https://open.er-api.com/v6/latest/EUR', { timeout: 10000 });
    if (res.data?.result !== 'success' || !res.data.rates) throw new Error('API unavailable');

    const rates = res.data.rates;
    const today = new Date().toISOString().split('T')[0];
    let updated = 0, skipped = 0;

    for (const currency of currencies) {
      if (currency.code === 'EUR') continue;
      const marketRate = rates[currency.code];
      if (!marketRate) { skipped++; continue; }

      const newRate = parseFloat(marketRate.toFixed(6));
      const oldRate = parseFloat(currency.currentRate);

      // Only update if rate changed by more than 0.01%
      if (Math.abs(newRate - oldRate) / (oldRate || 1) < 0.0001) { skipped++; continue; }

      // Save history
      await RateHistory.create({
        currencyCode: currency.code,
        rate: newRate,
        buyRate: parseFloat(currency.buyRate || newRate),
        sellRate: parseFloat(currency.sellRate || newRate),
        recordedBy: null,
        notes: `Auto-sync ${today} (${triggeredBy})`
      }).catch(() => {});

      await currency.update({ currentRate: newRate });
      updated++;
    }

    console.log(`💱 Rate sync done: ${updated} updated, ${skipped} skipped (${triggeredBy})`);
    return { updated, skipped, date: today, source: 'open.er-api.com' };
  } catch (err) {
    console.error('❌ Rate sync failed:', err.message);
    throw err;
  }
};

// POST /api/currencies/sync-rates — manual trigger (admin only)
const syncRates = async (req, res) => {
  try {
    const result = await syncMarketRates('manual');
    return res.json({ success: true, message: `Taux mis à jour : ${result.updated} devises.`, data: result });
  } catch (err) {
    return res.status(503).json({ success: false, message: 'Impossible de synchroniser les taux. Vérifiez votre connexion.' });
  }
};

module.exports = { getAll, getById, create, update, getRateHistory, adjustStock, getStockSummary, getRateForPair, getRateAlerts, createRateAlert, deleteRateAlert, syncRates, syncMarketRates };
