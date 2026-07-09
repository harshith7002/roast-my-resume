import { apiFetch } from "./api";

export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout({ tier, userId, email, onPaymentSuccess, onPaymentError }) {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    throw new Error("Failed to load Razorpay payment SDK. Please check your internet connection.");
  }

  // 1. Create order on backend
  const order = await apiFetch("/api/payments/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tier, user_id: userId }),
  });

  if (!order || order.error) {
    throw new Error(order.error || "Failed to create payment order");
  }

  // If order ID is mock or key is mock, bypass Razorpay modal to allow testing
  if (order.order_id.startsWith("order_mock_") || order.key_id.includes("mockkey")) {
    const mockPaymentId = `pay_mock_${Math.random().toString(36).substring(2, 11)}`;
    try {
      const verification = await apiFetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: order.order_id,
          razorpay_payment_id: mockPaymentId,
          razorpay_signature: "mock_signature_bypass",
          user_id: userId,
        }),
      });

      if (verification.success) {
        if (onPaymentSuccess) onPaymentSuccess(verification);
      } else {
        if (onPaymentError) onPaymentError(new Error(verification.error || "Verification failed"));
      }
    } catch (err) {
      if (onPaymentError) onPaymentError(err);
    }
    return;
  }

  // 2. Open Razorpay Checkout modal
  const options = {
    key: order.key_id,
    amount: order.amount,
    currency: order.currency,
    name: "Macoostudy 2.0",
    description: `Upgrade to ${tier === "pro_plus" ? "Pro+ Unlimited" : "Pro"} Plan`,
    order_id: order.order_id,
    handler: async function (response) {
      try {
        // 3. Verify payment signature on backend
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

        if (verification.success) {
          if (onPaymentSuccess) onPaymentSuccess(verification);
        } else {
          if (onPaymentError) onPaymentError(new Error(verification.error || "Verification failed"));
        }
      } catch (err) {
        if (onPaymentError) onPaymentError(err);
      }
    },
    prefill: {
      email: email || "",
    },
    theme: {
      color: "#ff6b00", // Hot fire orange theme
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.on("payment.failed", function (response) {
    if (onPaymentError) onPaymentError(new Error(response.error.description || "Payment failed"));
  });
  rzp.open();
}
