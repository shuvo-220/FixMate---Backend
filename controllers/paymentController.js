const Booking = require("../models/bookingModel");
const Payment = require("../models/paymentModel");
const getStripe = require("../config/stripe");

// Create Stripe Checkout Session
const createCheckoutSession = async (req, res) => {
  try {
    const { bookingId } = req.body || {};

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required!",
      });
    }

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

    if (booking.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Payment is allowed only after service completion!",
      });
    }

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

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
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

// Stripe Webhook
const handleStripeWebhook = async (req, res) => {
  const stripe = getStripe();

  let event;

  try {
    const signature = req.headers["stripe-signature"];

    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Webhook Signature Error:", error.message);

    return res.status(400).send(
      `Webhook Error: ${error.message}`
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      if (session.payment_status !== "paid") {
        return res.status(200).json({
          received: true,
          message: "Payment is not completed yet.",
        });
      }

      const bookingId = session.metadata?.bookingId;
      const customerEmail = session.metadata?.customerEmail;

      if (!bookingId || !customerEmail) {
        return res.status(400).json({
          success: false,
          message: "Booking information missing from Stripe session!",
        });
      }

      const booking = await Booking.findOne({
        _id: bookingId,
        customerEmail,
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found!",
        });
      }

      const expectedAmount = Math.round(
        Number(booking.finalAmount) * 100
      );

      if (
        booking.status !== "completed" ||
        session.currency !== "usd" ||
        session.amount_total !== expectedAmount
      ) {
        return res.status(400).json({
          success: false,
          message: "Payment verification failed!",
        });
      }

      // Prevent duplicate payment records
      const existingPayment = await Payment.findOne({
        stripeSessionId: session.id,
      });

      if (existingPayment) {
        await Booking.updateOne(
          { _id: booking._id },
          { $set: { paymentStatus: "paid" } }
        );

        return res.status(200).json({
          received: true,
          message: "Payment already processed!",
        });
      }

      await Payment.create({
        bookingId: booking._id,
        serviceTitle: booking.serviceTitle,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        technicianName: booking.technicianName,
        technicianEmail: booking.technicianEmail,
        amount: booking.finalAmount,
        currency: "usd",
        transactionId: session.payment_intent,
        stripeSessionId: session.id,
        paymentStatus: "paid",
        paidAt: new Date(),
      });

      await Booking.updateOne(
        {
          _id: booking._id,
          status: "completed",
          paymentStatus: "unpaid",
        },
        {
          $set: {
            paymentStatus: "paid",
          },
        }
      );

      console.log("Stripe payment processed:", session.id);
    }

    return res.status(200).json({
      received: true,
    });
  } catch (error) {
    console.error("Stripe Webhook Processing Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed!",
    });
  }
};

// Customer: Get My Payment History
const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({
      customerEmail: req.user.email,
    }).sort({ paidAt: -1 });

    return res.status(200).json({
      success: true,
      total: payments.length,
      payments,
    });
  } catch (error) {
    console.error("Get My Payments Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment history!",
    });
  }
};

// Admin: Get All Payments
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({
      paidAt: -1,
    });

    return res.status(200).json({
      success: true,
      total: payments.length,
      payments,
    });
  } catch (error) {
    console.error("Get All Payments Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch all payments!",
    });
  }
};

module.exports = {
  createCheckoutSession,
  handleStripeWebhook,
  getMyPayments,
  getAllPayments,
};
