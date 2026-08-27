const API_BASE = '/api';

export async function request(path, options = {}) {
  const currentRole = localStorage.getItem('medralink_demo_role') || 'Patient';
  
  const headers = {
    'Content-Type': 'application/json',
    'x-demo-role': currentRole,
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json();
  if (!response.ok) {
    const errorMsg = data?.issue?.[0]?.diagnostics || data?.reason || 'API request failed';
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const api = {
  // Health & Network
  getHealth: () => request('/health'),
  getNetworkStatus: () => request('/status'),
  bootstrapDemo: () => request('/demo/bootstrap', { method: 'POST' }),

  // Patients
  getSyntheticPatients: () => request('/patients/synthetic'),
  registerPatient: (body) => request('/patients/register', { method: 'POST', body }),
  getPatient: (patientRefHash) => request(`/patients/${patientRefHash}`),

  // Providers
  registerProvider: (body) => request('/providers/register', { method: 'POST', body }),

  // Records
  createRecord: (body) => request('/records', { method: 'POST', body }),
  getRecord: (id, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/records/${id}${query ? `?${query}` : ''}`);
  },
  getPatientRecords: (patientRefHash) => request(`/records/patient/${patientRefHash}`),

  // Consents
  grantConsent: (body) => request('/consents', { method: 'POST', body }),
  revokeConsent: (consentId, patientRefHash) =>
    request(`/consents/${consentId}`, { method: 'DELETE', body: { patientRefHash } }),
  getPatientConsents: (patientRefHash) => request(`/consents/patient/${patientRefHash}`),

  // Access Verification
  requestAccess: (body) => request('/access/request', { method: 'POST', body }),

  // Emergency Break-Glass
  invokeEmergency: (body) => request('/emergency/invoke', { method: 'POST', body }),
  reviewEmergency: (body) => request('/emergency/review', { method: 'POST', body }),
  getAllEmergencyEvents: () => request('/emergency/all'),

  // Audit Trail & Blocks
  getAuditHistory: (patientRefHash) => request(`/audit/${patientRefHash}`),
  getBlocks: () => request('/audit/blocks/all'),

  // Agentic AI Multi-Agent Engine
  getAgentStatus: () => request('/agents/status'),
  getOntology: () => request('/agents/ontology'),
  orchestrateDAG: (workflowType, inputPayload) =>
    request('/agents/orchestrate', { method: 'POST', body: { workflowType, inputPayload } }),
  normalizeFHIR: (body) => request('/agents/fhir-normalize', { method: 'POST', body }),
  evaluateConsent: (body) => request('/agents/consent-evaluate', { method: 'POST', body }),
  triageEmergency: (body) => request('/agents/emergency-triage', { method: 'POST', body }),
  auditScan: (body = {}) => request('/agents/audit-scan', { method: 'POST', body }),
};
