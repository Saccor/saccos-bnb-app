import mongoose, { Schema } from 'mongoose';

const BookingSchema = new Schema({
  skapadDatum: { type: Date, default: Date.now },
  incheckningDatum: { type: Date, required: true },
  utcheckningDatum: { type: Date, required: true },
  totalPris: { type: Number, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  egendom: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
});

export default mongoose.models.Booking || mongoose.model('Booking', BookingSchema); 