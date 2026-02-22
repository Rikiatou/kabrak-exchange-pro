const jwt = require('jsonwebtoken');
const { User } = require('../models');

const ACCESS_EXPIRES = '1h';
const REFRESH_EXPIRES = '30d';

const generateAccessToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role, type: 'access' }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_EXPIRES,
  });
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id, type: 'refresh' }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh', {
    expiresIn: REFRESH_EXPIRES,
  });
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
    await user.update({ lastLogin: new Date() });
    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    return res.json({ success: true, message: 'Login successful.', data: { token, refreshToken, expiresIn: ACCESS_EXPIRES, user } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken: rt } = req.body;
    if (!rt) return res.status(400).json({ success: false, message: 'refreshToken requis.' });
    let decoded;
    try {
      decoded = jwt.verify(rt, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh');
    } catch (e) {
      return res.status(401).json({ success: false, message: 'Refresh token invalide ou expiré.' });
    }
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ success: false, message: 'Token invalide.' });
    }
    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Utilisateur introuvable ou inactif.' });
    }
    const newToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    return res.json({ success: true, data: { token: newToken, refreshToken: newRefreshToken, expiresIn: ACCESS_EXPIRES } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    return res.json({ success: true, data: req.user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }
    await user.update({ password: newPassword });
    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { login, getMe, changePassword, refreshToken };
