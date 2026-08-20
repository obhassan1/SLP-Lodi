const router =
  require('express')
    .Router();

const controller =
  require(
    '../controllers/statistics.controller'
  );

const {
  requireAdmin
} =
  require(
    '../middleware/auth.middleware'
  );

router.get(
  '/dashboard',
  requireAdmin,
  controller.dashboard
);

module.exports =
  router;