/**
 * FindBack — Reports Management (Report Lost & Report Found forms)
 */

document.addEventListener('DOMContentLoaded', () => {
  loadCategories();
  setupReportForms();
  setupDuplicateDetection();
});

async function loadCategories() {
  const selectEls = document.querySelectorAll('.category-select');
  if (selectEls.length === 0) return;

  try {
    const res = await apiFetch('/categories');
    selectEls.forEach(select => {
      select.innerHTML = '<option value="">Select a Category...</option>';
      res.categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.name;
        select.appendChild(opt);
      });
    });
  } catch (err) {
    console.error('Failed to load categories:', err);
  }
}

function setupDuplicateDetection() {
  const itemNameInput = document.getElementById('item_name');
  const dateInput = document.getElementById('report_date') || document.getElementById('lost_date') || document.getElementById('found_date');
  const categorySelect = document.getElementById('category_id');
  const dupBanner = document.getElementById('duplicate-warning');

  if (!itemNameInput || !dupBanner) return;

  const triggerCheck = async () => {
    const itemName = itemNameInput.value.trim();
    const dateVal = dateInput ? dateInput.value : '';
    const catVal = categorySelect ? categorySelect.value : '';
    const reportType = document.getElementById('report_type') ? document.getElementById('report_type').value : (window.location.pathname.includes('lost') ? 'LOST' : 'FOUND');

    if (itemName.length < 4 || !dateVal || !catVal) {
      dupBanner.style.display = 'none';
      return;
    }

    try {
      const res = await apiFetch('/reports/check-duplicate', {
        method: 'POST',
        body: JSON.stringify({
          item_name: itemName,
          report_date: dateVal,
          category_id: catVal,
          report_type: reportType,
          location_name: document.getElementById('location_name')?.value || '',
          latitude: document.getElementById('latitude')?.value || null,
          longitude: document.getElementById('longitude')?.value || null
        })
      });

      if (res.is_duplicate) {
        dupBanner.innerHTML = `
          <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.4); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1.5rem; display: flex; align-items: flex-start; gap: 0.75rem;">
            <i class="fa-solid fa-triangle-exclamation" style="color: var(--pending-amber); font-size: 1.2rem; margin-top: 2px;"></i>
            <div>
              <strong style="color: var(--pending-amber);">Potential Duplicate Detected</strong>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0.25rem 0 0.5rem;">${res.message}</p>
              ${res.existing_case_id ? `<a href="report-details.html?id=${res.existing_report_id}" target="_blank" class="btn btn-outline btn-sm">View Existing Report (${res.existing_case_id})</a>` : ''}
            </div>
          </div>
        `;
        dupBanner.style.display = 'block';
      } else {
        dupBanner.style.display = 'none';
      }
    } catch (e) {
      dupBanner.style.display = 'none';
    }
  };

  itemNameInput.addEventListener('blur', triggerCheck);
  if (dateInput) dateInput.addEventListener('change', triggerCheck);
  if (categorySelect) categorySelect.addEventListener('change', triggerCheck);
}

function setupReportForms() {
  // Lost Item Form
  const lostForm = document.getElementById('report-lost-form');
  if (lostForm) {
    lostForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await submitReport(lostForm, '/reports/lost');
    });
  }

  // Found Item Form
  const foundForm = document.getElementById('report-found-form');
  if (foundForm) {
    foundForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await submitReport(foundForm, '/reports/found');
    });
  }
}

async function submitReport(formElement, endpoint) {
  const submitBtn = formElement.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Posting Notice...';

  try {
    const formData = new FormData(formElement);
    const res = await apiFetch(endpoint, {
      method: 'POST',
      body: formData
    });

    showToast('Item posted successfully to Campus Notice Board!', 'success', 4000);

    setTimeout(() => {
      window.location.href = `report-details.html?id=${res.report.id}`;
    }, 800);
  } catch (err) {
    showToast(err.message, 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}
