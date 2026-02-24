const {setGlobalOptions} = require("firebase-functions/v2");
const {onDocumentCreated, onDocumentUpdated} = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const {runDoctorVerification} = require("./helpers/doctorVerificationService");
const {hasVerificationFieldsChanged} = require("./helpers/doctorFields");

setGlobalOptions({maxInstances: 10});
admin.initializeApp();

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
