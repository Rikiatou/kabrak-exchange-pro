const axios = require('axios');

// Uses exchangerate-api.com free tier (no key needed for basic) or frankfurter.app (free, no key)
const FRANKFURTER_URL = 'https://api.frankfurter.app';

// GET /api/exchange-rates/live?base=EUR
const getLiveRates = async (req, res) => {
  try {
    const base = (req.query.base || 'EUR').toUpperCase();
    const response = await axios.get(`${FRANKFURTER_URL}/latest?from=${base}`, { timeout: 8000 });
    const { rates, date } = response.data;
    // Add common African currencies with approximate rates (not on Frankfurter)
    const africanRates = getAfricanRates(base, rates);
    res.json({
      success: true,
      data: {
        base,
        date,
        rates: { ...rates, ...africanRates },
        source: 'frankfurter.app',
      }
    });
  } catch (err) {
    res.status(503).json({ success: false, message: 'Impossible de récupérer les taux en temps réel. Vérifiez votre connexion.' });
  }
};

// GET /api/exchange-rates/convert?from=EUR&to=XOF&amount=100
const convertAmount = async (req, res) => {
  try {
    const { from, to, amount } = req.query;
    if (!from || !to || !amount) {
      return res.status(400).json({ success: false, message: 'from, to et amount sont requis' });
    }
    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();
    const amt = parseFloat(amount);

    // Try Frankfurter first
    try {
      const response = await axios.get(
        `${FRANKFURTER_URL}/latest?from=${fromUpper}&to=${toUpper}`,
        { timeout: 8000 }
      );
      const rate = response.data.rates[toUpper];
      if (rate) {
        return res.json({
          success: true,
          data: { from: fromUpper, to: toUpper, amount: amt, rate, result: amt * rate, date: response.data.date, source: 'frankfurter.app' }
        });
      }
    } catch (_) {}

    // Fallback: use African rates table
    const baseRates = getAfricanRatesTable();
    const fromRate = baseRates[fromUpper];
    const toRate = baseRates[toUpper];
    if (fromRate && toRate) {
      const rate = toRate / fromRate;
      return res.json({
        success: true,
        data: { from: fromUpper, to: toUpper, amount: amt, rate, result: amt * rate, date: new Date().toISOString().split('T')[0], source: 'table_approx' }
      });
    }

    res.status(404).json({ success: false, message: `Taux introuvable pour ${fromUpper}/${toUpper}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/exchange-rates/currencies — list of supported currencies
const getSupportedCurrencies = async (req, res) => {
  try {
    const response = await axios.get(`${FRANKFURTER_URL}/currencies`, { timeout: 8000 });
    const extra = {
      XOF: 'Franc CFA BCEAO',
      XAF: 'Franc CFA BEAC',
      GNF: 'Franc Guinéen',
      CDF: 'Franc Congolais',
      MAD: 'Dirham Marocain',
      DZD: 'Dinar Algérien',
      TND: 'Dinar Tunisien',
      NGN: 'Naira Nigérian',
      GHS: 'Cedi Ghanéen',
      KES: 'Shilling Kényan',
      ZAR: 'Rand Sud-Africain',
      EGP: 'Livre Égyptienne',
      ETB: 'Birr Éthiopien',
      TZS: 'Shilling Tanzanien',
      UGX: 'Shilling Ougandais',
      RWF: 'Franc Rwandais',
      BIF: 'Franc Burundais',
      MGA: 'Ariary Malgache',
      MZN: 'Metical Mozambicain',
      AOA: 'Kwanza Angolais',
    };
    res.json({ success: true, data: { ...response.data, ...extra } });
  } catch (err) {
    res.status(503).json({ success: false, message: 'Service indisponible' });
  }
};

// Approximate African currency rates relative to EUR (updated periodically)
const getAfricanRatesTable = () => ({
  EUR: 1,
  USD: 1.08,
  GBP: 0.86,
  XOF: 655.957,
  XAF: 655.957,
  GNF: 9300,
  CDF: 2900,
  MAD: 10.8,
  DZD: 145,
  TND: 3.35,
  NGN: 1650,
  GHS: 13.5,
  KES: 140,
  ZAR: 20,
  EGP: 52,
  ETB: 60,
  TZS: 2700,
  UGX: 4000,
  RWF: 1380,
  BIF: 3100,
  MGA: 4900,
  MZN: 69,
  AOA: 900,
});

const getAfricanRates = (base, existingRates) => {
  const table = getAfricanRatesTable();
  const baseInEur = table[base] ? 1 / table[base] : null;
  if (!baseInEur) return {};
  const result = {};
  Object.entries(table).forEach(([code, rateToEur]) => {
    if (!existingRates[code] && code !== base) {
      result[code] = parseFloat((rateToEur * baseInEur).toFixed(4));
    }
  });
  return result;
};

module.exports = { getLiveRates, convertAmount, getSupportedCurrencies };
