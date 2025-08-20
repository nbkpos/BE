const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/payoutController');

router.get('/status/:id', auth, ctrl.status);

module.exports = router;
