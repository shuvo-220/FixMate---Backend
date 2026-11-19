const Booking = require("../models/bookingModel");
const getStripe = require("../config/stripe");

// Create Stripe Checkout Session
const createCheckoutSession = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required!",
      });
    }

    // Find booking
    const booking = await Booking.findOne({
      _id: bookingId,
      customerEmail: req.user.email,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found!",
      });
    }

    // Payment is allowed only after service completion
    if (booking.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Payment is allowed only after service completion!",
      });
    }

    // Check payment status
    if (booking.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "This booking has already been paid!",
      });
    }

    const amount = Number(booking.finalAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount!",
      });
    }

    const stripe = getStripe();

    const clientURL =
      process.env.CLIENT_URL || "http://localhost:3000";

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      payment_method_types: ["card"],

      customer_email: booking.customerEmail,

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: booking.serviceTitle,
              description: `FixMate repair service - Booking ID: ${booking._id}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],

      metadata: {
        bookingId: booking._id.toString(),
        customerEmail: booking.customerEmail,
      },

      payment_intent_data: {
        metadata: {
          bookingId: booking._id.toString(),
          customerEmail: booking.customerEmail,
        },
      },

      success_url: `${clientURL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: `${clientURL}/payment/cancel`,
    });

    return res.status(200).json({
      success: true,
      message: "Checkout session created successfully!",
      sessionId: session.id,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error("Checkout Session Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create checkout session!",
    });
  }
};

module.exports = {
  createCheckoutSession,
};