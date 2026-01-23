import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "order_placed" | "order_accepted" | "order_rejected" | "ready_for_delivery" | "order_delivered";
  orderId: string;
  recipientEmail: string;
  recipientName: string;
  vegetableName: string;
  farmerName?: string;
  customerName?: string;
}

const getEmailContent = (notification: NotificationRequest) => {
  const { type, vegetableName, farmerName, customerName } = notification;
  
  const templates: Record<string, { subject: string; html: string }> = {
    order_placed: {
      subject: `New Order Received - ${vegetableName}`,
      html: `
        <h1>New Order Alert! 🌱</h1>
        <p>Hello ${farmerName || "Farmer"},</p>
        <p>Great news! You've received a new order for <strong>${vegetableName}</strong> from ${customerName || "a customer"}.</p>
        <p>Please log in to your dashboard to review and accept the order.</p>
        <br>
        <p>Best regards,<br>The GrowShare Team</p>
      `,
    },
    order_accepted: {
      subject: `Your Order Has Been Accepted! - ${vegetableName}`,
      html: `
        <h1>Order Confirmed! 🎉</h1>
        <p>Hello ${customerName || "Customer"},</p>
        <p>Your order for <strong>${vegetableName}</strong> has been accepted by ${farmerName || "the farmer"}.</p>
        <p>The farmer will now begin growing your vegetables. You can track the progress in your dashboard.</p>
        <br>
        <p>Best regards,<br>The GrowShare Team</p>
      `,
    },
    order_rejected: {
      subject: `Order Update - ${vegetableName}`,
      html: `
        <h1>Order Update</h1>
        <p>Hello ${customerName || "Customer"},</p>
        <p>Unfortunately, your order for <strong>${vegetableName}</strong> could not be accepted at this time.</p>
        <p>Please try ordering from another farmer or contact support for assistance.</p>
        <br>
        <p>Best regards,<br>The GrowShare Team</p>
      `,
    },
    ready_for_delivery: {
      subject: `Your Vegetables Are Ready! - ${vegetableName}`,
      html: `
        <h1>Harvest Complete! 🥬</h1>
        <p>Hello ${customerName || "Customer"},</p>
        <p>Your <strong>${vegetableName}</strong> has been harvested and is ready for delivery!</p>
        <p>Please complete the final payment in your dashboard to arrange delivery.</p>
        <br>
        <p>Best regards,<br>The GrowShare Team</p>
      `,
    },
    order_delivered: {
      subject: `Order Delivered - ${vegetableName}`,
      html: `
        <h1>Enjoy Your Fresh Vegetables! 🥗</h1>
        <p>Hello ${customerName || "Customer"},</p>
        <p>Your order of <strong>${vegetableName}</strong> has been delivered!</p>
        <p>We hope you enjoy your fresh, organic produce. Thank you for choosing GrowShare!</p>
        <br>
        <p>Best regards,<br>The GrowShare Team</p>
      `,
    },
  };

  return templates[type] || templates.order_placed;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Send notification function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const notification: NotificationRequest = await req.json();
    console.log("Processing notification:", notification);
    
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured - logging notification instead");
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Notification logged (email not configured)",
          notification 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { subject, html } = getEmailContent(notification);

    // Use fetch to call Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "GrowShare <notifications@resend.dev>",
        to: [notification.recipientEmail],
        subject,
        html,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ success: true, emailResponse: emailResult }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
