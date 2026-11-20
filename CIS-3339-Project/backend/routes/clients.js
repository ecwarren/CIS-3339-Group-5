// This file stores all the API endpoints for the "clients" collection in the MongoDB database
//
// Security pattern used on every route (S1):
//   reads   -> requireAuth
//   changes -> requireAuth + requireRole('editor')
//   queries -> withOrg(..., req, 'orgs')   (clients store their organizations in the `orgs` array)
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const { requireAuth, requireRole } = require('../auth/authMiddleWare');
const withOrg = require('../utils/withOrg');
const { asyncHandler, httpError, escapeRegex, stripProtectedFields } = require('../utils/http');
const { clients, events } = require('../models/models');

const ORG_FIELD = 'orgs';
const editorOnly = [requireAuth, requireRole('editor')];

// GET all clients for the user's organization
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = await clients.find(withOrg({}, req, ORG_FIELD)).sort({ lastName: 1, firstName: 1 });
    res.json(data);
  })
);

// GET clients by zip code for the dashboard
router.get(
  '/byzip',
  requireAuth,
  asyncHandler(async (req, res) => {
    // aggregate() does not convert strings to ObjectIds, so convert the org id here
    const orgMatch = withOrg({}, req, ORG_FIELD);
    orgMatch[ORG_FIELD] = new mongoose.Types.ObjectId(orgMatch[ORG_FIELD]);

    const data = await clients.aggregate([
      { $match: { ...orgMatch, 'address.zip': { $exists: true, $nin: ['', null] } } },
      { $group: { _id: '$address.zip', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    res.json(data);
  })
);

// GET single client by ID
router.get(
  '/id/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = await clients.findOne(withOrg({ _id: req.params.id }, req, ORG_FIELD));
    if (!data) throw httpError(404, 'Client not found');
    res.json(data);
  })
);

// GET clients based on a search query
// Ex: '...?firstName=Bob&lastName=&searchBy=name'  or  '...?phoneNumber=713&searchBy=number'
router.get(
  '/search',
  requireAuth,
  asyncHandler(async (req, res) => {
    const filter = {};
    switch (req.query.searchBy) {
      case 'name':
        if (req.query.firstName) {
          filter.firstName = { $regex: escapeRegex(req.query.firstName), $options: 'i' };
        }
        if (req.query.lastName) {
          filter.lastName = { $regex: escapeRegex(req.query.lastName), $options: 'i' };
        }
        break;
      case 'number':
        if (req.query.phoneNumber) {
          filter['phoneNumber.primary'] = { $regex: escapeRegex(req.query.phoneNumber), $options: 'i' };
        }
        break;
      default:
        throw httpError(400, 'searchBy must be "name" or "number"');
    }
    const data = await clients.find(withOrg(filter, req, ORG_FIELD));
    res.json(data);
  })
);

// POST create new client
router.post(
  '/',
  ...editorOnly,
  asyncHandler(async (req, res) => {
    const newClient = stripProtectedFields(req.body);
    // ownership comes from the token, never from the request body
    newClient[ORG_FIELD] = [req.user.orgId];
    const created = await clients.create(newClient);
    res.status(201).json({ message: 'New client created successfully', client: created });
  })
);

// PUT update client
router.put(
  '/update/:id',
  ...editorOnly,
  asyncHandler(async (req, res) => {
    const updated = await clients.findOneAndUpdate(
      withOrg({ _id: req.params.id }, req, ORG_FIELD),
      stripProtectedFields(req.body),
      { new: true, runValidators: true }
    );
    if (!updated) throw httpError(404, 'Client not found');
    res.json({ message: 'Client updated successfully', client: updated });
  })
);

// DELETE client by ID - only allowed if the client is not registered for any events
router.delete(
  '/:id',
  ...editorOnly,
  asyncHandler(async (req, res) => {
    const client = await clients.findOne(withOrg({ _id: req.params.id }, req, ORG_FIELD));
    if (!client) throw httpError(404, 'Client not found');

    const registered = await events.countDocuments(withOrg({ attendees: client._id }, req));
    if (registered > 0) {
      throw httpError(409, "Client is signed up for events and can't be deleted.");
    }

    await clients.deleteOne(withOrg({ _id: client._id }, req, ORG_FIELD));
    res.json({ message: 'Client deleted successfully' });
  })
);

module.exports = router;
