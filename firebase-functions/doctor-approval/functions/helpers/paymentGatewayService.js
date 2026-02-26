const admin = require("firebase-admin");

function getRequiredEnvValue(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function getPayloadFromRequest(req) {
  const root = req?.body || {};
  const payload = root.data && typeof root.data === "object" ? root.data : root;
  return payload || {};
}

function normalizeAction(value) {
  const action = String(value || "").trim().toLowerCase();
  if (action === "success") return "success";
  if (action === "fail" || action === "failed") return "fail";
  if (action === "delay" || action === "delayed" || action === "due") return "delay";
  return "";
}

function getWebhookStatus(action) {
  return action === "success" ? "success" : "failed";
}

function getWebhookSecret() {
  return getRequiredEnvValue("PAYMENT_WEBHOOK_SECRET");
}

function getWebhookUrl() {
  return getRequiredEnvValue("PAYMENT_WEBHOOK_URL");
}

async function callWebhook(paymentId, transactionId, status) {
  const response = await fetch(getWebhookUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentId,
      transactionId,
      status,
      secret: getWebhookSecret(),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Webhook call failed: ${body || response.statusText}`);
  }
}

async function processPaymentAction(body, logger) {
  const payload = getPayloadFromRequest({body});
  const paymentId = String(payload.paymentId || payload.paymentid || "").trim();
  const action = normalizeAction(payload.action || payload.paymentState);
  const slotid = payload.slotid || null;
  const userid = payload.userid || null;
  const doctorid = payload.doctorid || null;

  if (!paymentId || !action) {
    throw new Error("paymentId and valid action are required");
  }

  const db = admin.firestore();
  const paymentRef = db.collection("payments").doc(paymentId);
  const paymentDoc = await paymentRef.get();

  if (!paymentDoc.exists) {
    throw new Error("Invalid payment");
  }

  const paymentData = paymentDoc.data() || {};
  const transactionId = paymentData.transactionId || `TXN_${Date.now()}`;

  logger.info("hi from function");
  logger.info("payment function payload", {
    slotid,
    userid,
    doctorid,
    paymentId,
    action,
    transactionId,
  });

  if (action === "success") {
    await paymentRef.update({
      status: "success",
      transactionId,
      gatewayStatus: "processed",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await callWebhook(paymentId, transactionId, getWebhookStatus(action));
  }

  if (action === "fail") {
    await paymentRef.update({
      status: "failed",
      transactionId,
      gatewayStatus: "processed",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await callWebhook(paymentId, transactionId, getWebhookStatus(action));
  }

  if (action === "delay") {
    await paymentRef.update({
      status: "delayed",
      transactionId,
      gatewayStatus: "initiated",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return {
    message: "Payment action processed",
    paymentId,
    transactionId,
    action,
  };
}

async function processPaymentWebhook(body) {
  const paymentId = String(body?.paymentId || "").trim();
  const transactionId = String(body?.transactionId || "").trim();
  const status = String(body?.status || "").trim().toLowerCase();
  const secret = String(body?.secret || "").trim();

  if (secret !== getWebhookSecret()) {
    throw new Error("Unauthorized");
  }

  if (!paymentId || !transactionId || !["success", "failed"].includes(status)) {
    throw new Error("Invalid webhook payload");
  }

  const db = admin.firestore();
  const paymentRef = db.collection("payments").doc(paymentId);
  const paymentDoc = await paymentRef.get();

  if (!paymentDoc.exists) {
    throw new Error("Payment not found");
  }

  const paymentData = paymentDoc.data() || {};
  if (!paymentData.appointmentId) {
    throw new Error("Payment has no appointment");
  }

  const appointmentRef = db.collection("appointments").doc(paymentData.appointmentId);

  await db.runTransaction(async (transaction) => {
    const appointmentDoc = await transaction.get(appointmentRef);
    if (!appointmentDoc.exists) {
      throw new Error("Appointment not found");
    }

    if (status === "success") {
      transaction.update(paymentRef, {
        status: "success",
        transactionId,
        gatewayStatus: "processed",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      transaction.update(appointmentRef, {
        status: "confirmed",
      });
      return;
    }

    transaction.update(paymentRef, {
      status: "failed",
      transactionId,
      gatewayStatus: "processed",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    transaction.update(appointmentRef, {
      status: "failed",
    });

    const slotId = appointmentDoc.data()?.slotId;
    if (!slotId) return;

    const slotRef = db.collection("slots").doc(slotId);
    const slotDoc = await transaction.get(slotRef);
    if (!slotDoc.exists) return;

    const bookedCount = Number(slotDoc.data()?.bookedCount) || 0;
    transaction.update(slotRef, {
      bookedCount: Math.max(bookedCount - 1, 0),
    });
  });

  return "Webhook processed";
}

module.exports = {
  processPaymentAction,
  processPaymentWebhook,
};
