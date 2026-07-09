const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { validate, createProfileSchema, updateNotesSchema, setCookiesSchema } = require('../validation/schemas');

/**
 * @param {ProfileController} controller
 * @returns {express.Router}
 */
function profileRoutes(controller) {
  const router = express.Router();

  router.post('/', validate(createProfileSchema), asyncHandler((req, res) => controller.create(req, res)));
  router.get('/', asyncHandler((req, res) => controller.getAll(req, res)));

  router.post('/:id/launch', asyncHandler((req, res) => controller.launch(req, res)));
  router.post('/:id/close', asyncHandler((req, res) => controller.close(req, res)));
  router.delete('/:id', asyncHandler((req, res) => controller.delete(req, res)));

  router.put('/:id/notes', validate(updateNotesSchema), asyncHandler((req, res) => controller.updateNotes(req, res)));

  router.get('/:id/cookies', asyncHandler((req, res) => controller.getCookies(req, res)));
  router.post('/:id/cookies', validate(setCookiesSchema), asyncHandler((req, res) => controller.setCookies(req, res)));

  return router;
}

module.exports = profileRoutes;
