const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @param {ProxyController} controller
 * @returns {express.Router}
 */
function proxyRoutes(controller) {
  const router = express.Router();
  router.get('/free-proxy', asyncHandler((req, res) => controller.getFreeProxy(req, res)));
  return router;
}

module.exports = proxyRoutes;
