// S1: authentication and authorization middleware.
//
//   requireAuth          -> 401 unless the request has a valid JWT
//   requireRole('editor') -> 403 unless the logged-in user has that role
//
// Usage in a route file:
//   router.get('/', requireAuth, handler)                          // read
//   router.post('/', requireAuth, requireRole('editor'), handler)  // create/update/delete

const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.header('Authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // tokens issued before Sprint 3 have no orgId -> make the user log in again
    if (!decoded.orgId) {
      return res.status(401).json({ error: 'Session is no longer valid. Please log in again.' });
    }
    req.user = decoded; // { id, name, role, orgId }
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Session is invalid or has expired. Please log in again.' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'You do not have permission to do that.' });
    }
    return next();
  };
}

// requireAuth is also the default export, so older code that does
// `const authMiddleWare = require('../auth/authMiddleWare')` keeps working.
module.exports = requireAuth;
module.exports.requireAuth = requireAuth;
module.exports.requireRole = requireRole;
