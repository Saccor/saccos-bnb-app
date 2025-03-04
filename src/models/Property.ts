import mongoose, { Schema } from 'mongoose';

const PropertySchema = new Schema({
  namn: { type: String, required: true },
  beskrivning: { type: String, required: true },
  plats: { type: String, required: true },
  prisPerNatt: { type: Number, required: true },
  tillganglighet: { type: Boolean, default: true },
  skapadAv: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  skapadDatum: { type: Date, default: Date.now }
});

export default mongoose.models.Property || mongoose.model('Property', PropertySchema); 