const API_BASE = '/api';

export async function request(path, options = {}) {
  const currentRole = options.role || options.headers?.['x-demo-role'] || localStorage.getItem('medralink_demo_role') || 'Patient';
  
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

  let data;
  try {
    data = await response.json();
  } catch {
    data = { reason: response.statusText || 'API request failed' };
  }

  if (!response.ok) {
    const errorMsg = data?.issue?.[0]?.diagnostics || data?.reason || data?.message || `HTTP ${response.status} Error`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const api = {
  // Health & Network
  getHealth: (options) => request('/health', options),
  getNetworkStatus: (options) => request('/status', options),
  bootstrapDemo: (options) => request('/demo/bootstrap', { method: 'POST', ...options }),

  // Patients
  getSyntheticPatients: (options) => request('/patients/synthetic', options),
  registerPatient: (body, options) => request('/patients/register', { method: 'POST', body, ...options }),
  getPatient: (patientRefHash, options) => request(`/patients/${patientRefHash}`, options),

  // Providers
  registerProvider: (body, options) => request('/providers/register', { method: 'POST', body, ...options }),

  // Records
  createRecord: (body, options) => request('/records', { method: 'POST', body, ...options }),
  getRecord: (id, params = {}, options = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/records/${id}${query ? `?${query}` : ''}`, options);
  },
  getPatientRecords: (patientRefHash, options) => request(`/records/patient/${patientRefHash}`, options),

  // Consents
  grantConsent: (body, options) => request('/consents', { method: 'POST', body, ...options }),
  revokeConsent: (consentId, patientRefHash, options) =>
    request(`/consents/${consentId}`, { method: 'DELETE', body: { patientRefHash }, ...options }),
  getPatientConsents: (patientRefHash, options) => request(`/consents/patient/${patientRefHash}`, options),

  // Access Verification
  requestAccess: (body, options) => request('/access/request', { method: 'POST', body, ...options }),

  // Emergency Break-Glass
  invokeEmergency: (body, options) => request('/emergency/invoke', { method: 'POST', body, ...options }),
  reviewEmergency: (body, options) => request('/emergency/review', { method: 'POST', body, ...options }),
  getAllEmergencyEvents: (options) => request('/emergency/all', options),

  // Audit Trail & Blocks
  getAuditHistory: (patientRefHash, options) => request(`/audit/${patientRefHash}`, options),
  getBlocks: (options) => request('/audit/blocks/all', options),

  // Agentic AI Multi-Agent Engine
  getAgentStatus: () => request('/agents/status'),
  getOntology: () => request('/agents/ontology'),
  orchestrateDAG: (workflowType, inputPayload) =>
    request('/agents/orchestrate', { method: 'POST', body: { workflowType, inputPayload } }),
  normalizeFHIR: (body) => request('/agents/fhir-normalize', { method: 'POST', body }),
  evaluateConsent: (body) => request('/agents/consent-evaluate', { method: 'POST', body }),
  triageEmergency: (body) => request('/agents/emergency-triage', { method: 'POST', body }),
  auditScan: (body = {}) => request('/agents/audit-scan', { method: 'POST', body }),

  // Real-time Event Stream (SSE)
  subscribeEvents: (onEvent, onError) => {
    const eventSource = new EventSource('/api/events');
    eventSource.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        if (onEvent) onEvent(parsed);
      } catch (err) {
        console.error('[SSE Parse Error]:', err);
      }
    };
    eventSource.onerror = (err) => {
      if (onError) onError(err);
    };
    return () => eventSource.close();
  },
};
