/**
 * FindBack — Admin Management, Analytics & Audit Logging Module
 */

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.isAdmin()) {
    showToast('Administrator privileges required.', 'error');
    setTimeout(() => {
      window.location.href = '../login.html';
    }, 800);
    return;
  }

  // Identify current admin view
  if (document.getElementById('admin-stats-grid')) loadAdminDashboard();
  if (document.getElementById('admin-users-table')) loadAdminUsers();
  if (document.getElementById('admin-reports-table')) loadAdminReports();
  if (document.getElementById('admin-abuse-table')) loadAdminAbuseReports();
  if (document.getElementById('admin-audit-table')) loadAdminAuditLogs();
});

async function loadAdminDashboard() {
  try {
    const res = await apiFetch('/admin/dashboard');
    const m = res.metrics;

    document.getElementById('stat-total-users').innerText = m.total_users;
    document.getElementById('stat-total-lost').innerText = m.total_lost;
    document.getElementById('stat-total-found').innerText = m.total_found;
    document.getElementById('stat-potential-matches').innerText = m.potential_matches;
    document.getElementById('stat-pending-claims').innerText = m.pending_claims;
    document.getElementById('stat-recovered-items').innerText = m.recovered_items;
    document.getElementById('stat-recovery-rate').innerText = `${m.recovery_rate}%`;
    document.getElementById('stat-avg-time').innerText = `${m.avg_recovery_hours} hrs`;
    document.getElementById('stat-reported-abuse').innerText = m.reported_abuse;

    // Render top categories
    const catContainer = document.getElementById('top-categories-list');
    if (catContainer && m.top_categories) {
      catContainer.innerHTML = m.top_categories.map(c => `
        <div style="display: flex; justify-content: space-between; padding: 0.6rem 0; border-bottom: 1px solid var(--border-color); font-size: 0.9rem;">
          <span>${c.name}</span>
          <b>${c.count} reports</b>
        </div>
      `).join('');
    }

    // Load Heatmap
    loadAdminHeatmap();
  } catch (err) {
    showToast('Failed to load admin metrics: ' + err.message, 'error');
  }
}

async function loadAdminHeatmap() {
  const container = document.getElementById('campus-hotspots-container');
  if (!container) return;

  try {
    const res = await apiFetch('/reports?per_page=100');
    const reports = res.reports || [];

    const locationCounts = {};
    reports.forEach(r => {
      const loc = (r.location_name || 'General Campus').trim();
      if (!locationCounts[loc]) {
        locationCounts[loc] = { total: 0, lost: 0, found: 0, recovered: 0 };
      }
      locationCounts[loc].total++;
      if (r.status === 'RECOVERED') locationCounts[loc].recovered++;
      else if (r.report_type === 'LOST') locationCounts[loc].lost++;
      else if (r.report_type === 'FOUND') locationCounts[loc].found++;
    });

    const sortedLocations = Object.entries(locationCounts)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 6);

    if (sortedLocations.length === 0) {
      container.innerHTML = `<div class="text-center text-muted" style="padding: 2rem 0;">No campus location reports registered yet.</div>`;
      return;
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${sortedLocations.map(([loc, stats], idx) => {
          const percent = Math.max(15, Math.min(100, Math.round((stats.total / (reports.length || 1)) * 100)));
          return `
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                <span style="font-weight: 600; font-size: 0.92rem; display: flex; align-items: center; gap: 8px;">
                  <span style="display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 6px; background: rgba(59, 130, 246, 0.15); color: var(--primary); font-size: 0.75rem; font-weight: 700;">#${idx + 1}</span>
                  ${loc}
                </span>
                <div style="display: flex; gap: 6px; align-items: center;">
                  <span class="badge badge-lost" style="font-size: 0.75rem; padding: 2px 8px;">${stats.lost} Lost</span>
                  <span class="badge badge-found" style="font-size: 0.75rem; padding: 2px 8px;">${stats.found} Found</span>
                  ${stats.recovered > 0 ? `<span class="badge badge-recovered" style="font-size: 0.75rem; padding: 2px 8px;">${stats.recovered} Recovered</span>` : ''}
                  <span style="font-weight: 700; font-size: 0.85rem; margin-left: 4px;">${stats.total} total</span>
                </div>
              </div>
              <div style="width: 100%; height: 6px; background: rgba(255, 255, 255, 0.08); border-radius: 3px; overflow: hidden;">
                <div style="width: ${percent}%; height: 100%; background: linear-gradient(90deg, var(--primary), var(--accent-cyan)); border-radius: 3px;"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } catch (err) {
    console.error('Heatmap/Hotspot error:', err);
    container.innerHTML = `<div class="text-danger text-center" style="padding: 1rem 0;">Unable to load hotspots: ${err.message}</div>`;
  }
}

async function loadAdminUsers() {
  const tableBody = document.querySelector('#admin-users-table tbody');
  if (!tableBody) return;

  try {
    const searchVal = document.getElementById('user-search-input')?.value || '';
    const res = await apiFetch(`/admin/users?q=${encodeURIComponent(searchVal)}`);

    if (res.users.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding: 2rem;">No users found.</td></tr>`;
      return;
    }

    tableBody.innerHTML = res.users.map(u => `
      <tr>
        <td><b>${u.id}</b></td>
        <td>
          <div style="font-weight: 600;">${u.name}</div>
          <div style="font-size: 0.775rem; color: var(--text-dim);">${u.email}</div>
        </td>
        <td><span class="badge ${u.role === 'ADMIN' ? 'badge-sensitive' : 'badge-found'}">${u.role}</span></td>
        <td>
          <span class="badge ${u.status === 'ACTIVE' ? 'badge-found' : 'badge-lost'}">${u.status}</span>
        </td>
        <td>${u.reports_count || 0}</td>
        <td>${new Date(u.created_at).toLocaleDateString()}</td>
        <td>
          ${u.role !== 'ADMIN' ? `
            <button class="btn btn-sm ${u.status === 'ACTIVE' ? 'btn-danger' : 'btn-success'}" onclick="toggleUserStatus(${u.id}, '${u.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE'}')">
              ${u.status === 'ACTIVE' ? '<i class="fa-solid fa-ban"></i> Block' : '<i class="fa-solid fa-unlock"></i> Unblock'}
            </button>
          ` : '<span class="text-dim text-xs">Protected</span>'}
        </td>
      </tr>
    `).join('');
  } catch (err) {
    showToast('Failed to load users: ' + err.message, 'error');
  }
}

async function toggleUserStatus(userId, targetStatus) {
  if (!confirm(`Are you sure you want to change this user status to ${targetStatus}?`)) return;

  try {
    const res = await apiFetch(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: targetStatus })
    });
    showToast(res.message, 'success');
    loadAdminUsers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadAdminReports() {
  const tableBody = document.querySelector('#admin-reports-table tbody');
  if (!tableBody) return;

  try {
    const res = await apiFetch('/admin/reports');
    tableBody.innerHTML = res.reports.map(r => `
      <tr>
        <td style="font-family: monospace; font-size: 0.8rem;">${r.case_id}</td>
        <td><b>${r.item_name}</b></td>
        <td><span class="badge ${r.report_type === 'LOST' ? 'badge-lost' : 'badge-found'}">${r.report_type}</span></td>
        <td>${r.category_name || 'General'}</td>
        <td>${r.location_name}</td>
        <td>${getStatusBadge(r.status, r.report_type)}</td>
        <td>
          <a href="../report-details.html?id=${r.id}" target="_blank" class="btn btn-outline btn-sm"><i class="fa-solid fa-eye"></i></a>
          <button class="btn btn-danger btn-sm" onclick="adminDeleteReport(${r.id}, '${r.case_id}')"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    showToast('Failed to load reports: ' + err.message, 'error');
  }
}

async function adminDeleteReport(reportId, caseId) {
  if (!confirm(`Are you sure you want to permanently delete report ${caseId}? This action cannot be undone.`)) return;

  try {
    const res = await apiFetch(`/admin/reports/${reportId}`, { method: 'DELETE' });
    showToast(res.message, 'success');
    loadAdminReports();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadAdminAbuseReports() {
  const tableBody = document.querySelector('#admin-abuse-table tbody');
  if (!tableBody) return;

  try {
    const res = await apiFetch('/admin/abuse-reports');
    if (res.abuse_reports.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding: 2rem;">No abuse reports filed.</td></tr>`;
      return;
    }

    tableBody.innerHTML = res.abuse_reports.map(a => `
      <tr>
        <td><b>#${a.id}</b></td>
        <td>${a.reported_case_id ? `<a href="../report-details.html?id=${a.report_id}" target="_blank"><b>${a.reported_case_id}</b> (${a.reported_item_name})</a>` : 'Deleted'}</td>
        <td><span class="badge badge-lost">${a.reason}</span></td>
        <td style="max-width: 250px; font-size: 0.85rem;">${a.description}</td>
        <td><span class="badge ${a.status === 'PENDING' ? 'badge-pending' : 'badge-found'}">${a.status}</span></td>
        <td>
          ${a.status === 'PENDING' ? `
            <button class="btn btn-success btn-sm" onclick="updateAbuseStatus(${a.id}, 'REVIEWED')">Resolved</button>
            <button class="btn btn-secondary btn-sm" onclick="updateAbuseStatus(${a.id}, 'DISMISSED')">Dismiss</button>
          ` : '<span class="text-dim text-xs">Reviewed</span>'}
        </td>
      </tr>
    `).join('');
  } catch (err) {
    showToast('Failed to load abuse reports: ' + err.message, 'error');
  }
}

async function updateAbuseStatus(abuseId, status) {
  try {
    const res = await apiFetch(`/admin/abuse-reports/${abuseId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    showToast(res.message, 'success');
    loadAdminAbuseReports();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadAdminAuditLogs() {
  const tableBody = document.querySelector('#admin-audit-table tbody');
  if (!tableBody) return;

  try {
    const res = await apiFetch('/admin/audit-logs');
    tableBody.innerHTML = res.logs.map(l => `
      <tr>
        <td style="font-size: 0.8rem; color: var(--text-dim);">${new Date(l.created_at).toLocaleString()}</td>
        <td><b>${l.user_email || 'System'}</b></td>
        <td><span class="badge" style="background: rgba(255,255,255,0.06);">${l.action}</span></td>
        <td>${l.entity_type} #${l.entity_id || '-'}</td>
        <td style="font-family: monospace; font-size: 0.775rem; max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${JSON.stringify(l.metadata)}
        </td>
      </tr>
    `).join('');
  } catch (err) {
    showToast('Failed to load audit trail: ' + err.message, 'error');
  }
}
