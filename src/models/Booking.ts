import mongoose, { Schema } from 'mongoose';
import { UserRole } from './User';

export enum BookingStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

const BookingSchema = new Schema({
  skapadDatum: { 
    type: Date, 
    default: Date.now 
  },
  incheckningDatum: { 
    type: Date, 
    required: [true, 'Incheckningsdatum krävs'] 
  },
  utcheckningDatum: { 
    type: Date, 
    required: [true, 'Utcheckningsdatum krävs'] 
  },
  totalPris: { 
    type: Number, 
    required: [true, 'Totalpris krävs'],
    min: [0, 'Totalpris måste vara ett positivt nummer']
  },
  kund: {
    fornamn: { 
      type: String, 
      required: [true, 'Förnamn krävs'],
      trim: true
    },
    efternamn: { 
      type: String, 
      required: [true, 'Efternamn krävs'],
      trim: true
    },
    telefon: { 
      type: String, 
      required: [true, 'Telefon krävs'],
      trim: true
    },
    epost: { 
      type: String, 
      required: [true, 'E-post krävs'],
      trim: true,
      lowercase: true
    }
  },
  skapadAv: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Skapad av krävs']
  },
  egendom: { 
    type: Schema.Types.ObjectId, 
    ref: 'Property', 
    required: [true, 'Egendom krävs']
  },
  status: {
    type: String,
    enum: Object.values(BookingStatus),
    default: BookingStatus.PENDING
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
  },
  antalNatter: {
    type: Number,
    required: [true, 'Antal nätter krävs']
  },
  uppdateradDatum: { 
    type: Date, 
    default: Date.now 
  }
});

// Update the updatedDatum field before saving
BookingSchema.pre('save', function(next) {
  this.uppdateradDatum = new Date();
  next();
});

// Method to check if a user can manage this booking
BookingSchema.methods.canManage = function(userId: string, userRole: UserRole): boolean {
  // Admin can manage any booking
  if (userRole === UserRole.ADMIN) return true;
  
  // Users can manage their own bookings
  return this.skapadAv.toString() === userId;
};

// Method to check if a booking can be cancelled
BookingSchema.methods.canBeCancelled = function(): boolean {
  const now = new Date();
  return this.incheckningDatum > now;
};

// Static method to find bookings by status
BookingSchema.statics.findByStatus = function(status: BookingStatus) {
  return this.find({ status });
};

// Static method to find bookings by user
BookingSchema.statics.findByUser = function(userId: string) {
  return this.find({ skapadAv: userId }).populate('egendom');
};

// Static method to find bookings by property
BookingSchema.statics.findByProperty = function(propertyId: string) {
  return this.find({ egendom: propertyId }).populate('skapadAv', '-losenord');
};

const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);

export default Booking; 