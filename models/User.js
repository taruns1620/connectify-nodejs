// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true },
    email: { type: String, lowercase: true, trim: true, default: null },
    mobileNumber: { type: String, required: true, unique: true },
    name: { type: String },
    role: { type: String, enum: ['client', 'vendor', 'admin'], default: 'client' },
    isActive: { type: Boolean, default: true },
    businessName: { type: String, default: null },
    commissionRate: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
 upiId: { type: String },
    vendorType: { type: String },
    shopName: { type: String },
    officeName: { type: String },
    fullName: { type: String },
    profession: { type: String },
    category: { type: String },
    location: { type: String },
    permanentAddress: { type: String },
    areaOfService: { type: String },
    website: { type: String },
    photoUrl: { type: String },
    idProofUrl: { type: String },
    bonusRules: [{ amount: { type: Number }, percent: { type: Number } }],
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', userSchema);