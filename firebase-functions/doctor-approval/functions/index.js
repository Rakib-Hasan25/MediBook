const {setGlobalOptions} = require("firebase-functions/v2");
const {onDocumentCreated, onDocumentUpdated} = require("firebase-functions/v2/firestore");
const {onCall, onRequest, HttpsError} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const {runDoctorVerification} = require("./helpers/doctorVerificationService");
const {hasVerificationFieldsChanged} = require("./helpers/doctorFields");
const {
  processPaymentAction,
  processPaymentWebhook,
} = require("./helpers/paymentGatewayService");

setGlobalOptions({maxInstances: 10});
admin.initializeApp();
const PAYMENT_SECRETS = ["PAYMENT_WEBHOOK_SECRET"];

exports.verifyDoctorOnCreate = onDocumentCreated( {
  document: "doctors/{doctorId}",
  secrets: ["OPENAI_API_KEY"]
}, async (event) => {
  return runDoctorVerification({
    doctorRef: event.data?.ref,
    doctor: event.data?.data(),
    doctorId: event.params.doctorId,
  });
});

exports.verifyDoctorOnUpdate = onDocumentUpdated({
  document: "doctors/{doctorId}",
  secrets: ["OPENAI_API_KEY"]
}, async (event) => {
  const before = event.data?.before?.data() || {};
  const after = event.data?.after?.data() || {};

  if (!hasVerificationFieldsChanged(before, after)) {
    logger.info("Doctor details unchanged, skipping verification.", {
      doctorId: event.params.doctorId,
    });
    return null;
  }

  return runDoctorVerification({
    doctorRef: event.data?.after?.ref,
    doctor: after,
    doctorId: event.params.doctorId,
  });
});

exports.logPaymentAction = onCall({secrets: PAYMENT_SECRETS}, async (request) => {
  try {
    const result = await processPaymentAction({data: request.data}, logger);
    return result;
  } catch (error) {
    if (error.message === "paymentId and valid action are required") {
      throw new HttpsError("invalid-argument", error.message);
    }
    if (error.message === "Invalid payment") {
      throw new HttpsError("invalid-argument", error.message);
    }
    throw new HttpsError("internal", error.message || "Failed to process payment action");
  }
});

exports.paymentWebhook = onRequest({secrets: PAYMENT_SECRETS}, async (req, res) => {
  try {
    const result = await processPaymentWebhook(req.body);
    return res.status(200).send(result);
  } catch (error) {
    if (error.message === "Unauthorized") {
      return res.status(401).send(error.message);
    }
    if (
      error.message === "Payment not found" ||
      error.message === "Appointment not found" ||
      error.message === "Payment has no appointment" ||
      error.message === "Invalid webhook payload"
    ) {
      return res.status(400).send(error.message);
    }
    return res.status(500).send(error.message || "Webhook processing failed");
  }
});
