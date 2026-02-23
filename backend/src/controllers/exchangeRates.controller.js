const axios = require('axios');

// ─── API Sources (all free, no key required) ───
const FRANKFURTER_URL = 'https://api.frankfurter.app';
const OPEN_ER_URL = 'https://open.er-api.com/v6/latest';

// ─── In-memory cache (15 min TTL) ───
const cache = {};
const CACHE_TTL = 15 * 60 * 1000;

const getCached = (key) => {
  const entry = cache[key];
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
};
const setCache = (key, data) => { cache[key] = { data, ts: Date.now() }; };

// ─── Fetch rates from multiple sources with fallback ───
const fetchRatesForBase = async (base) => {
  const cacheKey = `rates_${base}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // Source 1: open.er-api.com (supports XOF, XAF, GNF, NGN, etc.)
  try {
    const res = await axios.get(`${OPEN_ER_URL}/${base}`, { timeout: 8000 });
    if (res.data?.result === 'success' && res.data.rates) {
      const result = { rates: res.data.rates, date: res.data.time_last_update_utc?.split(' 00:')[0] || new Date().toISOString().split('T')[0], source: 'open.er-api.com' };
      setCache(cacheKey, result);
      console.log(`💱 Rates fetched from open.er-api.com for ${base} (${Object.keys(result.rates).length} currencies)`);
      return result;
    }
  } catch (_) {}

  // Source 2: frankfurter.app (EUR-based, no African currencies)
  try {
    const res = await axios.get(`${FRANKFURTER_URL}/latest?from=${base}`, { timeout: 8000 });
    if (res.data?.rates) {
      const africanExtra = getAfricanRates(base, res.data.rates);
      const result = { rates: { ...res.data.rates, ...africanExtra }, date: res.data.date, source: 'frankfurter.app+fallback' };
      setCache(cacheKey, result);
      console.log(`💱 Rates fetched from frankfurter.app for ${base}`);
      return result;
    }
  } catch (_) {}

  // Source 3: static fallback table
  const table = getAfricanRatesTable();
  if (table[base]) {
    const baseVal = table[base];
    const rates = {};
    Object.entries(table).forEach(([code, val]) => {
      if (code !== base) rates[code] = parseFloat((val / baseVal).toFixed(6));
    });
    return { rates, date: new Date().toISOString().split('T')[0], source: 'static_fallback' };
  }

  return null;
};

// GET /api/exchange-rates/live?base=EUR
const getLiveRates = async (req, res) => {
  try {
    const base = (req.query.base || 'EUR').toUpperCase();
    const result = await fetchRatesForBase(base);
    if (!result) {
      return res.status(503).json({ success: false, message: 'Impossible de récupérer les taux. Réessayez.' });
    }
    res.json({
      success: true,
      data: { base, date: result.date, rates: result.rates, source: result.source }
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

    // Fetch rates based on 'from' currency
    const result = await fetchRatesForBase(fromUpper);
    if (result?.rates?.[toUpper]) {
      const rate = result.rates[toUpper];
      return res.json({
        success: true,
        data: { from: fromUpper, to: toUpper, amount: amt, rate, result: parseFloat((amt * rate).toFixed(2)), date: result.date, source: result.source }
      });
    }

    // Cross-rate via EUR
    const eurResult = await fetchRatesForBase('EUR');
    if (eurResult?.rates?.[fromUpper] && eurResult?.rates?.[toUpper]) {
      const rate = eurResult.rates[toUpper] / eurResult.rates[fromUpper];
      return res.json({
        success: true,
        data: { from: fromUpper, to: toUpper, amount: amt, rate: parseFloat(rate.toFixed(6)), result: parseFloat((amt * rate).toFixed(2)), date: eurResult.date, source: eurResult.source + '+cross' }
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
    // Fallback with static list
    const all = {
      EUR: 'Euro', USD: 'US Dollar', GBP: 'British Pound',
      XOF: 'Franc CFA BCEAO', XAF: 'Franc CFA BEAC', GNF: 'Franc Guinéen',
      CDF: 'Franc Congolais', MAD: 'Dirham Marocain', DZD: 'Dinar Algérien',
      TND: 'Dinar Tunisien', NGN: 'Naira Nigérian', GHS: 'Cedi Ghanéen',
      KES: 'Shilling Kényan', ZAR: 'Rand Sud-Africain', EGP: 'Livre Égyptienne',
      CHF: 'Franc Suisse', CAD: 'Dollar Canadien', JPY: 'Yen Japonais',
      CNY: 'Yuan Chinois', AED: 'Dirham Émirats', SAR: 'Riyal Saoudien',
    };
    res.json({ success: true, data: all });
  }
};

// Static African currency rates relative to EUR (last resort fallback)
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
