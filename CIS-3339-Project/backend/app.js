// This is the main file for the backend

const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');
require('dotenv').config();

// ---------- Configuration check ----------
const REQUIRED_ENV = ['MONGO_URL', 'ORG_ID', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Missing required environment variable(s): ${missing.join(', ')}. See backend/README.md.`);
  process.exit(1);
}

const app = express();

// ---------- CORS (S1) ----------
// Only the frontend origin(s) in CORS_ORIGIN may call the API from a browser.
// Use a comma-separated list for more than one, e.g.
//   CORS_ORIGIN=http://localhost:5173,http://localhost:4173
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // requests with no Origin header (curl, Postman, server-to-server) are not browser CORS requests
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false); // browser blocks the response
    }
  })
);

// ---------- Database ----------
mongoose.set('strictQuery', false);
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log('Database connection Success!'))
  .catch((err) => console.error('Mongo Connection Error:', err.message));

// ---------- Middleware ----------
app.use(express.json());
app.use(morgan('dev'));

// ---------- Health check (B2) - no login required ----------
app.get('/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: 'ok',
    db: connected ? 'connected' : 'disconnected'
  });
});

// ---------- Routes ----------
app.use('/clients', require('./routes/clients'));
app.use('/events', require('./routes/events'));
app.use('/org', require('./routes/org'));
app.use('/services', require('./routes/services'));
app.use('/users', require('./routes/users'));

// ---------- Unknown route ----------
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ---------- Central error handler (B2) ----------
// Every error ends up here and always leaves as { error: "Human readable message" }.
// Stack traces and raw Mongo errors are logged on the server, never sent to the client.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  let status = err.status || err.statusCode || 500;
  let message = err.message;

  if (err.name === 'ValidationError') {
    status = 400;
    const first = Object.values(err.errors || {})[0];
    message = first ? first.message : 'Invalid data';
  } else if (err.name === 'CastError') {
    status = 400;
    message = err.path === '_id' ? 'Invalid id' : `Invalid value for ${err.path}`;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body is not valid JSON';
  } else if (err.code === 11000) {
    status = 409;
    message = 'A record with these details already exists';
  }

  if (status >= 500) {
    console.error(err); // full details stay in the server log
    message = 'Internal server error';
  }

  res.status(status).json({ error: message });
});

// ---------- Start ----------
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`CORS allowed origin(s): ${allowedOrigins.join(', ')}`);
  });
}

module.exports = app;