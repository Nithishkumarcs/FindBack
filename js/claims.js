/**
 * FindBack — Verification, Ownership Claims & Handover Module
 */

async function openClaimModal(reportId, matchId = null) {
  if (!Auth.isLoggedIn()) {
    showToast('Please sign in to submit an ownership claim.', 'warning');
    setTimeout(() => {
      window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
    }, 800);
    return;
  }

  try {
    const res = await apiFetch(`/reports/${reportId}`);
    const report = res.report;

    let questionsHtml = '';
    if (report.verification_questions && report.verification_questions.length > 0) {
      questionsHtml = `
        <div style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.2); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1.25rem;">
          <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--primary);">
            <i class="fa-solid fa-shield-halved"></i> Ownership Verification Questions
          </h4>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem;">
            To ensure genuine recovery, the finder has asked the following questions. Your answers will be securely reviewed.
          </p>
          ${report.verification_questions.map((q, idx) => `
            <div class="form-group" style="margin-bottom: 0.85rem;">
              <label class="form-label" style="font-size: 0.825rem;">Q${idx + 1}: ${q.question}</label>
              <input type="text" class="form-control form-control-sm claim-q-answer" data-qid="q${idx + 1}" data-question="${q.question}" placeholder="Your answer..." required />
            </div>
          `).join('')}
        </div>
      `;
    } else {
      questionsHtml = `
        <div class="form-group">
          <label class="form-label">Identifying Details & Proof of Ownership</label>
          <textarea id="claim-general-proof" class="form-control" placeholder="Describe unique identifying marks, contents, serial numbers, or circumstances to verify you own this item." rows="3" required></textarea>
        </div>
      `;
    }

    const bodyHtml = `
      <div>
        <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.25rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color);">
          <div style="flex: 1;">
            <div style="font-weight: 700; font-size: 1.05rem;">Claiming: ${report.item_name}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">Case ID: ${report.case_id} • Location: ${report.location_name}</div>
          </div>
        </div>
        ${questionsHtml}
        <div style="font-size: 0.775rem; color: var(--text-dim);">
          <i class="fa-solid fa-lock"></i> All verification information is securely encrypted and only accessible to the authorized finder and network moderators.
        </div>
      </div>
    `;

    const footerButtons = `
      <button type="button" class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>
      <button type="button" class="btn btn-primary btn-sm" id="submit-claim-btn" onclick="submitClaim(${reportId}, ${matchId})">Submit Claim</button>
    `;

    openModal('Submit Ownership Claim', bodyHtml, footerButtons);
  } catch (err) {
    showToast('Failed to load item for claiming: ' + err.message, 'error');
  }
}

async function submitClaim(reportId, matchId) {
  const submitBtn = document.getElementById('submit-claim-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
  }

  const responses = {};
  const answerInputs = document.querySelectorAll('.claim-q-answer');
  if (answerInputs.length > 0) {
    let allFilled = true;
    answerInputs.forEach(input => {
      const val = input.value.trim();
      if (!val) allFilled = false;
      responses[input.dataset.qid] = {
        question: input.dataset.question,
        answer: val
      };
    });

    if (!allFilled) {
      showToast('Please answer all verification questions.', 'warning');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Claim';
      }
      return;
    }
  } else {
    const proofText = document.getElementById('claim-general-proof')?.value.trim();
    if (!proofText) {
      showToast('Please provide proof of ownership.', 'warning');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Claim';
      }
      return;
    }
    responses['general_proof'] = proofText;
  }

  try {
    const res = await apiFetch('/claims', {
      method: 'POST',
      body: JSON.stringify({
        report_id: reportId,
        match_id: matchId,
        verification_response: responses
      })
    });

    closeModal();
    showToast(res.message, 'success', 5000);
    setTimeout(() => {
      window.location.href = 'claims.html?claim_id=' + res.claim.id;
    }, 800);
  } catch (err) {
    showToast(err.message, 'error');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Submit Claim';
    }
  }
}

async function loadClaimsPage() {
  const submittedContainer = document.getElementById('submitted-claims-list');
  const receivedContainer = document.getElementById('received-claims-list');
  if (!submittedContainer) return;

  try {
    const res = await apiFetch('/claims?type=all');
    const user = Auth.getUser();

    const submitted = res.claims.filter(c => c.claimant_id === user.id);
    const received = res.claims.filter(c => c.finder_id === user.id);

    // Render Submitted
    if (submitted.length === 0) {
      submittedContainer.innerHTML = `<div class="text-muted" style="padding: 1.5rem; text-align: center;">No submitted claims yet.</div>`;
    } else {
      submittedContainer.innerHTML = submitted.map(c => renderClaimCard(c, false)).join('');
    }

    // Render Received
    if (receivedContainer) {
      if (received.length === 0) {
        receivedContainer.innerHTML = `<div class="text-muted" style="padding: 1.5rem; text-align: center;">No incoming claims for your found items yet.</div>`;
      } else {
        receivedContainer.innerHTML = received.map(c => renderClaimCard(c, true)).join('');
      }
    }
  } catch (err) {
    showToast('Failed to load claims: ' + err.message, 'error');
  }
}

function renderClaimCard(claim, isReceived) {
  return `
    <div class="card" style="margin-bottom: 1.25rem;">
      <div class="card-header">
        <div>
          <span style="font-weight: 700; font-size: 1rem;">${claim.item_name}</span>
          <span style="font-family: monospace; font-size: 0.8rem; color: var(--text-dim); margin-left: 0.5rem;">${claim.case_id}</span>
        </div>
        <div>${getStatusBadge(claim.status)}</div>
      </div>
      <div class="card-body">
        <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem;">
          ${isReceived ? `Submitted by: <b>${claim.claimant_name}</b>` : `Finder: <b>${claim.finder_name}</b>`} • Submitted on ${new Date(claim.created_at).toLocaleDateString()}
        </div>

        ${claim.verification_response ? `
          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 0.75rem; margin-bottom: 1rem; font-size: 0.85rem;">
            <strong style="color: var(--primary);">Verification Answers:</strong>
            <pre style="white-space: pre-wrap; font-family: inherit; margin-top: 0.35rem; color: var(--text-main); font-size: 0.825rem;">${JSON.stringify(claim.verification_response, null, 2)}</pre>
          </div>
        ` : ''}

        ${claim.review_notes ? `
          <div style="background: rgba(59, 130, 246, 0.05); border-left: 3px solid var(--primary); padding: 0.5rem 0.75rem; margin-bottom: 1rem; font-size: 0.85rem;">
            <b>Reviewer Notes:</b> ${claim.review_notes}
          </div>
        ` : ''}

        <!-- Handover Details if Approved -->
        ${claim.status === 'APPROVED' ? `
          <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1rem;">
            <h5 style="color: var(--found-green); margin-bottom: 0.5rem;"><i class="fa-solid fa-handshake"></i> Recovery & Handover Coordination</h5>
            <div style="font-size: 0.875rem; margin-bottom: 0.5rem;">
              Meeting Spot: <b>${claim.handover_location || 'Not set yet (coordinate below)'}</b>
            </div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.75rem;">
              <button class="btn btn-secondary btn-sm" onclick="openHandoverModal(${claim.id}, '${claim.handover_location || ''}')">Update Meeting Spot</button>
              ${(!isReceived && !claim.confirmed_by_claimant) ? `
                <button class="btn btn-success btn-sm" onclick="confirmRecovery(${claim.id})"><i class="fa-solid fa-check"></i> I Received My Item</button>
              ` : ''}
              ${(isReceived && !claim.confirmed_by_finder) ? `
                <button class="btn btn-success btn-sm" onclick="confirmRecovery(${claim.id})"><i class="fa-solid fa-check"></i> I Handed Over Item</button>
              ` : ''}
              ${(claim.confirmed_by_claimant || claim.confirmed_by_finder) ? `
                <span class="badge badge-pending" style="align-self: center;">
                  ${claim.confirmed_by_claimant ? 'Claimant Confirmed' : 'Finder Confirmed'} (Awaiting counter-party)
                </span>
              ` : ''}
            </div>
          </div>
        ` : ''}

        ${claim.status === 'COMPLETED' ? `
          <div style="background: rgba(20, 184, 166, 0.1); border: 1px solid rgba(20, 184, 166, 0.3); padding: 0.75rem 1rem; border-radius: var(--radius-md); color: var(--recovered-teal); font-weight: 600; font-size: 0.875rem;">
            <i class="fa-solid fa-circle-check"></i> Successfully Recovered & Case Closed on ${new Date(claim.completed_at || claim.updated_at).toLocaleDateString()}
          </div>
        ` : ''}
      </div>

      <!-- Action Footer for Finder or Admin -->
      ${(isReceived && claim.status === 'PENDING') ? `
        <div class="card-footer d-flex gap-2">
          <button class="btn btn-success btn-sm" onclick="updateClaimDecision(${claim.id}, 'APPROVED')"><i class="fa-solid fa-check"></i> Approve Claim</button>
          <button class="btn btn-secondary btn-sm" onclick="updateClaimDecision(${claim.id}, 'NEEDS_MORE_INFO')"><i class="fa-solid fa-circle-question"></i> Request More Info</button>
          <button class="btn btn-danger btn-sm" onclick="updateClaimDecision(${claim.id}, 'REJECTED')"><i class="fa-solid fa-xmark"></i> Reject</button>
        </div>
      ` : ''}
    </div>
  `;
}

async function updateClaimDecision(claimId, decision) {
  const notes = prompt(`Enter optional review notes for ${decision}:`) || '';
  try {
    const res = await apiFetch(`/claims/${claimId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: decision, review_notes: notes })
    });
    showToast(res.message, 'success');
    loadClaimsPage();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openHandoverModal(claimId, currentLocation) {
  const bodyHtml = `
    <div class="form-group">
      <label class="form-label">Safe Meeting Location</label>
      <input type="text" id="handover-loc-input" class="form-control" value="${currentLocation}" placeholder="e.g. Main Campus Security Information Desk, 2nd Floor" required />
      <div class="form-text">We strongly advise meeting in a public facility, campus information desk, or designated security zone.</div>
    </div>
  `;
  const footerButtons = `
    <button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary btn-sm" onclick="saveHandover(${claimId})">Save Location</button>
  `;
  openModal('Coordinate Recovery Meeting', bodyHtml, footerButtons);
}

async function saveHandover(claimId) {
  const location = document.getElementById('handover-loc-input')?.value.trim();
  if (!location) return;

  try {
    await apiFetch(`/claims/${claimId}/handover`, {
      method: 'PUT',
      body: JSON.stringify({ handover_location: location })
    });
    closeModal();
    showToast('Handover meeting location updated.', 'success');
    loadClaimsPage();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function confirmRecovery(claimId) {
  if (!confirm('Are you sure you want to confirm that this item was returned safely?')) return;

  try {
    const res = await apiFetch(`/claims/${claimId}/confirm-handover`, { method: 'POST' });
    showToast(res.message, 'success', 5000);
    loadClaimsPage();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
