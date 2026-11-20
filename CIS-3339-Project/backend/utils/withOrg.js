// S1: the ONE place that scopes database queries to the logged-in user's organization.
//
// The organization always comes from the verified JWT (req.user.orgId),
// never from the request body, query string or URL.
//
// Usage:
//   events.find(withOrg({ name: 'Food Drive' }, req))          -> { name: 'Food Drive', org: <orgId> }
//   clients.findOne(withOrg({ _id: id }, req, 'orgs'))         -> { _id: id, orgs: <orgId> }
//
// The third argument is the name of the organization field on the model:
//   events and services use `org`, clients use `orgs` (an array of org ids).
function withOrg(filter, req, field = 'org') {
  if (!req.user || !req.user.orgId) {
    // requireAuth should always run first; this is a safety net
    const err = new Error('Authentication required');
    err.status = 401;
    throw err;
  }
  return { ...filter, [field]: req.user.orgId };
}

module.exports = withOrg;
