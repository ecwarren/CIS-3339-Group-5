// This file contains API endpoints for the "services" collection of the MongoDB database
//
// Security pattern used on every route (S1):
//   reads   -> requireAuth
//   changes -> requireAuth + requireRole('editor')
//   queries -> withOrg(...)   (services store their organization in `org`)
const express = require('express');
const router = express.Router();

const { requireAuth, requireRole } = require('../auth/authMiddleWare');
const withOrg = require('../utils/withOrg');
const { asyncHandler, httpError, escapeRegex, stripProtectedFields } = require('../utils/http');
const { services, events } = require('../models/models');

const editorOnly = [requireAuth, requireRole('editor')];

//GET all services for the user's organization
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = await services.find(withOrg({}, req)).sort({ name: 1 });
    res.json(data);
  })
);

// GET single service by ID
router.get(
  '/id/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = await services.findOne(withOrg({ _id: req.params.id }, req));
    if (!data) throw httpError(404, 'Service not found');
    res.json(data);
  })
);

// GET services based on a search query
router.get(
  '/search',
  requireAuth,
  asyncHandler(async (req, res) => {
    const filter = {};
    switch (req.query.searchBy) {
      case 'name':
        filter.name = { $regex: escapeRegex(req.query.name), $options: 'i' };
        break;
      case 'description':
        filter.description = { $regex: escapeRegex(req.query.description), $options: 'i' };
        break;
      default:
        throw httpError(400, 'searchBy must be "name" or "description"');
    }
    const data = await services.find(withOrg(filter, req));
    res.json(data);
  })
);

// POST new service
router.post(
  '/',
  ...editorOnly,
  asyncHandler(async (req, res) => {
    const newService = stripProtectedFields(req.body);
    newService.org = req.user.orgId; // ownership comes from the token
    if (!newService.status) newService.status = 'Active';
    const created = await services.create(newService);
    res.status(201).json({ message: 'New service created successfully', service: created });
  })
);

// PUT update service
router.put(
  '/update/:id',
  ...editorOnly,
  asyncHandler(async (req, res) => {
    const updated = await services.findOneAndUpdate(
      withOrg({ _id: req.params.id }, req),
      stripProtectedFields(req.body),
      { new: true, runValidators: true }
    );
    if (!updated) throw httpError(404, 'Service not found');
    res.json({ message: 'Service updated successfully', service: updated });
  })
);

//DELETE service by ID - only allowed if no events use the service
router.delete(
  '/:id',
  ...editorOnly,
  asyncHandler(async (req, res) => {
    const service = await services.findOne(withOrg({ _id: req.params.id }, req));
    if (!service) throw httpError(404, 'Service not found');

    const inUse = await events.countDocuments(withOrg({ services: service._id }, req));
    if (inUse > 0) {
      throw httpError(409, 'Service can not be deleted since it is being used by events.');
    }

    await services.deleteOne(withOrg({ _id: service._id }, req));
    res.json({ message: 'Service deleted successfully' });
  })
);

module.exports = router;

