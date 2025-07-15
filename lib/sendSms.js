// lib/sendSms.js
import fetch from 'node-fetch';

export async function sendOtpViaFast2Sms(mobileNumber, otp) {
    const apiKey =  process.env.FAST2SMS_API_KEY;
    const senderId = process.env.FAST2SMS_SENDER_ID;
    const messageTemplateId = process.env.FAST2SMS_MESSAGE_TEMPLATE_ID;

    if (!apiKey || !senderId || !messageTemplateId) {
        console.error("Fast2SMS config not set. Set environment variables (FAST2SMS_API_KEY, etc.).");
        throw new Error("The OTP service is not configured correctly. Please contact support.");
    }

    const url = new URL("https://www.fast2sms.com/dev/bulkV2");
    url.searchParams.append("authorization", apiKey);
    url.searchParams.append("route", "dlt");
    url.searchParams.append("sender_id", senderId);
    url.searchParams.append("message", messageTemplateId);
    url.searchParams.append("variables_values", `${otp}|`);
    url.searchParams.append("numbers", mobileNumber); // Assumes 10-digit number
    url.searchParams.append("flash", "0");

    try {
        const response = await fetch(url.toString(), {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            timeout: 10000, // Add a timeout
        });

        const responseData = await response.json();

        if (!response.ok || responseData.return !== true) {
            console.error("Fast2SMS API Error:", responseData);
            const errorMessage = responseData.message || "The OTP provider could not send the message.";
            throw new Error(`Fast2SMS Error: ${errorMessage}`);
        }

        return responseData;
    } catch (error) {
        console.error(`Error sending SMS to ${mobileNumber}:`, error);
        throw new Error(`Failed to send SMS: ${error.message}`);
    }
}