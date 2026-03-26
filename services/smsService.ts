export const sendSMS = async (to: string, message: string) => {
  try {
    const response = await fetch("/api/send-sms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to, message }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to send SMS");
    }

    return { success: true, sid: data.sid };
  } catch (error: any) {
    console.error("SMS Service Error:", error);
    return { success: false, error: error.message };
  }
};
