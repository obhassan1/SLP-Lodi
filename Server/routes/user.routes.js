const router = require('express').Router();
const c = require('../controllers/user.controller');
const { requireAdmin } = require('../middleware/auth.middleware');

router.put('/me/password', c.changeOwnPassword);
router.get('/', requireAdmin, c.list);
router.post('/', requireAdmin, c.create);
router.put('/:id', requireAdmin, c.update);

module.exports = router;
