// This file contains API endpoints for interacting with "org" collection in MongoDB database
const express = require('express');
const router = express.Router();

const { orgs } = require('../models/models');
const { asyncHandler, httpError } = require('../utils/http');

// Public: returns the display name of the organization this backend instance is configured for (ORG_ID).
// The frontend shows it in the header before anyone logs in, so it does not require a token
// and it only ever returns the name.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const org = await orgs.findById(process.env.ORG_ID).lean();
    if (!org) throw httpError(404, 'Organization not found');
    res.json(org.name);
  })
);

module.exports = router;
