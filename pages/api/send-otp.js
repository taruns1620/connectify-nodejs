// pages/api/send-otp.js
import { connectToDB } from '../../lib/mongodb';
import Otp from '../../models/Otp';
import User from '../../models/User'; // Assuming you might need to check for existing users
import { sendOtpViaFast2Sms } from '../../lib/sms'; // Assuming you will migrate SMS sending logic here or to a similar file
import { sendOtpViaFast2Sms as sendSmsHelper } from '../../lib/sendSms';
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  await connectToDB();

  const { mobileNumber, isSignup } = req.body;

  // Basic validation
  if (!mobileNumber || typeof mobileNumber !== 'string' || !/^[6-9]\d{9}$/.test(mobileNumber)) {
    return res.status(400).json({ success: false, message: 'Invalid 10-digit mobile number format.' });
  }

  try {
    // Logic from sendCustomOtp Firebase function
    // Check for existing user based on isSignup flag
    const existingUser = await User.findOne({ mobileNumber });

    if (isSignup && existingUser) {
      return res.status(409).json({ success: false, message: 'This mobile number is already registered. Please login.' });
    }
    if (!isSignup && !existingUser) {
      return res.status(404).json({ success: false, message: 'This mobile number is not registered. Please sign up.' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // Save OTP to database
    // Use findOneAndUpdate with upsert: true to replace existing OTPs for the same number
    await Otp.findOneAndUpdate(
      { mobileNumber },
      { otp, expiresAt, createdAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Send OTP via SMS gateway
    await sendSmsHelper(mobileNumber, otp); // Call your migrated SMS function

    res.status(200).json({ success: true, message: 'OTP sent successfully.' });

  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP.', error: error.message });
  }
}