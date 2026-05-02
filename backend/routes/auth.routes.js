// ═══════════════════════════════════════════
// routes/auth.routes.js
// ═══════════════════════════════════════════
const express = require('express');
const router = express.Router();
const { login, logout, getProfile } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.post('/login', login);
router.post('/logout', authenticate, logout);
router.get('/profile', authenticate, getProfile);

module.exports = router;
