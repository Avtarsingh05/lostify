'use server';

/**
 * @fileOverview Server actions for Cashfree payment integration.
 * This file handles the communication with Cashfree API to create orders and sessions.
 */

export async function createPaymentSession(input: {
  amount: number;
  orderId: string;
  customerPhone: string;
  customerEmail: string;
  customerName: string;
}) {
  const isProd = process.env.CASHFREE_ENV === 'PRODUCTION';
  const baseUrl = isProd 
    ? 'https://api.cashfree.com/pg' 
    : 'https://sandbox.cashfree.com/pg';

  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;

  if (!appId || !secretKey) {
    // If keys aren't set yet, return a mock session for UI testing
    console.warn("Cashfree API keys not found in .env. Returning mock session.");
    return {
      payment_session_id: "session_mock_" + Math.random().toString(36).substring(7),
      order_id: input.orderId,
      isMock: true
    };
  }

  try {
    const response = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: input.orderId,
        order_amount: input.amount,
        order_currency: "INR",
        customer_details: {
          customer_id: input.customerName.replace(/\s+/g, '_').toLowerCase() || 'customer_id',
          customer_name: input.customerName,
          customer_email: input.customerEmail,
          customer_phone: input.customerPhone,
        },
        order_meta: {
          return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/shop/callback?order_id={order_id}`,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create Cashfree order');
    }

    return {
      payment_session_id: data.payment_session_id,
      order_id: data.order_id,
      isMock: false
    };
  } catch (error: any) {
    console.error("Cashfree Session Error:", error);
    throw new Error(error.message || "Payment initialization failed");
  }
}
