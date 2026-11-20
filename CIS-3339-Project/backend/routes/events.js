// This file contains API endpoints for the "events" collection in the MongoDB database
//
// Security pattern used on every route (S1):
//   reads   -> requireAuth
//   changes -> requireAuth + requireRole('editor')   (create, update, delete, register, deregister)
//   queries -> withOrg(...)   (events store their organization in `org`, clients in `orgs`)
const express = require('express');
const router = express.Router();

const { requireAuth, requireRole } = require('../auth/authMiddleWare');
const withOrg = require('../utils/withOrg');
const { asyncHandler, httpError, escapeRegex, stripProtectedFields } = require('../utils/http');
const { events, clients, services } = require('../models/models');

const editorOnly = [requireAuth, requireRole('editor')];

// 404 unless the client exists AND belongs to the user's organization
async function findOrgClient(clientId, req) {
  const client = await clients.findOne(withOrg({ _id: clientId }, req, 'orgs')).select('_id');
  if (!client) throw httpError(404, 'Client not found');
  return client;
}

// Every service attached to an event must belong to the same organization
async function checkServicesBelongToOrg(serviceIds, req) {
  if (serviceIds === undefined) return;
  if (!Array.isArray(serviceIds)) throw httpError(400, 'services must be a list of service ids');
  const unique = [...new Set(serviceIds.map(String))];
  if (unique.length === 0) return;
  const found = await services.countDocuments(withOrg({ _id: { $in: unique } }, req));
  if (found !== unique.length) throw httpError(400, 'One or more services were not found');
}

// The event id and client id for register/deregister come from the query string
function readRegistrationParams(req) {
  const { event, client } = req.query;
  if (typeof event !== 'string' || typeof client !== 'string' || !event || !client) {
    throw httpError(400, 'event and client query parameters are required');
  }
  return { eventId: event, clientId: client };
}

// ---------- reads ----------

// GET all events for the user's organization (newest first)
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = await events.find(withOrg({}, req)).sort({ date: -1 });
    res.json(data);
  })
);

// GET event attendance for the past two months (dashboard)
router.get(
  '/attendance',
  requireAuth,
  asyncHandler(async (req, res) => {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const data = await events
      .find(withOrg({ date: { $gte: twoMonthsAgo, $lte: new Date() } }, req))
      .sort({ date: 1 });
    res.json(data);
  })
);

// GET single event by ID
router.get(
  '/id/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = await events.findOne(withOrg({ _id: req.params.id }, req));
    if (!data) throw httpError(404, 'Event not found');
    res.json(data);
  })
);

// GET events based on a search query
// Ex: '...?name=Food&searchBy=name'  or  '...?eventDate=2026-11-19&searchBy=date'
router.get(
  '/search',
  requireAuth,
  asyncHandler(async (req, res) => {
    const filter = {};
    switch (req.query.searchBy) {
      case 'name':
        filter.name = { $regex: escapeRegex(req.query.name), $options: 'i' };
        break;
      case 'date': {
        // match the whole day, not just midnight
        const start = new Date(`${req.query.eventDate}T00:00:00.000Z`);
        if (isNaN(start)) throw httpError(400, 'eventDate must be a date like 2026-11-19');
        const end = new Date(start);
        end.setUTCDate(end.getUTCDate() + 1);
        filter.date = { $gte: start, $lt: end };
        break;
      }
      default:
        throw httpError(400, 'searchBy must be "name" or "date"');
    }
    const data = await events.find(withOrg(filter, req)).sort({ date: -1 });
    res.json(data);
  })
);

// GET events a client is registered for
router.get(
  '/client/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const client = await findOrgClient(req.params.id, req);
    const data = await events.find(withOrg({ attendees: client._id }, req)).sort({ date: -1 });
    res.json(data);
  })
);

// GET events a client is NOT registered for
router.get(
  '/client/:id/not-registered',
  requireAuth,
  asyncHandler(async (req, res) => {
    const client = await findOrgClient(req.params.id, req);
    const data = await events.find(withOrg({ attendees: { $ne: client._id } }, req)).sort({ date: -1 });
    res.json(data);
  })
);

// GET attendee (client) details for an event
router.get(
  '/attendees/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const event = await events.findOne(withOrg({ _id: req.params.id }, req));
    if (!event) throw httpError(404, 'Event not found');
    const data = await clients.find(withOrg({ _id: { $in: event.attendees } }, req, 'orgs'));
    res.json(data);
  })
);

// GET all events that offer a given service
router.get(
  '/service/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = await events
      .find(withOrg({ services: req.params.id }, req))
      .select({ _id: 1, name: 1, date: 1, 'address.line1': 1 })
      .sort({ date: -1 })
      .lean();
    res.json(data);
  })
);

// ---------- changes (editor only) ----------

// POST new event
router.post(
  '/',
  ...editorOnly,
  asyncHandler(async (req, res) => {
    // attendees can only be added through /register
    const newEvent = stripProtectedFields(req.body, ['attendees']);
    await checkServicesBelongToOrg(newEvent.services, req);
    newEvent.org = req.user.orgId; // ownership comes from the token
    newEvent.attendees = [];
    const created = await events.create(newEvent);
    res.status(201).json({ message: 'New event created successfully', event: created });
  })
);

// PUT update event
router.put(
  '/update/:id',
  ...editorOnly,
  asyncHandler(async (req, res) => {
    const changes = stripProtectedFields(req.body, ['attendees']);
    await checkServicesBelongToOrg(changes.services, req);
    const updated = await events.findOneAndUpdate(withOrg({ _id: req.params.id }, req), changes, {
      new: true,
      runValidators: true
    });
    if (!updated) throw httpError(404, 'Event not found');
    res.json({ message: 'Event updated successfully', event: updated });
  })
);

// PUT register a client for an event (B1)
//   - event and client must both exist in the user's organization, otherwise 404
//   - registering twice never creates a duplicate: 200 { message: 'Already registered' }
router.put(
  '/register',
  ...editorOnly,
  asyncHandler(async (req, res) => {
    const { eventId, clientId } = readRegistrationParams(req);

    const event = await events.findOne(withOrg({ _id: eventId }, req)).select('_id');
    if (!event) throw httpError(404, 'Event not found');
    const client = await findOrgClient(clientId, req);

    // single atomic update: only matches if the client is not registered yet
    const updated = await events.findOneAndUpdate(
      withOrg({ _id: event._id, attendees: { $ne: client._id } }, req),
      { $addToSet: { attendees: client._id } },
      { new: true }
    );

    if (!updated) return res.status(200).json({ message: 'Already registered' });
    return res.status(200).json(updated);
  })
);

// PUT remove a client from an event (B1)
//   - event and client must both exist in the user's organization, otherwise 404
//   - removing someone who is not registered is not an error: 200 { message: 'Not registered' }
router.put(
  '/deregister',
  ...editorOnly,
  asyncHandler(async (req, res) => {
    const { eventId, clientId } = readRegistrationParams(req);

    const event = await events.findOne(withOrg({ _id: eventId }, req)).select('_id');
    if (!event) throw httpError(404, 'Event not found');
    const client = await findOrgClient(clientId, req);

    // only matches if the client IS registered
    const updated = await events.findOneAndUpdate(
      withOrg({ _id: event._id, attendees: client._id }, req),
      { $pull: { attendees: client._id } },
      { new: true }
    );

    if (!updated) return res.status(200).json({ message: 'Not registered' });
    return res.status(200).json(updated);
  })
);

// DELETE event by ID - only allowed if nobody is registered
router.delete(
  '/:id',
  ...editorOnly,
  asyncHandler(async (req, res) => {
    const event = await events.findOne(withOrg({ _id: req.params.id }, req));
    if (!event) throw httpError(404, 'Event not found');
    if (event.attendees.length > 0) {
      throw httpError(409, "Event has attendees and can't be deleted.");
    }
    await events.deleteOne(withOrg({ _id: event._id }, req));
    res.json({ message: 'Event deleted successfully' });
  })
);

module.exports = router;

