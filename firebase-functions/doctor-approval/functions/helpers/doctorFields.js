function getDoctorDocumentUrl(doctor = {}) {
  return (
    doctor.document_url ||
    doctor.documentUrl ||
    doctor.documentsUrl ||
    doctor.documentsURL ||
    ""
  );
}

function getMissingFields(doctor = {}) {
  const missing = [];
  if (!doctor.license_number) missing.push("license_number");
  if (!doctor.specialization) missing.push("specialization");
  if (!getDoctorDocumentUrl(doctor)) missing.push("document_url");
  return missing;
}

function hasVerificationFieldsChanged(before = {}, after = {}) {
  return (
    (before.license_number || "") !== (after.license_number || "") ||
    (before.specialization || "") !== (after.specialization || "") ||
    getDoctorDocumentUrl(before) !== getDoctorDocumentUrl(after)
  );
}

module.exports = {
  getDoctorDocumentUrl,
  getMissingFields,
  hasVerificationFieldsChanged,
};
