'use server';

/**
 * @fileOverview Server actions for OneSignal Push Notifications.
 * This ensures the REST API Key is never exposed to the client.
 */

export async function sendOneSignalNotification(input: {
  title: string;
  message: string;
  targetUserId?: string;
  sendToAll?: boolean;
}) {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const restApiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !restApiKey) {
    console.warn("OneSignal credentials missing in environment variables.");
    // For demo purposes in Firebase Studio, we log the attempt
    return { success: false, message: "Server configuration missing (API Keys)." };
  }

  const data: any = {
    app_id: appId,
    headings: { en: input.title },
    contents: { en: input.message },
  };

  if (input.sendToAll) {
    data.included_segments = ["All"];
  } else if (input.targetUserId) {
    data.include_external_user_ids = [input.targetUserId];
  } else {
    throw new Error("No target specified for notification.");
  }

  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${restApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.errors?.[0] || "OneSignal API Error");
    }

    return { success: true, id: result.id };
  } catch (error: any) {
    console.error("OneSignal Send Error:", error);
    throw new Error(error.message || "Failed to send push notification");
  }
}
