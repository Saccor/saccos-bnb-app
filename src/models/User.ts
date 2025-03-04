import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
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
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Ogiltig e-postadress']
  },
  losenord: {
    type: String,
    required: [true, 'Lösenord krävs'],
    minlength: [6, 'Lösenordet måste vara minst 6 tecken']
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  skapadDatum: {
    type: Date,
    default: Date.now
  }
});

// Prevent password from being sent to client
userSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.losenord;
    return ret;
  }
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User; 