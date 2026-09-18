/**
 * FindBack — Search & Filter Module (reports.html)
 */

let currentPage = 1;

document.addEventListener('DOMContentLoaded', () => {
  initSearchPage();
});

async function initSearchPage() {
  loadCategoriesForSearch();
  setupSearchEventListeners();

  // Read URL parameters if coming from landing page or direct link
  const params = new URLSearchParams(window.location.search);
  if (params.get('q')) document.getElementById('search-keyword').value = params.get('q');
  if (params.get('type')) document.getElementById('filter-type').value = params.get('type');
  if (params.get('category')) document.getElementById('filter-category').value = params.get('category');

  executeSearch(1);
}

async function loadCategoriesForSearch() {
  const catSelect = document.getElementById('filter-category');
  if (!catSelect) return;

  try {
    const res = await apiFetch('/categories');
    res.categories.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      catSelect.appendChild(opt);
    });
  } catch (e) { }
}

function setupSearchEventListeners() {
  const searchInput = document.getElementById('search-keyword');
  const typeFilter = document.getElementById('filter-type');
  const categoryFilter = document.getElementById('filter-category');
  const sortFilter = document.getElementById('sort-by');

  if (searchInput) {
    let debounceTimeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => executeSearch(1), 350);
    });
  }

  if (typeFilter) typeFilter.addEventListener('change', () => executeSearch(1));
  if (categoryFilter) categoryFilter.addEventListener('change', () => executeSearch(1));
  if (sortFilter) sortFilter.addEventListener('change', () => executeSearch(1));
}

async function executeSearch(page = 1) {
  currentPage = page;
  const container = document.getElementById('reports-grid');
  const paginationContainer = document.getElementById('pagination-wrap');
  const resultsCount = document.getElementById('results-count');

  if (!container) return;

  container.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 0;">
      <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 2.5rem; color: var(--primary);"></i>
      <p style="margin-top: 1rem; color: var(--text-muted);">Searching network reports...</p>
    </div>
  `;

  const q = document.getElementById('search-keyword')?.value.trim() || '';
  const type = document.getElementById('filter-type')?.value || '';
  const category_id = document.getElementById('filter-category')?.value || '';
  const sort_by = document.getElementById('sort-by')?.value || 'newest';

  const params = new URLSearchParams({
    page: page,
    per_page: 9,
    sort_by: sort_by
  });

  if (q) params.set('q', q);
  if (type) params.set('report_type', type);
  if (category_id) params.set('category_id', category_id);

  try {
    const res = await apiFetch(`/reports?${params.toString()}`);
    if (resultsCount) resultsCount.innerText = `${res.total} item${res.total === 1 ? '' : 's'} found`;

    if (res.reports.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon"><i class="fa-solid fa-magnifying-glass"></i></div>
          <h3 class="empty-title">No Reports Found</h3>
          <p class="empty-desc">We couldn't find any lost or found reports matching your criteria. Try adjusting your search keywords or distance filters.</p>
          <button class="btn btn-outline" onclick="clearAllFilters()">Reset All Filters</button>
        </div>
      `;
      if (paginationContainer) paginationContainer.innerHTML = '';
      return;
    }

    container.innerHTML = res.reports.map(report => renderReportCard(report)).join('');
    renderPagination(res.page, res.total_pages);
  } catch (err) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 0; color: var(--lost-red);">
        <i class="fa-solid fa-circle-exclamation" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
        <p>Unable to load reports: ${err.message}</p>
        <button class="btn btn-secondary btn-sm" onclick="executeSearch(1)" style="margin-top: 1rem;">Retry</button>
      </div>
    `;
  }
}

function renderReportCard(report) {
  const isFound = report.report_type === 'FOUND';
  const badgeClass = isFound ? 'badge-found' : 'badge-lost';
  const typeIcon = isFound ? 'fa-hand-holding-heart' : 'fa-circle-exclamation';
  const contactName = report.contact_name || report.reporter_name || 'Campus Member';
  const contactPhone = report.contact_phone || '9876543210';

  return `
    <div class="report-card">
      <div class="report-thumb">
        ${report.image_path ? `
          <img src="${report.image_path}" alt="${report.item_name}" loading="lazy" onerror="this.src='/img/placeholder.svg';">
        ` : `
          <div class="report-thumb-placeholder">
            <i class="fa-solid ${isFound ? 'fa-box-archive' : 'fa-box-open'}"></i>
          </div>
        `}
        <div class="report-badge-float">
          <span class="badge ${badgeClass}"><i class="fa-solid ${typeIcon}"></i> ${report.report_type} ITEM</span>
          ${report.is_sensitive ? `<span class="badge badge-sensitive" style="margin-left: 4px;"><i class="fa-solid fa-shield"></i> Protected</span>` : ''}
        </div>
        <div class="report-case-pill" style="background: rgba(15, 23, 42, 0.7);"><i class="fa-solid fa-graduation-cap"></i> Notice</div>
      </div>
      <div class="report-info">
        <h3 class="report-title">${report.item_name}</h3>
        <p class="report-desc">${report.description}</p>
        <div class="report-meta">
          <div class="report-meta-item">
            <i class="fa-solid fa-location-dot" style="color: var(--primary);"></i>
            <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${report.location_name}</span>
          </div>
          <div class="report-meta-item">
            <i class="fa-regular fa-calendar"></i>
            <span>${report.report_date} ${report.report_time ? '• ' + report.report_time : ''}</span>
          </div>
          <div class="report-meta-item justify-between" style="margin-top: 0.4rem;">
            <span>Category: <b>${report.category_name || 'General'}</b></span>
            ${getStatusBadge(report.status, report.report_type)}
          </div>
          <div class="report-meta-item justify-between" style="margin-top: 0.4rem; padding-top: 0.4rem; border-top: 1px dashed var(--border-color);">
            <span style="font-size: 0.8rem; color: var(--text-muted);"><i class="fa-regular fa-user"></i> ${contactName}</span>
            <span style="font-size: 0.85rem; font-weight: 700; color: var(--found-green);"><i class="fa-solid fa-phone"></i> ${contactPhone}</span>
          </div>
        </div>
        <div style="margin-top: 0.85rem; display: flex; gap: 0.5rem;">
          <a href="tel:${contactPhone}" class="btn btn-success btn-sm" style="flex: 1; text-align: center;"><i class="fa-solid fa-phone"></i> Call</a>
          <a href="report-details.html?id=${report.id}" class="btn btn-primary btn-sm" style="flex: 1; text-align: center;">View Details</a>
        </div>
      </div>
    </div>
  `;
}

function renderPagination(page, totalPages) {
  const container = document.getElementById('pagination-wrap');
  if (!container || totalPages <= 1) {
    if (container) container.innerHTML = '';
    return;
  }

  let html = `<div class="d-flex justify-center gap-1">`;
  if (page > 1) {
    html += `<button class="btn btn-secondary btn-sm" onclick="executeSearch(${page - 1})"><i class="fa-solid fa-chevron-left"></i> Prev</button>`;
  }

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      html += `<button class="btn ${i === page ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="executeSearch(${i})">${i}</button>`;
    } else if (i === page - 2 || i === page + 2) {
      html += `<span style="padding: 0.4rem 0.5rem; color: var(--text-dim);">...</span>`;
    }
  }

  if (page < totalPages) {
    html += `<button class="btn btn-secondary btn-sm" onclick="executeSearch(${page + 1})">Next <i class="fa-solid fa-chevron-right"></i></button>`;
  }
  html += `</div>`;

  container.innerHTML = html;
}

function clearAllFilters() {
  if (document.getElementById('search-keyword')) document.getElementById('search-keyword').value = '';
  if (document.getElementById('filter-type')) document.getElementById('filter-type').value = '';
  if (document.getElementById('filter-category')) document.getElementById('filter-category').value = '';
  executeSearch(1);
}
