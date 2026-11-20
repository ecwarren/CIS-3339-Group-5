// This file contains the data models of the collections in the MongoDB database

//Import functionalities
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// collection for org
const orgDataSchema = new Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    name: {
      type: String,
      required: true
    }
  },
  {
    collection: 'org'
  }
);

// collection for app users
const userDataSchema = new Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId()
    },
    username: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      required: true,
      enum: ['viewer', 'editor']
    },
    org: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'org',
      required: true
    }
  },
  {
    collection: 'users'
  }
);

// collection for clients
const clientDataSchema = new Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId()
    },
    firstName: {
      type: String,
      required: true
    },
    middleName: {
      type: String
    },
    lastName: {
      type: String,
      required: true
    },
    email: {
      type: String
    },
    phoneNumber: {
      primary: {
        type: String,
        required: true
      },
      alternate: {
        type: String
      }
    },
    address: {
      line1: {
        type: String
      },
      line2: {
        type: String
      },
      city: {
        type: String,
        required: true
      },
      county: {
        type: String
      },
      zip: {
        type: String
      }
    },
    orgs: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'org' }],
      required: true,
      validate: [(org) => org.length > 0, 'needs at least one org']
    }
  },
  {
    collection: 'clients'
  }
);

// collection for events
const eventDataSchema = new Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId()
    },
    org: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'services'
      }
    ],
    date: {
      type: Date,
      required: true
    },
    address: {
      line1: {
        type: String
      },
      line2: {
        type: String
      },
      city: {
        type: String
      },
      county: {
        type: String
      },
      zip: {
        type: String
      }
    },
    description: {
      type: String
    },
    attendees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'clients'
      }
    ]
  },
  {
    collection: 'events'
  }
);

// collection for services
const serviceDataSchema = new Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId()
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    },
    org: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'org',
      required: true
    }
  },
  {
    collection: 'services'
  }
);

// ---------- Indexes (D1) ----------
// one username per organization (login looks users up by username + org)
userDataSchema.index({ username: 1, org: 1 }, { unique: true });
// every list/search query is scoped by organization
clientDataSchema.index({ orgs: 1, lastName: 1, firstName: 1 });
eventDataSchema.index({ org: 1, date: -1 });
eventDataSchema.index({ org: 1, attendees: 1 });
serviceDataSchema.index({ org: 1, name: 1 });

// create models from mongoose schemas
const clients = mongoose.model('clients', clientDataSchema);
const users = mongoose.model('users', userDataSchema);
const orgs = mongoose.model('org', orgDataSchema);
const events = mongoose.model('events', eventDataSchema);
const services = mongoose.model('services', serviceDataSchema);

// package the models in an object to export
module.exports = { clients, orgs, events, users, services };
