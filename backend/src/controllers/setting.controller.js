const { Setting } = require('../models');

const DEFAULTS = {
  businessName: 'KABRAK Exchange Pro',
  businessPhone: '',
  businessAddress: '',
  businessEmail: '',
};

// GET /api/settings — retourne tous les settings
const getSettings = async (req, res) => {
  try {
    const rows = await Setting.findAll();
    const settings = { ...DEFAULTS };
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/settings — met à jour un ou plusieurs settings
const updateSettings = async (req, res) => {
  try {
    const updates = req.body; // { businessName: '...', ... }
    for (const [key, value] of Object.entries(updates)) {
      await Setting.upsert({ key, value: String(value) });
    }
    const rows = await Setting.findAll();
    const settings = { ...DEFAULTS };
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/settings/public — retourne businessName uniquement (sans auth, pour portail client)
const getPublicSettings = async (req, res) => {
  try {
    const row = await Setting.findOne({ where: { key: 'businessName' } });
    res.json({ success: true, data: { businessName: row?.value || DEFAULTS.businessName } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getSettings, updateSettings, getPublicSettings };
