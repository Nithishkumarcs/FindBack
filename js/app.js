/**
 * FindBack — Simple, Clean & Modern Lost & Found Application
 * Zero dependencies, pure vanilla JS with LocalStorage persistence.
 */

// No hardcoded demo items — purely real user reports only
const DEFAULT_ITEMS = [];
const DEMO_IDS = new Set(['fb-101', 'fb-102', 'fb-103', 'fb-104', 'fb-105', 'fb-106']);

// App State
const state = {
  items: [],
  currentTab: 'ALL',      // ALL, LOST, FOUND, MATCHES
  selectedCategory: 'ALL', // ALL, Phone, Wallet, Keys, Bags, Electronics, Documents, Other
  searchQuery: '',
  formType: 'LOST',
  uploadedImageData: null
};

// Storage Key (Clean V3 Storage)
const STORAGE_KEY = 'findback_simple_items_v3';

// Clean purge of previous test data so notice board starts completely fresh
try {
  if (localStorage.getItem('findback_simple_items_v2')) {
    localStorage.removeItem('findback_simple_items_v2');
  }
  if (localStorage.getItem('findback_simple_items')) {
    localStorage.removeItem('findback_simple_items');
  }
} catch (e) {}

// Category Icons Mapping
const CATEGORY_ICONS = {
  'Wallet': 'fa-wallet',
  'Phone': 'fa-mobile-screen',
  'Keys': 'fa-key',
  'Bag': 'fa-bag-shopping',
  'Laptop': 'fa-laptop',
  'Electronics': 'fa-headphones',
  'Documents': 'fa-id-card',
  'Other': 'fa-box-open'
};

// Initialize App
function initApp() {
  loadItems();
  setupEventListeners();
  renderApp();
  checkInstantMatchesBanner();
}

// Load items from localStorage — starting with a fresh clean feed
function loadItems() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      state.items = Array.isArray(parsed) ? parsed.filter(item => !DEMO_IDS.has(item.id)) : [];
      saveItems();
    } catch (e) {
      state.items = [];
    }
  } else {
    state.items = [];
    saveItems();
  }
}

// Save items
function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
}

// Detect matches between Lost and Found items
function findMatches(item) {
  if (!item || item.status === 'REUNITED') return [];
  const oppositeType = item.type === 'LOST' ? 'FOUND' : 'LOST';
  const itemWords = item.title.toLowerCase().split(/\W+/).filter(w => w.length > 2);

  return state.items.filter(other => {
    if (other.id === item.id || other.type !== oppositeType || other.status === 'REUNITED') {
      return false;
    }
    // Category match
    const catMatch = other.category.toLowerCase() === item.category.toLowerCase();
    
    // Keyword match
    const otherText = (other.title + ' ' + other.description).toLowerCase();
    const wordOverlap = itemWords.some(w => otherText.includes(w));
    
    return catMatch && wordOverlap;
  });
}

// Count total smart matches across all active items
function getTotalMatchCount() {
  const matchPairs = new Set();
  const lostItems = state.items.filter(i => i.type === 'LOST' && i.status === 'ACTIVE');
  
  lostItems.forEach(lost => {
    const matches = findMatches(lost);
    if (matches.length > 0) {
      matchPairs.add(lost.id);
      matches.forEach(m => matchPairs.add(m.id));
    }
  });
  return matchPairs.size;
}

// Filter items
function getFilteredItems() {
  return state.items.filter(item => {
    // Tab filter
    if (state.currentTab === 'LOST' && item.type !== 'LOST') return false;
    if (state.currentTab === 'FOUND' && item.type !== 'FOUND') return false;
    if (state.currentTab === 'MATCHES') {
      const matches = findMatches(item);
      if (matches.length === 0) return false;
    }

    // Category filter
    if (state.selectedCategory !== 'ALL' && item.category !== state.selectedCategory) {
      return false;
    }

    // Search query filter
    if (state.searchQuery.trim() !== '') {
      const q = state.searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchLoc = item.location.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLoc && !matchCat) return false;
    }

    return true;
  });
}

// Render entire UI
function renderApp() {
  updateStats();
  renderGrid();
}

// Update Top Counters
function updateStats() {
  const lostCount = state.items.filter(i => i.type === 'LOST' && i.status === 'ACTIVE').length;
  const foundCount = state.items.filter(i => i.type === 'FOUND' && i.status === 'ACTIVE').length;
  const reunitedCount = state.items.filter(i => i.status === 'REUNITED').length;
  const matchCount = getTotalMatchCount();

  document.getElementById('stat-lost').textContent = lostCount;
  document.getElementById('stat-found').textContent = foundCount;
  document.getElementById('stat-reunited').textContent = reunitedCount;

  document.getElementById('badge-tab-all').textContent = state.items.length;
  document.getElementById('badge-tab-lost').textContent = lostCount;
  document.getElementById('badge-tab-found').textContent = foundCount;
  document.getElementById('badge-tab-matches').textContent = matchCount;

  // Toggle Clear All button visibility
  const clearBtn = document.getElementById('btn-clear-feed');
  if (clearBtn) {
    clearBtn.style.display = state.items.length > 0 ? 'inline-flex' : 'none';
  }
}

// Check Banner for top smart match
function checkInstantMatchesBanner() {
  const banner = document.getElementById('match-alert-banner');
  const bannerText = document.getElementById('match-alert-text');
  const matchCount = getTotalMatchCount();

  if (matchCount > 0) {
    banner.style.display = 'flex';
    bannerText.innerHTML = `<strong>✨ Smart Matching Detected ${matchCount} potential items!</strong> Someone may have already reported what you are looking for.`;
  } else {
    banner.style.display = 'none';
  }
}

// Render Cards Grid
function renderGrid() {
  const grid = document.getElementById('items-grid');
  const filtered = getFilteredItems();

  if (filtered.length === 0) {
    if (state.items.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i class="fa-solid fa-clipboard-check"></i></div>
          <div class="empty-title">Notice Board is Clean</div>
          <div class="empty-desc">There are currently no active lost or found reports. Only real items reported by users will appear here.</div>
          <div style="display: flex; justify-content: center; gap: 12px; margin-top: 18px; flex-wrap: wrap;">
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('btn-report-lost').click()">
              <i class="fa-solid fa-circle-exclamation" style="color: var(--lost-color);"></i> Report Lost Item
            </button>
            <button class="btn btn-primary btn-sm" onclick="document.getElementById('btn-report-found').click()">
              <i class="fa-solid fa-hand-holding-heart"></i> Report Found Item
            </button>
          </div>
        </div>
      `;
    } else {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i class="fa-solid fa-filter-circle-xmark"></i></div>
          <div class="empty-title">No matching items found</div>
          <div class="empty-desc">No records match your current filter or search criteria. Try clearing the search keyword or category filter.</div>
          <button class="btn btn-secondary btn-sm" style="margin-top: 12px;" onclick="resetFilters()">Clear Filters</button>
        </div>
      `;
    }
    return;
  }

  grid.innerHTML = filtered.map(item => {
    const isReunited = item.status === 'REUNITED';
    const badgeClass = isReunited ? 'badge-reunited' : (item.type === 'LOST' ? 'badge-lost' : 'badge-found');
    const badgeLabel = isReunited ? 'Reunited' : item.type;
    const matches = findMatches(item);
    const hasMatch = matches.length > 0 && !isReunited;
    const catIcon = CATEGORY_ICONS[item.category] || 'fa-box-open';

    const imageHtml = item.image ? 
      `<img src="${item.image}" alt="${escapeHtml(item.title)}" class="item-img" loading="lazy" onerror="this.parentElement.innerHTML='<i class=\\'fa-solid ${catIcon} item-icon-fallback\\'></i>'"/>` :
      `<i class="fa-solid ${catIcon} item-icon-fallback"></i>`;

    const matchBadgeHtml = hasMatch ?
      `<div class="badge-match" title="${matches.length} potential match found!"><i class="fa-solid fa-sparkles"></i> Match Found (${matches.length})</div>` : '';

    return `
      <div class="item-card" data-id="${item.id}">
        <div class="item-img-wrap">
          <span class="badge ${badgeClass}">${badgeLabel}</span>
          ${matchBadgeHtml}
          ${imageHtml}
        </div>
        <div class="item-content">
          <div class="item-category"><i class="fa-solid ${catIcon}"></i> ${escapeHtml(item.category)}</div>
          <h3 class="item-title">${escapeHtml(item.title)}</h3>
          <p class="item-desc">${escapeHtml(item.description)}</p>
          
          <div class="item-meta">
            <div class="meta-row">
              <i class="fa-solid fa-location-dot"></i>
              <span>${escapeHtml(item.location)}</span>
            </div>
            <div class="meta-row">
              <i class="fa-regular fa-calendar"></i>
              <span>${formatDate(item.date)}</span>
            </div>
          </div>

          <div class="item-footer">
            <button class="btn btn-primary btn-sm btn-block" onclick="openItemDetails('${item.id}')">
              <i class="fa-solid fa-eye"></i> View Details & Contact
            </button>
            ${!isReunited ? `
              <button class="btn btn-secondary btn-sm" title="Mark as Reunited" onclick="markReunited('${item.id}', event)">
                <i class="fa-solid fa-check"></i>
              </button>
            ` : ''}
            <button class="btn btn-secondary btn-sm" title="Delete Listing" onclick="deleteItem('${item.id}', event)">
              <i class="fa-solid fa-trash-can" style="color: var(--lost-color);"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Reset all search and category filters
function resetFilters() {
  state.searchQuery = '';
  state.selectedCategory = 'ALL';
  state.currentTab = 'ALL';
  document.getElementById('search-input').value = '';
  
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  document.querySelector('.pill[data-cat="ALL"]').classList.add('active');

  document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
  document.querySelector('.tab-btn[data-tab="ALL"]').classList.add('active');

  renderApp();
}

// Open Item Details Modal
function openItemDetails(id) {
  const item = state.items.find(i => i.id === id);
  if (!item) return;

  const matches = findMatches(item);
  const isReunited = item.status === 'REUNITED';
  const catIcon = CATEGORY_ICONS[item.category] || 'fa-box-open';

  const modalBody = document.getElementById('details-modal-body');
  modalBody.innerHTML = `
    <div style="margin-bottom: 16px;">
      <span class="badge ${isReunited ? 'badge-reunited' : (item.type === 'LOST' ? 'badge-lost' : 'badge-found')}" style="position: static; margin-bottom: 8px; display: inline-block;">
        ${isReunited ? 'Reunited / Resolved' : item.type + ' ITEM'}
      </span>
      <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 6px;">${escapeHtml(item.title)}</h2>
      <div style="font-size: 13px; color: var(--text-muted);">
        <i class="fa-solid ${catIcon}"></i> Category: <strong>${escapeHtml(item.category)}</strong> &bull; Date: <strong>${formatDate(item.date)}</strong>
      </div>
    </div>

    ${item.image ? `
      <div style="border-radius: var(--radius-md); overflow: hidden; max-height: 220px; margin-bottom: 16px; background: #f1f5f9;">
        <img src="${item.image}" alt="${escapeHtml(item.title)}" style="width: 100%; height: 100%; object-fit: cover; max-height: 220px;"/>
      </div>
    ` : ''}

    <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px; margin-bottom: 16px;">
      <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">
        <i class="fa-solid fa-location-dot" style="color: var(--primary);"></i> Location Details
      </div>
      <div style="font-weight: 600; font-size: 14px; color: var(--text-main);">${escapeHtml(item.location)}</div>
    </div>

    <div style="margin-bottom: 20px;">
      <div style="font-size: 13px; font-weight: 700; margin-bottom: 4px;">Description & Distinctive Marks:</div>
      <p style="font-size: 14px; color: var(--text-muted); line-height: 1.6;">${escapeHtml(item.description)}</p>
    </div>

    <!-- Contact Box -->
    <div style="background: var(--primary-light); border: 1px solid #c7d2fe; border-radius: var(--radius-md); padding: 16px; margin-bottom: 20px;">
      <div style="font-size: 13px; font-weight: 700; color: var(--primary); margin-bottom: 6px;">
        <i class="fa-solid fa-address-card"></i> Direct Contact Information
      </div>
      <div style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">
        ${escapeHtml(item.contactName)}
      </div>
      <div style="font-size: 14px; color: #3730a3; word-break: break-all;">
        <i class="fa-solid fa-phone-flip"></i> ${escapeHtml(item.contactInfo)}
      </div>
    </div>

    <!-- Potential Matches List -->
    ${matches.length > 0 ? `
      <div style="margin-top: 20px; border-top: 1px solid var(--border); padding-top: 16px;">
        <div style="font-size: 14px; font-weight: 700; color: #d97706; margin-bottom: 10px;">
          <i class="fa-solid fa-sparkles"></i> Smart Match Suggestions (${matches.length})
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${matches.map(m => `
            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: var(--radius-sm); padding: 10px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="font-size: 13px; color: #92400e;">${escapeHtml(m.title)}</strong>
                <div style="font-size: 12px; color: #b45309;">${escapeHtml(m.location)} &bull; ${formatDate(m.date)}</div>
              </div>
              <button class="btn btn-secondary btn-sm" onclick="openItemDetails('${m.id}')">View</button>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Action to Report Matching Counter-Item -->
    ${!isReunited ? `
      <div style="margin-bottom: 20px;">
        ${item.type === 'LOST' ? `
          <button type="button" class="btn btn-primary btn-block" style="padding: 12px; font-size: 14.5px; font-weight: 700; background-color: var(--found-color); border-color: var(--found-color);" onclick="respondToItem('${item.id}', 'FOUND')">
            <i class="fa-solid fa-hand-holding-heart"></i> I Found This Item
          </button>
        ` : `
          <button type="button" class="btn btn-primary btn-block" style="padding: 12px; font-size: 14.5px; font-weight: 700; background-color: var(--lost-color); border-color: var(--lost-color);" onclick="respondToItem('${item.id}', 'LOST')">
            <i class="fa-solid fa-circle-exclamation"></i> I Lost This Item
          </button>
        `}
      </div>
    ` : ''}

    <div style="margin-top: 24px; display: flex; gap: 10px; justify-content: space-between; flex-wrap: wrap;">
      <div style="display: flex; gap: 8px;">
        ${!isReunited ? `
          <button class="btn btn-secondary" onclick="markReunited('${item.id}'); closeModal('details-modal');">
            <i class="fa-solid fa-circle-check" style="color: var(--found-color);"></i> Mark as Reunited
          </button>
        ` : `<div style="color: var(--reunited-color); font-weight: 600; font-size: 13px;"><i class="fa-solid fa-check-double"></i> Item marked as returned!</div>`}
        <button class="btn btn-secondary" style="color: var(--lost-color);" onclick="deleteItem('${item.id}');">
          <i class="fa-solid fa-trash-can"></i> Delete
        </button>
      </div>
      <button class="btn btn-secondary" onclick="closeModal('details-modal')">Close</button>
    </div>
  `;

  openModal('details-modal');
}

// Respond to a listing: Pre-fills report modal to report matching lost or found item
function respondToItem(id, targetType) {
  const item = state.items.find(i => i.id === id);
  if (!item) return;

  closeModal('details-modal');
  setFormType(targetType);

  const titleField = document.getElementById('form-title');
  const catField = document.getElementById('form-category');
  const locField = document.getElementById('form-location');
  const descField = document.getElementById('form-desc');
  const dateField = document.getElementById('form-date');

  if (titleField) titleField.value = item.title;
  if (catField) catField.value = item.category;
  if (locField) locField.value = item.location;
  if (dateField) dateField.value = new Date().toISOString().split('T')[0];

  if (descField) {
    if (targetType === 'FOUND') {
      descField.value = `Found item matching "${item.title}" reported lost at ${item.location}.`;
    } else {
      descField.value = `I lost this item matching "${item.title}" found at ${item.location}.`;
    }
  }

  if (typeof window.clearUploadedPhoto === 'function') {
    window.clearUploadedPhoto();
  }

  openModal('report-modal');

  setTimeout(() => {
    const contactInput = document.getElementById('form-contact-name');
    if (contactInput) contactInput.focus();
  }, 100);
}

// Mark an item as reunited
function markReunited(id, event) {
  if (event) event.stopPropagation();
  const item = state.items.find(i => i.id === id);
  if (!item) return;

  item.status = 'REUNITED';
  saveItems();
  renderApp();
  checkInstantMatchesBanner();
  showToast(`🎉 Marked "${item.title}" as Reunited!`);
}

// Delete individual item from feed
function deleteItem(id, event) {
  if (event) event.stopPropagation();
  if (confirm('Are you sure you want to delete this listing from the notice board?')) {
    state.items = state.items.filter(item => item.id !== id);
    saveItems();
    renderApp();
    checkInstantMatchesBanner();
    closeModal('details-modal');
    showToast('Listing deleted successfully.');
  }
}

// Clear all feed data
function clearAllFeedData() {
  if (confirm('Are you sure you want to clear all listings from the notice board?')) {
    state.items = [];
    saveItems();
    renderApp();
    checkInstantMatchesBanner();
    showToast('All recent listings cleared.');
  }
}

// Open Modal
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('open');
}

// Close Modal
function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('open');
}

// Show Toast
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.innerHTML = `<i class="fa-solid fa-circle-info"></i> ${message}`;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

// Setup Event Listeners
function setupEventListeners() {
  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentTab = btn.dataset.tab;
      renderApp();
    });
  });

  // Category Pills
  document.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.selectedCategory = pill.dataset.cat;
      renderApp();
    });
  });

  // Search input
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderApp();
  });

  // Modal open buttons
  document.getElementById('btn-report-lost').addEventListener('click', () => {
    setFormType('LOST');
    openModal('report-modal');
  });

  document.getElementById('btn-report-found').addEventListener('click', () => {
    setFormType('FOUND');
    openModal('report-modal');
  });

  // Form type toggles
  document.getElementById('toggle-lost').addEventListener('click', () => setFormType('LOST'));
  document.getElementById('toggle-found').addEventListener('click', () => setFormType('FOUND'));

  // Image upload & Dropzone setup
  const dropzone = document.getElementById('upload-dropzone');
  const imageInput = document.getElementById('item-image-input');
  const uploadPrompt = document.getElementById('upload-prompt');
  const previewContainer = document.getElementById('upload-preview-container');
  const imagePreview = document.getElementById('image-preview');
  const removePhotoBtn = document.getElementById('btn-remove-photo');

  window.setUploadedPhoto = function(dataUrl) {
    state.uploadedImageData = dataUrl;
    if (imagePreview) {
      imagePreview.src = dataUrl;
      imagePreview.style.display = 'block';
    }
    if (uploadPrompt) uploadPrompt.style.display = 'none';
    if (previewContainer) previewContainer.style.display = 'flex';
  };

  window.clearUploadedPhoto = function() {
    state.uploadedImageData = null;
    if (imageInput) imageInput.value = '';
    if (imagePreview) {
      imagePreview.src = '';
      imagePreview.style.display = 'none';
    }
    if (previewContainer) previewContainer.style.display = 'none';
    if (uploadPrompt) uploadPrompt.style.display = 'flex';
  };

  if (dropzone && imageInput) {
    // Open file picker on dropzone click (except when clicking Remove button)
    dropzone.addEventListener('click', (e) => {
      if (e.target.closest('#btn-remove-photo')) return;
      imageInput.click();
    });

    // Keyboard access (Enter / Space)
    dropzone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        imageInput.click();
      }
    });

    // Remove photo button
    if (removePhotoBtn) {
      removePhotoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.clearUploadedPhoto();
      });
    }

    // File input change
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          alert('File size exceeds 5MB limit. Please select a smaller photo.');
          imageInput.value = '';
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          window.setUploadedPhoto(event.target.result);
        };
        reader.readAsDataURL(file);
      }
    });

    // Drag and Drop
    ['dragenter', 'dragover'].forEach(evtName => {
      dropzone.addEventListener(evtName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(evtName => {
      dropzone.addEventListener(evtName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const file = dt && dt.files && dt.files[0];
      if (file && file.type.startsWith('image/')) {
        if (file.size > 5 * 1024 * 1024) {
          alert('File size exceeds 5MB limit. Please select a smaller photo.');
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          window.setUploadedPhoto(event.target.result);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Form submission
  const reportForm = document.getElementById('report-form');
  reportForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleReportSubmit();
  });

  // Reset demo data button
  const resetBtn = document.getElementById('btn-reset-demo');
  if (resetBtn) {
    resetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Reset to default sample items?')) {
        state.items = [...DEFAULT_ITEMS];
        saveItems();
        renderApp();
        checkInstantMatchesBanner();
        showToast('Sample items reloaded!');
      }
    });
  }

  // Close modals on backdrop click
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
      }
    });
  });

  // Today as default date
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('form-date').value = today;
}

// Set form type (Lost vs Found)
function setFormType(type) {
  state.formType = type;
  const lostToggle = document.getElementById('toggle-lost');
  const foundToggle = document.getElementById('toggle-found');
  const submitBtn = document.getElementById('btn-submit-report');
  const title = document.getElementById('report-modal-title');

  if (type === 'LOST') {
    lostToggle.classList.add('active');
    foundToggle.classList.remove('active');
    title.textContent = 'Report a Lost Item';
    submitBtn.textContent = 'Post Lost Item Notice';
    submitBtn.style.backgroundColor = 'var(--lost-color)';
  } else {
    foundToggle.classList.add('active');
    lostToggle.classList.remove('active');
    title.textContent = 'Report a Found Item';
    submitBtn.textContent = 'Post Found Item Notice';
    submitBtn.style.backgroundColor = 'var(--found-color)';
  }
}

// Handle Report Form Submit
function handleReportSubmit() {
  const title = document.getElementById('form-title').value.trim();
  const category = document.getElementById('form-category').value;
  const location = document.getElementById('form-location').value.trim();
  const date = document.getElementById('form-date').value;
  const description = document.getElementById('form-desc').value.trim();
  const contactName = document.getElementById('form-contact-name').value.trim();
  const contactInfo = document.getElementById('form-contact-info').value.trim();

  if (!title || !location || !contactName || !contactInfo) {
    alert('Please fill in all required fields.');
    return;
  }

  const newItem = {
    id: 'fb-' + Date.now().toString(36),
    type: state.formType,
    title,
    category,
    location,
    date: date || new Date().toISOString().split('T')[0],
    description: description || 'No additional details provided.',
    contactName,
    contactInfo,
    status: 'ACTIVE',
    image: state.uploadedImageData || ''
  };

  state.items.unshift(newItem);
  saveItems();

  // Reset form
  document.getElementById('report-form').reset();
  if (typeof window.clearUploadedPhoto === 'function') {
    window.clearUploadedPhoto();
  } else {
    state.uploadedImageData = null;
  }
  closeModal('report-modal');

  // Re-render
  renderApp();
  checkInstantMatchesBanner();

  // Check if matches exist for this newly added item!
  const matches = findMatches(newItem);
  if (matches.length > 0) {
    showToast(`🎉 Awesome! We found ${matches.length} possible matching item(s) already listed!`);
  } else {
    showToast(`✅ Your ${newItem.type} item was published successfully!`);
  }
}

// Helper: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper: Format Date
function formatDate(dateStr) {
  if (!dateStr) return 'Recently';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
}

// Run on page load
document.addEventListener('DOMContentLoaded', initApp);
