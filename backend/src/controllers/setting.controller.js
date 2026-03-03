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
        // Sauvegarder automatiquement via DELETE+INSERT
        const sequelize = Setting.sequelize;
        await sequelize.query(
          `DELETE FROM settings WHERE "key" = 'businessName' AND ("userId" = :userId OR "userId" IS NULL)`,
          { replacements: { userId: ownerId }, type: sequelize.QueryTypes.DELETE }
        ).catch(() => {});
        await sequelize.query(
          `INSERT INTO settings ("key", "value", "userId") VALUES ('businessName', :value, :userId)`,
          { replacements: { value: owner.businessName, userId: ownerId }, type: sequelize.QueryTypes.INSERT }
        ).catch(() => {});
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
    
    const sequelize = Setting.sequelize;
    for (const [key, value] of Object.entries(updates)) {
      await sequelize.query(
        `DELETE FROM settings WHERE "key" = :key AND ("userId" = :userId OR "userId" IS NULL)`,
        { replacements: { key, userId: ownerId }, type: sequelize.QueryTypes.DELETE }
      );
      await sequelize.query(
        `INSERT INTO settings ("key", "value", "userId") VALUES (:key, :value, :userId)`,
        { replacements: { key, value: String(value), userId: ownerId }, type: sequelize.QueryTypes.INSERT }
      );
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
    
    const sequelize = Setting.sequelize;
    
    // Debug: see ALL businessLogo rows in the entire table
    const [existing] = await sequelize.query(
      `SELECT id, "key", "userId", length("value"::text) as val_len FROM settings WHERE "key" = 'businessLogo'`,
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('🔍 Existing businessLogo rows:', JSON.stringify(existing));
    
    // Delete ALL businessLogo rows from the entire table (any userId)
    await sequelize.query(
      `DELETE FROM settings WHERE "key" = 'businessLogo'`,
      { type: sequelize.QueryTypes.DELETE }
    );
    console.log('🔍 Deleted all businessLogo rows');
    
    // Now insert fresh
    try {
      await sequelize.query(
        `INSERT INTO settings ("key", "value", "userId") VALUES ('businessLogo', :value, :userId)`,
        { replacements: { value: logoUrl, userId: ownerId }, type: sequelize.QueryTypes.INSERT }
      );
      console.log('✅ Logo saved via INSERT');
    } catch (insertErr) {
      console.error('❌ INSERT failed:', insertErr.message);
      // Final fallback: direct UPDATE on any remaining row
      await sequelize.query(
        `UPDATE settings SET "value" = :value, "userId" = :userId WHERE "key" = 'businessLogo'`,
        { replacements: { value: logoUrl, userId: ownerId }, type: sequelize.QueryTypes.UPDATE }
      );
      // If no rows to update, try insert without Sequelize
      const [checkRows] = await sequelize.query(
        `SELECT count(*) as cnt FROM settings WHERE "key" = 'businessLogo'`,
        { type: sequelize.QueryTypes.SELECT }
      );
      if (!checkRows || parseInt(checkRows.cnt) === 0) {
        await sequelize.query(
          `INSERT INTO settings (id, "key", "value", "userId") VALUES (nextval('settings_id_seq'), 'businessLogo', :value, :userId)`,
          { replacements: { value: logoUrl, userId: ownerId }, type: sequelize.QueryTypes.RAW }
        );
      }
      console.log('✅ Logo saved via fallback UPDATE');
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
