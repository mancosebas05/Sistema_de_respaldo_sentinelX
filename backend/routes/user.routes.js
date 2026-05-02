const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/', authorize('users', 'read'), ctrl.getAll);
router.get('/:id', authorize('users', 'read'), ctrl.getById);
router.post('/', authorize('users', 'create'), ctrl.create);
router.put('/:id', authorize('users', 'update'), ctrl.update);
router.patch('/:id/unlock', authorize('users', 'unlock'), ctrl.unlock);
router.delete('/:id', authorize('users', 'delete'), ctrl.remove);

module.exports = router;
