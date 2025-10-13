import { NextRequest, NextResponse } from 'next/server';
import { Buffer } from 'buffer';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { amount, description, requestId } = body; // Assuming requestId is passed for metadata

  if (!amount || !description) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const PAYMONGO_SECRET_KEY = process.env.NEXT_PUBLIC_PAYMONGO_SECRET_KEY;
  if (!PAYMONGO_SECRET_KEY) {
    return NextResponse.json({ error: 'PayMongo keys not configured' }, { status: 500 });
  }

  try {
    // Create payment intent
    const paymentIntentResponse = await fetch(
      'https://api.paymongo.com/v1/payment_intents',
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY + ':').toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            attributes: {
              amount: amount * 100, // Convert to centavos
              payment_method_allowed: [
                'qrph',
                'card',
                'dob',
                'gcash',
                'grab_pay',
                'billease',
                'paymaya',
              ],
              payment_method_options: { card: { request_three_d_secure: 'any' } },
              currency: 'PHP',
              description,
              metadata: {
                request_id: requestId || 'transaction', // Use transaction ID if available
              },
              capture_type: 'automatic',
            },
          },
        }),
      }
    );

    const paymentIntentData = await paymentIntentResponse.json();

    if (!paymentIntentResponse.ok) {
      throw new Error(
        paymentIntentData.errors?.[0]?.detail || 'Failed to create payment intent'
      );
    }

    const paymentIntentId = paymentIntentData.data.id;

    // Create checkout session
    const checkoutResponse = await fetch(
      'https://api.paymongo.com/v1/checkout_sessions',
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY + ':').toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            attributes: {
              payment_intent_id: paymentIntentId,
              description,
              line_items: [
                {
                  amount: amount * 100,
                  currency: 'PHP',
                  name: description,
                  quantity: 1,
                },
              ],
              payment_method_types: [
                'qrph',
                'card',
                'dob',
                'gcash',
                'grab_pay',
                'billease',
                'paymaya',
              ],
              success_url: `${
                process.env.NODE_ENV === 'production'
                  ? process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
                  : 'http://localhost:3000'
              }/transactions/success?payment_intent_id=${paymentIntentId}&request_id=${
                requestId || 'transaction'
              }`, // Adjust to your success page; polling will handle booking
              cancel_url: `${
                process.env.NODE_ENV === 'production'
                  ? process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
                  : 'http://localhost:3000'
              }/transactions/cancel?request_id=${requestId || 'transaction'}`,
            },
          },
        }),
      }
    );

    const checkoutData = await checkoutResponse.json();

    if (!checkoutResponse.ok) {
      throw new Error(
        checkoutData.errors?.[0]?.detail || 'Failed to create checkout session'
      );
    }

    return NextResponse.json({
      body: {
        data: {
          id: paymentIntentId,
          attributes: {
            checkout_url: checkoutData.data.attributes.checkout_url,
          },
        },
      },
    });
  } catch (error) {
    console.error('Error creating payment session:', error);
    return NextResponse.json({ error: 'Failed to create payment session' }, { status: 500 });
  }
}