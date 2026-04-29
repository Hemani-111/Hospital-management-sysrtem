// Helpers for mapping Postgres view rows to the JSON shape expected by the React UI.
// Kept here so both route files can reuse the same normalization/parsing logic.

export const parseMedicinesString = (medicinesText) => {
  const text = (medicinesText ?? '').toString().trim();
  if (!text) {
    return {
      medications: '',
      dosage: '',
      frequency: '',
      enddate: null,
    };
  }

  // Expected-ish formats in the UI:
  // - "Name - Dosage - Frequency - Duration"
  // - "Name - Dosage - Duration" (legacy / partial; we handle gracefully)
  const parts = text
    .split('-')
    .map((p) => p.trim())
    .filter(Boolean);

  const medications = parts[0] || '';
  const dosagePart = parts[1] || null;
  const frequencyPart = parts[2] || '';
  const durationPart = parts[3] || parts[2] || null; // best-effort fallback

  const dosage = dosagePart ?? '';
  const frequency = frequencyPart ?? '';

  // Convert duration (best-effort) like "5 days", "2 day", "7 weeks" (only days -> enddate)
  let enddate = null;
  if (durationPart) {
    const dayMatch = durationPart.match(/(\d+)\s*day/i);
    const days = dayMatch ? Number(dayMatch[1]) : null;
    if (Number.isFinite(days) && days !== null) {
      enddate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  return { medications, dosage, frequency, enddate };
};

export const mapDoctorDiagnosisRowToUi = (row) => {
  return {
    diseaseid: row.diseaseid ?? row.disease_id ?? null,
    disease: {
      name: row.diseasename ?? row.disease_name ?? '',
      icd10code: row.icd10code ?? '',
    },
    severity: row.severity ?? '',
    notes: row.notes ?? row.diagnosisnotes ?? row.diagnosis_notes ?? '',
    diagnosedon: row.diagnosedon ?? row.diagnosed_on ?? null,
  };
};

export const mapDoctorPrescriptionRowToUi = (row) => {
  const parsed = parseMedicinesString(row.medicines);
  return {
    prescriptionid: row.prescriptionid ?? null,
    medicines: row.medicines ?? '',
    medications: parsed.medications,
    dosage: parsed.dosage,
    frequency: parsed.frequency,
    enddate: parsed.enddate,
    instructions: row.instructions ?? '',
    prescribedon: row.prescribedon ?? null,
  };
};

export const mapPatientLabReportRowToUi = (row) => {
  return {
    reportid: row.reportid ?? null,
    caserequestid: row.caserequestid ?? null,
    status: row.labstatus ?? row.status ?? '',
    orderedon: row.orderedon ?? null,
    resultedon: row.resultedon ?? null,
    resultvalue: row.testvalue ?? row.resultvalue ?? null,
    labtest: {
      testname: row.testname ?? '',
      unit: row.unit ?? '',
      normalrange: row.normalrange ?? null,
      description: row.description ?? null,
    },
  };
};

export const splitDoctorName = (doctorName) => {
  const name = (doctorName ?? '').toString().trim();
  if (!name) return { firstname: '', lastname: '' };
  const parts = name.split(/\s+/);
  const firstname = parts[0] ?? '';
  const lastname = parts.slice(1).join(' ') ?? '';
  return { firstname, lastname };
};

