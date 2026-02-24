const logger = require("firebase-functions/logger");
const {FieldValue} = require("firebase-admin/firestore");
const {getDoctorDocumentUrl, getMissingFields} = require("./doctorFields");
const {verifyDoctorWithAI} = require("./aiVerifier");

function buildResultPayload({status, verificationMessage, aiReviewReason}) {
  return {
    "doctor-status": status,
    verificationMessage,
    aiReviewReason: aiReviewReason || null,
    verifiedAt: FieldValue.serverTimestamp(),
  };
}

async function runDoctorVerification({doctorRef, doctor, doctorId}) {
  if (!doctorRef || !doctor) {
    logger.error("Doctor document payload missing.");
    return null;
  }

  const missingFields = getMissingFields(doctor);
  if (missingFields.length > 0) {
    await doctorRef.set(
      buildResultPayload({
        status: "not_verified",
        verificationMessage: `Necessary information not added: ${missingFields.join(", ")}`,
      }),
      {merge: true},
    );

    logger.warn("Doctor verification skipped due to missing fields.", {
      doctorId,
      missingFields,
    });
    return null;
  }

  try {
    const aiResult = await verifyDoctorWithAI({
      license_number: doctor.license_number,
      specialization: doctor.specialization,
      document_url: getDoctorDocumentUrl(doctor),
    });

    if (aiResult.verified) {
      await doctorRef.set(
        buildResultPayload({
          status: "verified",
          verificationMessage: "Doctor profile verified successfully.",
          aiReviewReason: aiResult.reason,
        }),
        {merge: true},
      );
      logger.info("Doctor verified.", {doctorId});
      return null;
    }

    await doctorRef.set(
      buildResultPayload({
        status: "not_verified",
        verificationMessage: "Doctor profile is not verified.",
        aiReviewReason: aiResult.reason,
      }),
      {merge: true},
    );
    logger.info("Doctor rejected by AI review.", {doctorId});
  } catch (error) {
    logger.error("Doctor verification failed.", {
      doctorId,
      error: error.message,
    });

    await doctorRef.set(
      buildResultPayload({
        status: "not_verified",
        verificationMessage: `Verification failed: ${error.message}`,
      }),
      {merge: true},
    );
  }

  return null;
}

module.exports = {
  runDoctorVerification,
};
