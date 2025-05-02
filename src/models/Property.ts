import mongoose, { Schema, Document, Model } from 'mongoose';
import { UserRole } from './User';

export enum PropertyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING_REVIEW = 'pending_review',
  REJECTED = 'rejected'
}

// Define interface for Property document
export interface IProperty extends Document {
  namn: string;
  beskrivning: string;
  plats: string;
  prisPerNatt: number;
  bilder: string[];
  tillganglighet: boolean;
  status: PropertyStatus;
  agare: mongoose.Types.ObjectId;
  skapadDatum: Date;
  uppdateradDatum: Date;
  godkandDatum?: Date;
  godkandAv?: mongoose.Types.ObjectId;
  avvisningsAnledning?: string;
  
  // Methods
  canEdit(userId: string, userRole: UserRole | string): boolean;
  canBeBooked(): boolean;
}

// Define interface for Property model with static methods
export interface IPropertyModel extends Model<IProperty> {
  findAvailable(): Promise<IProperty[]>;
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
PropertySchema.methods.canEdit = function(userId: string, userRole: UserRole | string): boolean {
  console.log('Property.canEdit called with:', { userId, userRole, ownerId: this.agare.toString() });
  
  // Normalize the role to uppercase for comparison
  const normalizedRole = typeof userRole === 'string' ? userRole.toUpperCase() : userRole;
  
  // Admin can edit any property (handle both enum and string 'admin')
  if (normalizedRole === UserRole.ADMIN || normalizedRole === 'ADMIN') {
    console.log('User is ADMIN, granting edit permission');
    return true;
  }
  
  // Listing agents can edit properties they own
  if (
    (normalizedRole === UserRole.LISTING_AGENT || normalizedRole === 'LISTING_AGENT') && 
    this.agare.toString() === userId
  ) {
    console.log('User is LISTING_AGENT and owner, granting edit permission');
    return true;
  }
  
  // Regular users can only edit their own properties
  const isOwner = this.agare.toString() === userId;
  console.log('Checking if user is owner:', { isOwner });
  return isOwner;
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

// Safely access models property
let Property: IPropertyModel;
try {
  // Check if models object exists
  if (mongoose.models) {
    Property = (mongoose.models.Property || mongoose.model<IProperty, IPropertyModel>('Property', PropertySchema)) as IPropertyModel;
  } else {
    Property = mongoose.model<IProperty, IPropertyModel>('Property', PropertySchema);
  }
} catch (error) {
  Property = mongoose.model<IProperty, IPropertyModel>('Property', PropertySchema);
}

export default Property; 