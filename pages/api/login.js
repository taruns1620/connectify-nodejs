import { connectToDB } from '../../lib/mongodb';
import User from '../../models/User';
import Otp from '../../models/Otp';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  await connectToDB();

  const { mobileNumber, otp } = req.body;

  if (!mobileNumber || !otp) {
    return res.status(400).json({ success: false, message: 'Mobile number and OTP are required' });
  }

  // Basic format validation (can be enhanced)
  if (!/^[6-9]\d{9}$/.test(mobileNumber) || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ success: false, message: 'Invalid mobile number or OTP format.' });
  }

  try {
    // Find the most recent OTP for the mobile number
    const otpRecord = await Otp.findOne({ mobileNumber }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(404).json({ success: false, message: 'No OTP found for this number. Please request one again.' });
    }

    // Verify OTP and check expiry
    if (otpRecord.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id }); // Delete expired OTP
      return res.status(400).json({ success: false, message: 'OTP has expired.' });
    }

    // OTP is valid and not expired, delete it
    await Otp.deleteOne({ _id: otpRecord._id });

    // Find the user by mobile number
    const user = await User.findOne({ mobileNumber });

    if (!user) {
      // This case should ideally not happen if signup requires prior OTP verification,
      // but handling it defensively. If this is purely for *login*, this means
      // the user is not registered.
      return res.status(404).json({ success: false, message: 'This mobile number is not registered. Please sign up.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { _id: user._id, role: user.role }, // Use MongoDB _id and role in payload
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Set token expiry
    );

    // Return JWT
    return res.status(200).json({ success: true, token });

  } catch (error) {
    console.error('Login API error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
}