// Small helpers shared by all routes

// Create an Error that carries an HTTP status code.
// The central error handler in app.js turns it into { error: message }.
function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// Express 4 does not catch errors thrown inside async route handlers.
// Wrapping a handler with asyncHandler sends any thrown error to next(err).
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// Escape user input before putting it inside a RegExp, so characters like
// ".*(" are searched for literally instead of being treated as a pattern.
function escapeRegex(text = '') {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Fields a client must never be allowed to change through the request body
// (ownership and ids are controlled by the server).
function stripProtectedFields(body = {}, extra = []) {
  const clean = { ...body };
  ['_id', '__v', 'org', 'orgs', 'orgId', ...extra].forEach((key) => {
    delete clean[key];
  });
  // never let the body contain MongoDB operators such as { "$push": { "orgs": ... } }
  Object.keys(clean).forEach((key) => {
    if (key.startsWith('$') || key.startsWith('org.') || key.startsWith('orgs.')) delete clean[key];
  });
  return clean;
}

module.exports = { httpError, asyncHandler, escapeRegex, stripProtectedFields };
