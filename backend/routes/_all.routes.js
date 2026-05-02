// ═══════════════════════════════════════════
// routes/policy.routes.js
// ═══════════════════════════════════════════
const express = require('express');
const policyRouter = express.Router();
const pCtrl = require('../controllers/policy.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

policyRouter.use(authenticate);
policyRouter.get('/', authorize('policies', 'read'), pCtrl.getAll);
policyRouter.get('/:id', authorize('policies', 'read'), pCtrl.getById);
policyRouter.post('/', authorize('policies', 'create'), pCtrl.create);
policyRouter.put('/:id', authorize('policies', 'update'), pCtrl.update);
policyRouter.patch('/:id/toggle', authorize('policies', 'activate'), pCtrl.toggleStatus);
policyRouter.delete('/:id', authorize('policies', 'delete'), pCtrl.remove);

// ═══════════════════════════════════════════
// routes/backup.routes.js
// ═══════════════════════════════════════════
const backupRouter = express.Router();
const bCtrl = require('../controllers/backup.controller');

backupRouter.use(authenticate);
backupRouter.get('/', authorize('backups', 'read'), bCtrl.getAll);
backupRouter.get('/:id', authorize('backups', 'read'), bCtrl.getById);
backupRouter.post('/execute', authorize('backups', 'execute'), bCtrl.executeManual);
backupRouter.post('/:id/verify', authorize('backups', 'read'), bCtrl.verifyIntegrity);
backupRouter.delete('/:id', authorize('backups', 'delete'), bCtrl.deleteBackup);

// ═══════════════════════════════════════════
// routes/asset.routes.js
// ═══════════════════════════════════════════
const assetRouter = express.Router();
const { getAssets, createAsset, updateAsset, deleteAsset } = require('../controllers/misc.controllers');

assetRouter.use(authenticate);
assetRouter.get('/', authorize('assets', 'read'), getAssets);
assetRouter.post('/', authorize('assets', 'create'), createAsset);
assetRouter.put('/:id', authorize('assets', 'update'), updateAsset);
assetRouter.delete('/:id', authorize('assets', 'delete'), deleteAsset);

// ═══════════════════════════════════════════
// routes/restore.routes.js
// ═══════════════════════════════════════════
const restoreRouter = express.Router();
const { initiateRestore, getRestoreHistory } = require('../controllers/misc.controllers');

restoreRouter.use(authenticate);
restoreRouter.get('/', authorize('restore', 'read'), getRestoreHistory);
restoreRouter.post('/', authorize('restore', 'execute'), initiateRestore);

// ═══════════════════════════════════════════
// routes/log.routes.js
// ═══════════════════════════════════════════
const logRouter = express.Router();
const { getLogs } = require('../controllers/misc.controllers');

logRouter.use(authenticate);
logRouter.get('/', authorize('logs', 'read'), getLogs);

// ═══════════════════════════════════════════
// routes/notification.routes.js
// ═══════════════════════════════════════════
const notifRouter = express.Router();
const { getNotifications, markRead } = require('../controllers/misc.controllers');

notifRouter.use(authenticate);
notifRouter.get('/', getNotifications);
notifRouter.patch('/read-all', markRead);

// ═══════════════════════════════════════════
// routes/report.routes.js
// ═══════════════════════════════════════════
const reportRouter = express.Router();
const { exportReport } = require('../controllers/misc.controllers');

reportRouter.use(authenticate);
reportRouter.get('/export', authorize('reports', 'export'), exportReport);

// ═══════════════════════════════════════════
// routes/dashboard.routes.js
// ═══════════════════════════════════════════
const dashRouter = express.Router();
const { getDashboard } = require('../controllers/misc.controllers');

dashRouter.use(authenticate);
dashRouter.get('/', authorize('dashboard', 'read'), getDashboard);

module.exports = {
  policyRouter,
  backupRouter,
  assetRouter,
  restoreRouter,
  logRouter,
  notifRouter,
  reportRouter,
  dashRouter,
};
