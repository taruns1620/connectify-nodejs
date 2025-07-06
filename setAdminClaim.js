
// /home/user/studio/setAdminClaim.js
const admin = require('firebase-admin');

// Attempt to load the service account key.
// Make sure 'serviceAccountKey.json' is in the same directory as this script.
let serviceAccount;
try {
  serviceAccount = require('./serviceAccountKey.json');
} catch (error) {
  console.error("********************************************************************************");
  console.error("ERROR: Failed to load './serviceAccountKey.json'.");
  console.error("Please ensure you have downloaded your Firebase service account key,");
  console.error("renamed it to 'serviceAccountKey.json', and placed it in the");
  console.error("root directory of your project (where this script is located).");
  console.error("********************************************************************************");
  process.exit(1);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  if (error.code === 'app/duplicate-app') {
    console.warn("Firebase Admin SDK already initialized. This is usually fine.");
  } else {
    console.error("Firebase Admin SDK initialization error:", error);
    process.exit(1);
  }
}

// !!! --- IMPORTANT: REPLACE THESE PLACEHOLDERS --- !!!
// Define the credentials for the new admin user you want to create.
// Ensure you use a strong, unique password and a valid email.
const NEW_ADMIN_EMAIL = 'admin@gmail.com'; // REPLACE THIS
const NEW_ADMIN_PASSWORD = 'Admin@123'; // REPLACE THIS
const NEW_ADMIN_DISPLAY_NAME = 'Platform Admin'; // Optional, but good to have
// **CRITICAL**: Phone number MUST be in E.164 format (e.g., +917089887460 for India).
const NEW_ADMIN_MOBILE_NUMBER = '+919876543210'; // REPLACE THIS with a valid E.164 phone number
// !!! --- IMPORTANT: REPLACE THE PLACEHOLDERS ABOVE --- !!!


// Check if placeholders have been changed
// if (NEW_ADMIN_EMAIL === 'admin@example.com' || NEW_ADMIN_PASSWORD === 'Admin@123' || NEW_ADMIN_MOBILE_NUMBER === '+919876543210') {
//   console.error("********************************************************************************");
//   console.error("ERROR: Please edit this script (setAdminClaim.js) and replace the");
//   console.error("placeholder values for NEW_ADMIN_EMAIL, NEW_ADMIN_PASSWORD, and NEW_ADMIN_MOBILE_NUMBER");
//   console.error("with the actual credentials for the admin user you want to create.");
//   console.error("Ensure NEW_ADMIN_MOBILE_NUMBER is in E.164 format (e.g., +91XXXXXXXXXX).");
//   console.error("********************************************************************************");
//   process.exit(1);
// }

// Validate Email Format (Basic)
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(NEW_ADMIN_EMAIL)) {
  console.error("********************************************************************************");
  console.error("ERROR: NEW_ADMIN_EMAIL does not appear to be a valid email format.");
  console.error("Please provide a valid email address (e.g., user@example.com).");
  console.error("Current value:", NEW_ADMIN_EMAIL);
  console.error("********************************************************************************");
  process.exit(1);
}

// Validate Password Length
if (NEW_ADMIN_PASSWORD.length < 6) {
  console.error("********************************************************************************");
  console.error("ERROR: NEW_ADMIN_PASSWORD must be at least 6 characters long.");
  console.error("********************************************************************************");
  process.exit(1);
}

// Validate E.164 Phone Number Format
const e164Regex = /^\+[1-9]\d{1,14}$/;
if (!e164Regex.test(NEW_ADMIN_MOBILE_NUMBER)) {
  console.error("********************************************************************************");
  console.error("ERROR: NEW_ADMIN_MOBILE_NUMBER is not in valid E.164 format.");
  console.error("It must start with a '+' followed by the country code and the number (e.g., +917012345678).");
  console.error("Current value:", NEW_ADMIN_MOBILE_NUMBER);
  console.error("********************************************************************************");
  process.exit(1);
}

let newUserUID = '';

admin.auth().createUser({
  email: NEW_ADMIN_EMAIL,
  emailVerified: true, // You can set this to true if you want
  password: NEW_ADMIN_PASSWORD,
  displayName: NEW_ADMIN_DISPLAY_NAME,
  phoneNumber: NEW_ADMIN_MOBILE_NUMBER, // Firebase Auth expects E.164 format here
  disabled: false
})
.then((userRecord) => {
  newUserUID = userRecord.uid;
  console.log(`Successfully created new admin user in Firebase Auth: ${NEW_ADMIN_EMAIL} (UID: ${newUserUID})`);
  // Set custom claim
  return admin.auth().setCustomUserClaims(newUserUID, { admin: true });
})
.then(() => {
  console.log(`Successfully set 'admin: true' custom claim for new user: ${newUserUID}`);
  // Create user document in Firestore
  const userDocRef = admin.firestore().collection('users').doc(newUserUID);

  // Extract 10-digit mobile number for Firestore storage (if needed and distinct from auth phone)
  // This assumes your NEW_ADMIN_MOBILE_NUMBER is correctly E.164 formatted
  let tenDigitMobileNumber = NEW_ADMIN_MOBILE_NUMBER;
  if (NEW_ADMIN_MOBILE_NUMBER.startsWith('+91')) {
    tenDigitMobileNumber = NEW_ADMIN_MOBILE_NUMBER.substring(3);
  } else if (NEW_ADMIN_MOBILE_NUMBER.startsWith('91') && NEW_ADMIN_MOBILE_NUMBER.length > 10) {
    tenDigitMobileNumber = NEW_ADMIN_MOBILE_NUMBER.substring(2);
  }
  // Remove any non-digit characters that might have slipped in, and ensure it's max 10 digits
  tenDigitMobileNumber = tenDigitMobileNumber.replace(/[^0-9]/g, '');
  if (tenDigitMobileNumber.length > 10) {
      tenDigitMobileNumber = tenDigitMobileNumber.slice(-10); // Take the last 10 digits if it's somehow longer
  }
  console.log(`Storing 10-digit mobile number in Firestore: ${tenDigitMobileNumber}`);

  return userDocRef.set({
      uid: newUserUID,
      email: NEW_ADMIN_EMAIL,
      mobileNumber: tenDigitMobileNumber, // Store the 10-digit version for app queries
      name: NEW_ADMIN_DISPLAY_NAME,
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      // Add any other fields required by your AppUser/AdminUser type in Firestore
  }, { merge: true }); // Use merge: true to avoid overwriting if doc somehow exists
})
.then(() => {
  console.log(`Firestore document for new admin user ${newUserUID} created/updated with role: 'admin'.`);
  console.log("Admin user creation complete.");
  console.log(`You can now log in with Email: ${NEW_ADMIN_EMAIL} and the Password you set, or via the Mobile Number for OTP (if using /login page).`);
  process.exit(0); // Success
})
.catch(error => {
  console.error('Error creating new admin user or setting claims/doc:', error);
  if (error.code === 'auth/email-already-exists') {
    console.error(`The email address ${NEW_ADMIN_EMAIL} is already in use by another account.`);
  } else if (error.code === 'auth/phone-number-already-exists') {
    console.error(`The phone number ${NEW_ADMIN_MOBILE_NUMBER} is already in use by another account.`);
  } else if (error.code === 'auth/invalid-email') {
    console.error(`The email address ${NEW_ADMIN_EMAIL} is invalid.`);
  } else if (error.code === 'auth/invalid-password') {
    console.error('The password provided is invalid (e.g., too short). It must be at least 6 characters.');
  } else if (error.code === 'auth/invalid-phone-number') {
    console.error(`The phone number ${NEW_ADMIN_MOBILE_NUMBER} is invalid according to Firebase. Ensure it's in E.164 format (e.g., +91XXXXXXXXXX).`);
  }
  // The generic auth/argument-error might still appear if Firebase has other internal validation rules not covered.
  if (error.code === 'auth/argument-error') {
    console.error("An 'auth/argument-error' occurred. This often means one of the provided user properties (email, password, phone number) is invalid in a way not caught by the script's basic checks. Please double-check them against Firebase requirements.");
  }
  process.exit(1); // Failure
});
