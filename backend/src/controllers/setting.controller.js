const { Setting } = require('../models');

const DEFAULTS = {
  businessName: 'Mon Bureau de Change',
  businessPhone: '',
  businessAddress: '',
  businessEmail: '',
  brandColor: '#0B6E4F',
  businessLogo: '',
};

// GET /api/settings — retourne tous les settings
const getSettings = async (req, res) => {
  try {
    const ownerId = req.user.teamOwnerId || req.user.id;
    const rows = await Setting.findAll({ where: { userId: ownerId } });
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
    const ownerId = req.user.teamOwnerId || req.user.id;
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await Setting.upsert({ key, value: String(value), userId: ownerId });
    }
    const rows = await Setting.findAll({ where: { userId: ownerId } });
    const settings = { ...DEFAULTS };
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/settings/public?userId=... — retourne businessName + brandColor (sans auth, pour portail client)
const getPublicSettings = async (req, res) => {
  try {
    const { userId } = req.query;
    const where = userId ? { userId } : {};
    const rows = await Setting.findAll({ where });
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json({ success: true, data: {
      businessName: settings.businessName || DEFAULTS.businessName,
      brandColor: settings.brandColor || DEFAULTS.brandColor,
      businessPhone: settings.businessPhone || '',
      businessAddress: settings.businessAddress || '',
    }});
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/settings/upload-logo — upload logo to Cloudinary
const uploadLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const ownerId = req.user.teamOwnerId || req.user.id;
    const logoUrl = req.file.path;
    await Setting.upsert({ key: 'businessLogo', value: logoUrl, userId: ownerId });
    res.json({ success: true, data: { businessLogo: logoUrl } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getSettings, updateSettings, getPublicSettings, uploadLogo };
