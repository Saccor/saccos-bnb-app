import mongoose, { Document, Model } from 'mongoose';

// Define the interface for Image document
export interface IImage extends Document {
  filename: string;
  contentType: string;
  data: Buffer;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
}

// Define the model interface
export interface IImageModel extends Model<IImage> {
  // Add any static methods here if needed
}

// Create schema for images
const ImageSchema = new mongoose.Schema({
  filename: String,
  contentType: String,
  data: Buffer,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

// Safely get or create the model
let Image: IImageModel;
try {
  // Check if models object exists
  if (mongoose.models) {
    Image = (mongoose.models.Image || mongoose.model<IImage, IImageModel>('Image', ImageSchema)) as IImageModel;
  } else {
    Image = mongoose.model<IImage, IImageModel>('Image', ImageSchema);
  }
} catch (error) {
  Image = mongoose.model<IImage, IImageModel>('Image', ImageSchema);
}

export default Image; 