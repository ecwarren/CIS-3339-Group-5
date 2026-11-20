// This file contains all API endpoints for interacting with the "users" collection in the MongoDB database
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { users } = require('../models/models');
const { asyncHandler } = require('../utils/http');

// S1: one message for every failed login, so it never reveals whether the username exists
const LOGIN_FAILED = 'Invalid username or password';

// API endpoint to handle login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { username, password } = req.body || {};
    // must be plain strings (blocks query-injection payloads like { "$ne": null })
    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // this backend instance only serves the organization in ORG_ID
    const user = await users.findOne({ username, org: process.env.ORG_ID });
    const isMatch = user ? await bcrypt.compare(password, user.password) : false;

    if (!user || !isMatch) {
      return res.status(401).json({ error: LOGIN_FAILED });
    }

    // orgId in the token is what withOrg() uses to scope every query
    const payload = {
      id: user._id.toString(),
      name: user.username,
      role: user.role,
      orgId: user.org.toString()
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h'
    });
    return res.json({ token });
  })
);

module.exports = router;
