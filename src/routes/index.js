const router = require('express').Router();

router.use('/auth', require('./auth'));
router.use('/transactions', require('./transactions'));
router.use('/payouts', require('./payouts'));

module.exports = router;
