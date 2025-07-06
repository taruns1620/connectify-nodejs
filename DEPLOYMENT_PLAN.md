
# Connectify Hub - Deployment Rollout Plan

This document outlines the steps to deploy the Connectify Hub application to Firebase.

## 1. Prerequisites

Before deploying, ensure the following are configured in your Firebase project (`connectify-hub-30-6hifm`):

*   **Authentication:**
    *   **Phone Sign-in Method:**
        *   Go to Firebase Console -> Authentication -> Sign-in method tab.
        *   Ensure the **Phone** provider is **Enabled**. This is still required for the backend to create users with phone numbers, even with a custom OTP provider.
    *   **Google Sign-in Method:**
        *   Go to Firebase Console -> Authentication -> Sign-in method tab.
        *   Ensure the **Google** provider is **Enabled**.
        *   A "Project support email" must be selected.
    *   **Authorized domains:** In Firebase Console -> Authentication -> Settings -> Authorized domains, ensure the following are listed (click "Add domain" if missing):
        *   `localhost` (for local development)
        *   `connectifyhub.in` (your custom domain)
        *   `connectify-hub-30-6hifm.firebaseapp.com` (your project's default Firebase hosting domain)
        *   `connectify-hub-30-6hifm.web.app` (another default Firebase hosting domain)
*   **Cloud Firestore:**
    *   Firestore is enabled, preferably in **Native mode**.
    *   **Security Rules (`firestore.rules`):** Review and ensure they are appropriate for production. You currently have some rules; ensure they cover all collections (`users`, `otpStore`, etc.) and define appropriate access controls.
*   **Cloud Functions:**
    *   Node.js runtime is selected (your `firebase.json` specifies Node.js 18).
*   **Firebase Storage:**
    *   Storage is enabled.
    *   **Security Rules (`storage.rules`):** Review and ensure they are appropriate.
*   **Environment Variables (for Cloud Functions):**
    *   These are crucial for backend services.
    *   **Fast2SMS API Credentials:**
        *   These are required for the custom OTP system.
        *   Set these using the Firebase CLI (navigate to your project root in the terminal):
            ```bash
            firebase functions:config:set fast2sms.api_key="YOUR_FAST2SMS_AUTHORIZATION_KEY"
            firebase functions:config:set fast2sms.sender_id="YOUR_SENDER_ID"
            firebase functions:config:set fast2sms.message_template_id="YOUR_DLT_MESSAGE_TEMPLATE_ID"
            ```
    *   **Old SMS Gateway (if still used for notifications):**
        *   Your `functions/src/index.ts` might still expect `sms.api_key` and `sms.sender_id` for non-OTP messages.
        *   Set these if needed:
            ```bash
            firebase functions:config:set sms.api_key="YOUR_NOTIFICATION_SMS_GATEWAY_API_KEY"
            firebase functions:config:set sms.sender_id="YOUR_NOTIFICATION_SENDER_ID"
            ```
    *   **Important:** Replace placeholders with your actual secret keys.
    *   After setting/updating config, you must redeploy functions: `firebase deploy --only functions`.
*   **Environment Variables (for Next.js App):**
    *   These are used by your frontend and Next.js server-side code.
    *   Ensure your `.env.local` file (for local development, **NEVER commit this file**) has the Firebase Web SDK keys.
    *   For **production deployment**, these `NEXT_PUBLIC_` variables need to be set in your hosting provider's environment variable settings.
*   **Billing:** Billing must be enabled on your Google Cloud project associated with Firebase if you expect to exceed the free tier limits. Cloud Functions making external network requests (like to an SMS gateway) require the Blaze (pay-as-you-go) plan.
*   **Domain Name:** Your domain `connectifyhub.in` should be ready to be configured to point to Firebase Hosting.

## 2. Pre-Deployment Checklist

*   [ ] **Code Freeze (Recommended):** Avoid making new code changes during the deployment process.
*   [ ] **Final Local Testing:**
    *   Thoroughly test all user flows (signup, login for all roles with custom OTP) using Firebase Emulators:
        ```bash
        firebase emulators:start
        ```
*   [ ] **Build Next.js App (Frontend):**
    ```bash
    npm run build
    ```
    *   Ensure there are no build errors.
*   [ ] **Build Cloud Functions (Backend):**
    ```bash
    cd functions
    npm install
    npm run build
    cd ..
    ```
    *   Ensure there are no build errors.
*   [ ] **Version Control:** Commit all final code changes to your Git repository.

## 3. Deployment Steps (Using Firebase CLI)

1.  **Login to Firebase:**
    ```bash
    firebase login
    ```
2.  **Select Your Firebase Project:**
    ```bash
    firebase use connectify-hub-30-6hifm
    ```
3.  **Deploy All Configured Services:**
    ```bash
    firebase deploy
    ```
    *   This command will deploy Hosting, Cloud Functions, and Firestore/Storage rules.

4.  **Monitor Deployment:** Watch the CLI output for errors.

## 4. Post-Deployment Checklist

*   [ ] **Access Live Site:** Open your Firebase Hosting URL and your custom domain `https://connectifyhub.in`.
*   [ ] **Test Core User Flows (Live Environment):**
    *   Client & Vendor Signup (Mobile OTP & Google).
    *   Login for all roles.
    *   Verify API Calls/Cloud Functions by checking **Firebase Console -> Functions -> Logs** for any runtime errors, especially from the new OTP functions.
*   [ ] **Database Verification:**
    *   In the **Firebase Console -> Firestore Database**, check that:
        *   New user documents are created correctly.
        *   `otpStore` documents are created and deleted as expected during OTP flows.
*   [ ] **Notifications:**
    *   Test the custom OTP flow and confirm messages are being sent/received.

## 5. Ongoing & Advanced Rollout Considerations

*   **Staged Rollouts:** Use Firebase Hosting's staged rollouts for future updates.
*   **CI/CD:** Automate your deployment process using tools like GitHub Actions.
*   **Monitoring & Alerting:** Set up monitoring for your Cloud Functions to get alerted about issues.
*   **Backup & Restore Plan:** Regularly back up your Firestore data.
