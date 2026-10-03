const API_BASE = `${(import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "")}/api`;
const API_KEY = import.meta.env.VITE_API_KEY || "";

async function request(url, options = {}) {
  const headers = new Headers(options.headers || {});
  if (API_KEY) headers.set("X-API-Key", API_KEY);
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      // Preserve the HTTP status when the server does not return JSON.
    }
    throw new Error(detail);
  }
  return res.json();
}

export async function fetchHealth() {
  return request(`${API_BASE}/health`);
}

export async function fetchMetrics() {
  return request(`${API_BASE}/metrics`);
}

export async function fetchStreamHistory(limit = 40) {
  return request(`${API_BASE}/stream/history?limit=${limit}`);
}

export async function fetchNextTransaction(scenario = null) {
  const url = scenario 
    ? `${API_BASE}/stream/next?scenario=${encodeURIComponent(scenario)}`
    : `${API_BASE}/stream/next`;
  return request(url);
}

export async function evaluateCustomTransaction(payload) {
  return request(`${API_BASE}/transactions/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function fetchBlockchain() {
  return request(`${API_BASE}/blockchain/chain`);
}

export async function verifyBlockchain() {
  return request(`${API_BASE}/blockchain/verify`);
}

export async function tamperBlockchain(blockIndex, newAmount = 999999.0) {
  return request(`${API_BASE}/blockchain/tamper`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ block_index: blockIndex, new_amount: newAmount }),
  });
}

export async function resetBlockchain() {
  return request(`${API_BASE}/blockchain/reset`, {
    method: "POST",
  });
}

export async function fetchCommunityReports() {
  return request(`${API_BASE}/community/reports`);
}

export async function submitCommunityReport(reportData) {
  return request(`${API_BASE}/community/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reportData),
  });
}

export async function voteCommunityReport(reportId, isUpvote = true) {
  return request(`${API_BASE}/community/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ report_id: reportId, is_upvote: isUpvote }),
  });
}

export async function fetchComplianceAudit() {
  return request(`${API_BASE}/compliance/audit`);
}

export async function fetchHeatmapData() {
  return request(`${API_BASE}/analytics/heatmap`);
}
