const { Setting, User } = require('../models');

const DEFAULTS = {
  businessName: '',
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
    
    // Si pas de businessName dans les settings, essayer de le récupérer depuis le User
    if (!settings.businessName) {
      const owner = await User.findByPk(ownerId, { attributes: ['businessName', 'phone'] });
      if (owner?.businessName) {
        settings.businessName = owner.businessName;
        // Sauvegarder automatiquement pour la prochaine fois
        const existing = await Setting.findOne({ where: { key: 'businessName', userId: ownerId } });
        if (!existing) {
          const nullRow = await Setting.findOne({ where: { key: 'businessName', userId: null } });
          if (nullRow) {
            await nullRow.update({ value: owner.businessName, userId: ownerId });
          } else {
            await Setting.create({ key: 'businessName', value: owner.businessName, userId: ownerId });
          }
        }
      }
      if (!settings.businessPhone && owner?.phone) {
        settings.businessPhone = owner.phone;
      }
    }
    
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
      // Chercher d'abord avec userId, puis avec NULL
      let existing = await Setting.findOne({ where: { key, userId: ownerId } });
      if (!existing) {
        existing = await Setting.findOne({ where: { key, userId: null } });
      }
      if (existing) {
        await existing.update({ value: String(value), userId: ownerId });
      } else {
        await Setting.create({ key, value: String(value), userId: ownerId });
      }
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
      businessLogo: settings.businessLogo || '',
    }});
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/settings/upload-logo — upload logo to Cloudinary
const uploadLogo = async (req, res) => {
  try {
    console.log('📸 Upload logo attempt:', {
      hasFile: !!req.file,
      userId: req.user?.id,
      fileInfo: req.file ? {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      } : 'No file',
      headers: Object.keys(req.headers)
    });

    if (!req.file) {
      console.error('❌ No file in request');
      return res.status(400).json({ 
        success: false, 
        message: 'Aucun fichier uploadé. Veuillez sélectionner une image.' 
      });
    }
    
    if (!req.file.path) {
      console.error('❌ Cloudinary upload failed - no path returned');
      console.log('🔍 Cloudinary env check:', {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? '✅' : '❌',
        api_key: process.env.CLOUDINARY_API_KEY ? '✅' : '❌',
        api_secret: process.env.CLOUDINARY_API_SECRET ? '✅' : '❌'
      });
      return res.status(500).json({
        success: false,
        message: 'Erreur Cloudinary: Vérifiez les variables CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET sur Railway.'
      });
    }
    
    const ownerId = req.user.teamOwnerId || req.user.id;
    const logoUrl = req.file.path;
    
    console.log('✅ Logo uploaded to Cloudinary:', logoUrl);
    console.log('🔍 Saving logo for userId:', ownerId);
    
    // Chercher d'abord avec userId, puis avec NULL userId (orphan rows)
    let existing = await Setting.findOne({ 
      where: { key: 'businessLogo', userId: ownerId } 
    });
    if (!existing) {
      existing = await Setting.findOne({ 
        where: { key: 'businessLogo', userId: null } 
      });
    }
    
    if (existing) {
      await existing.update({ value: logoUrl, userId: ownerId });
      console.log('✅ Logo updated in database (id:', existing.id, ')');
    } else {
      await Setting.create({ key: 'businessLogo', value: logoUrl, userId: ownerId });
      console.log('✅ Logo created in database');
    }
    
    res.json({ 
      success: true, 
      message: 'Logo mis à jour avec succès',
      data: { businessLogo: logoUrl } 
    });
  } catch (err) {
    console.error('❌ Upload logo error:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    res.status(500).json({ 
      success: false, 
      message: `Erreur lors de l'upload: ${err.message}` 
    });
  }
};

module.exports = { getSettings, updateSettings, getPublicSettings, uploadLogo };
