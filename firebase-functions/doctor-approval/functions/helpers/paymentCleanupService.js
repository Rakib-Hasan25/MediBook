const admin = require("firebase-admin");

async function cleanupFailedOrDelayedPayments(logger) {
  const db = admin.firestore();
  const failedStatuses = ["failed", "delayed", "detailed"];
  const paymentsSnapshot = await db
      .collection("payments")
      .where("status", "in", failedStatuses)
      .limit(50)
      .get();

  if (paymentsSnapshot.empty) {
    logger.info("No failed or delayed payments found for cleanup.");
    return {processed: 0, skipped: 0};
  }

  let processed = 0;
  let skipped = 0;

  for (const paymentDoc of paymentsSnapshot.docs) {
    const paymentId = paymentDoc.id;
    const paymentData = paymentDoc.data() || {};
    const appointmentId = String(paymentData.appointmentId || "").trim();

    if (!appointmentId) {
      skipped += 1;
      logger.warn("Skipping payment cleanup: missing appointmentId.", {paymentId});
      continue;
    }

    const paymentRef = db.collection("payments").doc(paymentId);
    const appointmentRef = db.collection("appointments").doc(appointmentId);

    try {
      await db.runTransaction(async (transaction) => {
        const appointmentSnap = await transaction.get(appointmentRef);
        if (!appointmentSnap.exists) {
          throw new Error("Appointment not found");
        }

        const appointmentData = appointmentSnap.data() || {};
        const slotId = String(appointmentData.slotId || "").trim();
        if (!slotId) {
          throw new Error("Appointment has no slotId");
        }

        const slotRef = db.collection("slots").doc(slotId);
        const slotSnap = await transaction.get(slotRef);
        if (!slotSnap.exists) {
          throw new Error("Slot not found");
        }

        const slotData = slotSnap.data() || {};
        const currentBookedCount = Number(slotData.bookedCount || 0);
        const nextBookedCount = Math.max(currentBookedCount - 1, 0);

        transaction.update(slotRef, {bookedCount: nextBookedCount});
        transaction.delete(appointmentRef);
        transaction.delete(paymentRef);
      });

      processed += 1;
      logger.info("Cleaned payment, appointment, and slot count.", {
        paymentId,
        appointmentId,
      });
    } catch (error) {
      skipped += 1;
      logger.error("Failed to clean payment flow.", {
        paymentId,
        appointmentId,
        error: error.message,
      });
    }
  }

  return {processed, skipped};
}

module.exports = {
  cleanupFailedOrDelayedPayments,
};
