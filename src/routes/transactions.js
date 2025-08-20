const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/transactionController');

router.post('/process', auth, ctrl.process);
router.get('/history', auth, ctrl.history);
router.get('/:transactionId', auth, ctrl.getOne);

module.exports = router;
