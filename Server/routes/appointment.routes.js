const router = require('express').Router();
const controller = require('../controllers/appointment.controller');
router.get('/', controller.list);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.post('/:id/session-note', controller.addSessionNote);
router.delete('/:id', controller.remove);
module.exports = router;
