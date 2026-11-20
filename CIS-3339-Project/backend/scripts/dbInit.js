// D1: database initialization and seed data.
//
//   npm run db:init     create anything that is missing (safe to run again, never deletes data)
//   npm run db:reset    DELETE this organization's clients, events and services, then seed again
//
// Reads its settings from backend/.env. Passwords are hashed with bcrypt before they are stored.

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const models = require('../models/models');
const seed = require('./seedData');

const { orgs, users, clients, services, events } = models;
const RESET = process.argv.includes('--reset');
const SALT_ROUNDS = 10;

// counts for the summary at the end
const summary = {};
function count(label, wasCreated) {
  summary[label] = summary[label] || { created: 0, existing: 0 };
  summary[label][wasCreated ? 'created' : 'existing'] += 1;
}

function fail(message) {
  console.error(`\n✖ db:init failed: ${message}\n`);
  process.exit(1);
}

// ---------- 1. check configuration before touching the database ----------
function checkConfig() {
  const required = [
    'MONGO_URL',
    'ORG_ID',
    'JWT_SECRET',
    'SEED_VIEWER_USERNAME',
    'SEED_VIEWER_PASSWORD',
    'SEED_EDITOR_USERNAME',
    'SEED_EDITOR_PASSWORD'
  ];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) fail(`missing environment variable(s) in backend/.env: ${missing.join(', ')}`);

  if (!/^[a-f0-9]{24}$/i.test(process.env.ORG_ID)) {
    fail(`ORG_ID must be a 24-character hex MongoDB ObjectId (got "${process.env.ORG_ID}")`);
  }
  if (process.env.ORG_ID.toLowerCase() === seed.isolationTestOrg.orgId) {
    fail('ORG_ID must not be the id reserved for the isolation test organization');
  }
  if (process.env.SEED_VIEWER_USERNAME === process.env.SEED_EDITOR_USERNAME) {
    fail('SEED_VIEWER_USERNAME and SEED_EDITOR_USERNAME must be different');
  }
}

// ---------- helpers: create only if missing ----------
async function findOrCreate(Model, label, filter, doc) {
  const existing = await Model.findOne(filter);
  if (existing) {
    count(label, false);
    return existing;
  }
  const created = await Model.create(doc);
  count(label, true);
  return created;
}

async function upsertUser(orgId, username, password, role) {
  const existing = await users.findOne({ username, org: orgId });
  if (!existing) {
    await users.create({ username, role, org: orgId, password: await bcrypt.hash(password, SALT_ROUNDS) });
    count('users', true);
    return;
  }
  // keep the account in sync with .env (role and password) without creating a duplicate
  const passwordMatches = await bcrypt.compare(password, existing.password).catch(() => false);
  if (!passwordMatches || existing.role !== role) {
    existing.role = role;
    if (!passwordMatches) existing.password = await bcrypt.hash(password, SALT_ROUNDS);
    await existing.save();
  }
  count('users', false);
}

function daysFromToday(days) {
  const d = new Date();
  d.setUTCHours(15, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

// ---------- 2. main ----------
async function main() {
  checkConfig();
  const orgId = process.env.ORG_ID;
  const test = seed.isolationTestOrg;

  console.log('Connecting to MongoDB...');
  await mongoose
    .connect(process.env.MONGO_URL, { serverSelectionTimeoutMS: 10000 })
    .catch((err) => fail(`could not connect to MONGO_URL (${err.message})`));
  console.log(`Connected to database "${mongoose.connection.name}"`);

  // indexes first, so the unique username index protects against duplicates below
  try {
    await Promise.all([users, clients, events, services].map((Model) => Model.createIndexes()));
  } catch (err) {
    fail(`could not create indexes (${err.message}). If this is a duplicate key error, remove the duplicate users first.`);
  }

  if (RESET) {
    console.log('\n--reset: deleting clients, events and services for this organization and the test organization...');
    const orgIds = [orgId, test.orgId];
    const [c, e, s] = await Promise.all([
      clients.deleteMany({ orgs: { $in: orgIds } }),
      events.deleteMany({ org: { $in: orgIds } }),
      services.deleteMany({ org: { $in: orgIds } })
    ]);
    console.log(`  deleted ${c.deletedCount} clients, ${e.deletedCount} events, ${s.deletedCount} services`);
  }

  // organization
  await findOrCreate(orgs, 'organizations', { _id: orgId }, {
    _id: orgId,
    name: process.env.ORG_NAME || 'Community Health Center'
  });

  // demo accounts
  await upsertUser(orgId, process.env.SEED_VIEWER_USERNAME, process.env.SEED_VIEWER_PASSWORD, 'viewer');
  await upsertUser(orgId, process.env.SEED_EDITOR_USERNAME, process.env.SEED_EDITOR_PASSWORD, 'editor');

  // services
  const serviceDocs = [];
  for (const s of seed.services) {
    serviceDocs.push(
      await findOrCreate(services, 'services', { org: orgId, name: s.name }, {
        ...s,
        status: s.status || 'Active',
        org: orgId
      })
    );
  }

  // clients
  const clientDocs = [];
  for (const c of seed.clients) {
    clientDocs.push(
      await findOrCreate(
        clients,
        'clients',
        { orgs: orgId, firstName: c.firstName, lastName: c.lastName },
        { ...c, orgs: [orgId] }
      )
    );
  }

  // events (+ sample registrations)
  for (const e of seed.events) {
    await findOrCreate(events, 'events', { org: orgId, name: e.name }, {
      name: e.name,
      description: e.description,
      address: e.address,
      date: daysFromToday(e.daysFromToday),
      org: orgId,
      services: e.services.map((i) => serviceDocs[i]._id),
      attendees: e.attendees.map((i) => clientDocs[i]._id)
    });
  }

  // make sure at least one registration exists even if the events were edited later
  const firstEvent = seed.events[0];
  await events.updateOne(
    { org: orgId, name: firstEvent.name },
    { $addToSet: { attendees: clientDocs[firstEvent.attendees[0]]._id } }
  );

  // isolation test organization (fixed ids so they can be used in Postman)
  await findOrCreate(orgs, 'organizations', { _id: test.orgId }, { _id: test.orgId, name: test.name });
  await findOrCreate(services, 'services', { _id: test.serviceId }, {
    _id: test.serviceId,
    name: 'Other Org Service',
    status: 'Active',
    org: test.orgId
  });
  await findOrCreate(clients, 'clients', { _id: test.clientId }, {
    _id: test.clientId,
    firstName: 'Other',
    lastName: 'OrgClient',
    phoneNumber: { primary: '0000000000' },
    address: { city: 'Elsewhere', zip: '00000' },
    orgs: [test.orgId]
  });
  await findOrCreate(events, 'events', { _id: test.eventId }, {
    _id: test.eventId,
    name: 'Other Org Event',
    date: daysFromToday(-3),
    org: test.orgId,
    services: [test.serviceId],
    attendees: [test.clientId]
  });

  // ---------- 3. summary ----------
  console.log('\n✔ Database initialized\n');
  console.table(summary);
  console.log(`Organization: ${orgId}`);
  console.log('Demo accounts:');
  console.log(`  viewer  ${process.env.SEED_VIEWER_USERNAME}`);
  console.log(`  editor  ${process.env.SEED_EDITOR_USERNAME}`);
  console.log('\nIsolation test records (belong to a DIFFERENT organization, should return 404 for your users):');
  console.log(`  client  ${test.clientId}`);
  console.log(`  event   ${test.eventId}`);
  console.log(`  service ${test.serviceId}\n`);

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  fail(err.message);
});
