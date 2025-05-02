import mongoose, { Schema } from 'mongoose';
import { UserRole } from './User';

export enum PropertyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING_REVIEW = 'pending_review',
  REJECTED = 'rejected'
}

const PropertySchema = new Schema({
  namn: { 
    type: String, 
    required: [true, 'Namn krävs'],
    trim: true
  },
  beskrivning: { 
    type: String, 
    required: [true, 'Beskrivning krävs'],
    trim: true
  },
  plats: { 
    type: String, 
    required: [true, 'Plats krävs'],
    trim: true
  },
  prisPerNatt: { 
    type: Number, 
    required: [true, 'Pris per natt krävs'],
    min: [0, 'Pris per natt måste vara ett positivt nummer']
  },
  bilder: {
    type: [String],
    default: []
  },
  tillganglighet: { 
    type: Boolean, 
    default: true 
  },
  status: {
    type: String,
    enum: {
      values: Object.values(PropertyStatus),
      message: '{VALUE} is not a valid status'
    },
    default: PropertyStatus.PENDING_REVIEW
  },
  agare: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Ägare krävs']
  },
  skapadDatum: { 
    type: Date, 
    default: Date.now 
  },
  uppdateradDatum: { 
    type: Date, 
    default: Date.now 
  },
  godkandDatum: {
    type: Date
  },
  godkandAv: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  avvisningsAnledning: {
    type: String,
    trim: true
  }
});

// Update the updatedDatum field before saving
PropertySchema.pre('save', function(next) {
  this.uppdateradDatum = new Date();
  next();
});

// Method to check if a user can edit this property
PropertySchema.methods.canEdit = function(userId: string, userRole: UserRole): boolean {
  // Admin can edit any property
  if (userRole === UserRole.ADMIN) return true;
  
  // Listing agents can edit properties they own
  if (userRole === UserRole.LISTING_AGENT && this.agare.toString() === userId) return true;
  
  // Regular users can only edit their own properties
  return this.agare.toString() === userId;
};

// Method to check if a property can be booked
PropertySchema.methods.canBeBooked = function(): boolean {
  return this.tillganglighet && this.status === PropertyStatus.ACTIVE;
};

// Static method to find available properties
PropertySchema.statics.findAvailable = function() {
  return this.find({ 
    tillganglighet: true,
    status: PropertyStatus.ACTIVE
  });
};

export default mongoose.models.Property || mongoose.model('Property', PropertySchema); 