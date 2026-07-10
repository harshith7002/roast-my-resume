import { apiFetch } from "./api";

/**
 * Asynchronously loads the Razorpay Checkout script and mounts it to the DOM.
 * Returns a promise that resolves true once interactive, or false on failure.
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    // Already loaded — resolve immediately
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => resolve(true);

    script.onerror = () => {
      console.error(
        "CRITICAL: Razorpay SDK failed to load. Check network/CSP configuration."
      );
      resolve(false);
    };

    document.body.appendChild(script);
  });
};

/**
 * Opens the Razorpay payment modal.
 * Handles script loading, order creation, checkout, and payment verification.
 */
export async function openRazorpayCheckout({
  tier,
  userId,
  email,
  name,
  onPaymentSuccess,
  onPaymentError,
  onDismiss,
}) {
  // Step 1: Ensure SDK is loaded BEFORE making any API calls
  const isScriptLoaded = await loadRazorpayScript();
  if (!isScriptLoaded) {
    const err = new Error(
      "Could not initialize payment window. Please disable any ad-blockers and try again."
    );
    if (onPaymentError) onPaymentError(err);
    throw err;
  }

  // Step 2: Create order on backend
  let order;
  try {
    order = await apiFetch("/api/payments/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier, user_id: userId }),
    });
  } catch (err) {
    const error = new Error(
      "Failed to connect to the payment server. Please try again."
    );
    if (onPaymentError) onPaymentError(error);
    throw error;
  }

  if (!order || order.error) {
    const error = new Error(order?.error || "Failed to create payment order.");
    if (onPaymentError) onPaymentError(error);
    throw error;
  }

  if (!order.order_id || !order.key_id) {
    const error = new Error(
      "Invalid response from payment server. Missing order_id or key_id."
    );
    if (onPaymentError) onPaymentError(error);
    throw error;
  }

  // Step 3: Open Razorpay Checkout Modal
  const options = {
    key: order.key_id,
    amount: order.amount,
    currency: order.currency || "INR",
    name: "Macoostudy 2.0",
    description:
      tier === "pro_plus" ? "Pro Lifetime – Full Career Suite" : "Pro Lite – Detailed Breakdowns",
    order_id: order.order_id,

    handler: async function (response) {
      // Step 4: Verify payment signature on backend
      try {
        const verification = await apiFetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            user_id: userId,
          }),
        });

        if (verification && verification.success) {
          if (onPaymentSuccess) onPaymentSuccess(verification);
        } else {
          const error = new Error(
            verification?.error || "Payment verification failed. Please contact support."
          );
          if (onPaymentError) onPaymentError(error);
        }
      } catch (err) {
        if (onPaymentError)
          onPaymentError(
            new Error("Could not verify your payment. Please contact support with your payment ID.")
          );
      }
    },

    prefill: {
      name: name || "",
      email: email || "",
    },

    theme: {
      color: "#ff6b00",
    },

    modal: {
      ondismiss: () => {
        console.log("Razorpay modal dismissed by user.");
        if (onDismiss) onDismiss();
      },
    },
  };

  // Step 5: Instantiate and open
  const rzp = new window.Razorpay(options);

  rzp.on("payment.failed", function (response) {
    const msg =
      response?.error?.description ||
      response?.error?.reason ||
      "Payment failed. Please try a different payment method.";
    if (onPaymentError) onPaymentError(new Error(msg));
  });

  rzp.open();
}
