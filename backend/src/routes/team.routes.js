const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { authenticate } = require('../middleware/auth.middleware');
const { User } = require('../models');
const { Op } = require('sequelize');

router.use(authenticate);

// GET /api/team — list team members
router.get('/', async (req, res) => {
  try {
    const ownerId = req.user.teamOwnerId || req.user.id;
    
    const members = await User.findAll({
      where: {
        [Op.or]: [
          { id: ownerId },
          { teamOwnerId: ownerId }
        ],
        isActive: true
      },
      attributes: ['id', 'email', 'firstName', 'lastName', 'phone', 'teamRole', 'lastLogin', 'createdAt', 'isActive'],
      order: [['teamRole', 'ASC'], ['createdAt', 'ASC']]
    });

    res.json({ success: true, data: members });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/team/invite — invite a new team member
router.post('/invite', async (req, res) => {
  try {
    // Only owner, manager or admin can invite
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && req.user.teamRole === 'cashier') {
      return res.status(403).json({ success: false, message: 'Seuls les propriétaires et managers peuvent inviter des membres.' });
    }

    const ownerId = req.user.teamOwnerId || req.user.id;
    const { email, firstName, lastName, phone, teamRole, password } = req.body;

    if (!email || !password || !firstName) {
      return res.status(400).json({ success: false, message: 'Email, prénom et mot de passe sont requis.' });
    }

    // Validate teamRole
    const allowedRoles = ['manager', 'cashier'];
    if (teamRole && !allowedRoles.includes(teamRole)) {
      return res.status(400).json({ success: false, message: 'Rôle invalide. Choisissez manager ou cashier.' });
    }

    // Only owner can create managers
    if (teamRole === 'manager' && req.user.teamRole !== 'owner') {
      return res.status(403).json({ success: false, message: 'Seul le propriétaire peut créer des managers.' });
    }

    // Check if email already exists
    const existing = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé.' });
    }

    // Check team size limit (max 10 members)
    const teamCount = await User.count({ where: { teamOwnerId: ownerId, isActive: true } });
    if (teamCount >= 10) {
      return res.status(400).json({ success: false, message: 'Limite de 10 membres par équipe atteinte.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Get owner's business name
    const owner = await User.findByPk(ownerId);

    const member = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName: lastName || '',
      phone: phone || null,
      businessName: owner?.businessName || '',
      role: 'user',
      teamOwnerId: ownerId,
      teamRole: teamRole || 'cashier',
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: `Membre ${firstName} ajouté avec succès.`,
      data: {
        id: member.id,
        email: member.email,
        firstName: member.firstName,
        lastName: member.lastName,
        teamRole: member.teamRole
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// PUT /api/team/:id — update a team member
router.put('/:id', async (req, res) => {
  try {
    if (req.user.teamRole === 'cashier') {
      return res.status(403).json({ success: false, message: 'Permission insuffisante.' });
    }

    const ownerId = req.user.teamOwnerId || req.user.id;
    const member = await User.findOne({ where: { id: req.params.id, teamOwnerId: ownerId } });

    if (!member) {
      return res.status(404).json({ success: false, message: 'Membre non trouvé.' });
    }

    const { firstName, lastName, phone, teamRole } = req.body;
    const updates = {};
    if (firstName) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (phone !== undefined) updates.phone = phone;
    if (teamRole && ['manager', 'cashier'].includes(teamRole)) {
      if (teamRole === 'manager' && req.user.teamRole !== 'owner') {
        return res.status(403).json({ success: false, message: 'Seul le propriétaire peut promouvoir en manager.' });
      }
      updates.teamRole = teamRole;
    }

    await member.update(updates);
    res.json({ success: true, message: 'Membre mis à jour.', data: member });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// PUT /api/team/:id/reset-password — reset a member's password
router.put('/:id/reset-password', async (req, res) => {
  try {
    if (req.user.teamRole === 'cashier') {
      return res.status(403).json({ success: false, message: 'Permission insuffisante.' });
    }

    const ownerId = req.user.teamOwnerId || req.user.id;
    const member = await User.findOne({ where: { id: req.params.id, teamOwnerId: ownerId } });

    if (!member) {
      return res.status(404).json({ success: false, message: 'Membre non trouvé.' });
    }

    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await member.update({ password: hashed });
    res.json({ success: true, message: 'Mot de passe réinitialisé.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// DELETE /api/team/:id — deactivate a team member
router.delete('/:id', async (req, res) => {
  try {
    if (req.user.teamRole === 'cashier') {
      return res.status(403).json({ success: false, message: 'Permission insuffisante.' });
    }

    const ownerId = req.user.teamOwnerId || req.user.id;

    // Cannot delete yourself
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Vous ne pouvez pas vous supprimer vous-même.' });
    }

    const member = await User.findOne({ where: { id: req.params.id, teamOwnerId: ownerId } });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Membre non trouvé.' });
    }

    // Manager cannot delete another manager
    if (req.user.teamRole === 'manager' && member.teamRole === 'manager') {
      return res.status(403).json({ success: false, message: 'Un manager ne peut pas supprimer un autre manager.' });
    }

    await member.update({ isActive: false });
    res.json({ success: true, message: `${member.firstName} a été retiré de l'équipe.` });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
