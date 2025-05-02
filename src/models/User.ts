import mongoose, { Schema } from 'mongoose';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  LISTING_AGENT = 'LISTING_AGENT'
}

const UserSchema = new Schema({
  namn: { 
    type: String, 
    required: [true, 'Namn krävs'],
    trim: true
  },
  epost: { 
    type: String, 
    required: [true, 'E-post krävs'],
    unique: true,
    trim: true,
    lowercase: true
  },
  losenord: { 
    type: String, 
    required: [true, 'Lösenord krävs']
  },
  roll: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.USER,
    required: true
  },
  aktiv: {
    type: Boolean,
    default: true
  },
  skapadDatum: { 
    type: Date, 
    default: Date.now 
  },
  uppdateradDatum: { 
    type: Date, 
    default: Date.now 
  },
  senastInloggning: {
    type: Date
  }
});

// Update the updatedDatum field before saving
UserSchema.pre('save', function(next) {
  this.uppdateradDatum = new Date();
  next();
});

// Prevent password from being sent to client
UserSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.losenord;
    return ret;
  }
});

// Add method to check if user has a specific role
UserSchema.methods.hasRole = function(role: UserRole): boolean {
  return this.roll === role;
};

// Add method to check if user has any of the given roles
UserSchema.methods.hasAnyRole = function(roles: UserRole[]): boolean {
  return roles.includes(this.roll);
};

// Add a method to check if user is an admin
UserSchema.methods.isAdmin = function(): boolean {
  return this.roll === UserRole.ADMIN;
};

// Add a method to check if user is a listing agent
UserSchema.methods.isListingAgent = function(): boolean {
  return this.roll === UserRole.LISTING_AGENT;
};

// Safely access models property
let User;
try {
  // Check if models object exists
  if (mongoose.models) {
    User = mongoose.models.User || mongoose.model('User', UserSchema);
  } else {
    User = mongoose.model('User', UserSchema);
  }
} catch (error) {
  User = mongoose.model('User', UserSchema);
}

export default User; 