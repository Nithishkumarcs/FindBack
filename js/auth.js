/**
 * FindBack — Authentication & Navigation Component
 * GitHub Pages & Localhost Path Agnostic
 */

function getAppRootPrefix() {
  const path = window.location.pathname.replace(/\\/g, '/');
  return path.includes('/admin/') ? '../' : '';
}

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  setupAuthForms();
});

function renderNavbar() {
  const navContainer = document.querySelector('.navbar-container');
  if (!navContainer) return;

  const user = Auth.getUser();
  const currentPath = window.location.pathname.replace(/\\/g, '/');
  const p = getAppRootPrefix();

  let linksHtml = `
    <ul class="nav-links" id="nav-links">
      <li><a href="${p}index.html" class="nav-link ${currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath === '' ? 'active' : ''}"><i class="fa-solid fa-clipboard-list"></i> Notice Board</a></li>
      <li><a href="${p}report-lost.html" class="nav-link ${currentPath.includes('report-lost.html') ? 'active' : ''}"><i class="fa-solid fa-circle-exclamation" style="color: var(--lost-red);"></i> Post Lost</a></li>
      <li><a href="${p}report-found.html" class="nav-link ${currentPath.includes('report-found.html') ? 'active' : ''}"><i class="fa-solid fa-hand-holding-heart" style="color: var(--found-green);"></i> Post Found</a></li>
      <li><a href="${p}reports.html" class="nav-link ${currentPath.includes('reports.html') ? 'active' : ''}"><i class="fa-solid fa-magnifying-glass"></i> All Notices</a></li>
  `;

  if (user) {
    linksHtml += `
      <li><a href="${p}dashboard.html" class="nav-link ${currentPath.includes('dashboard.html') ? 'active' : ''}"><i class="fa-solid fa-gauge"></i> My Dashboard</a></li>
      <li><a href="${p}matches.html" class="nav-link ${currentPath.includes('matches.html') ? 'active' : ''}"><i class="fa-solid fa-bolt" style="color: var(--accent-cyan);"></i> Matches</a></li>
    `;
  }

  linksHtml += `</ul>`;

  let actionsHtml = '';
  if (user) {
    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
    actionsHtml = `
      <div class="nav-actions">
        <a href="${p}notifications.html" class="nav-btn-icon" title="Notifications" id="nav-notif-btn">
          <i class="fa-regular fa-bell"></i>
          <span class="badge-count" id="nav-notif-count" style="display: none;">0</span>
        </a>

        <div class="user-menu">
          <button class="user-menu-btn" id="user-menu-btn" onclick="toggleUserDropdown(event)">
            <div class="user-avatar">${initials}</div>
            <span class="d-none d-md-inline" style="max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${user.name.split(' ')[0]}</span>
            <i class="fa-solid fa-chevron-down" style="font-size: 0.75rem;"></i>
          </button>
          <div class="user-dropdown" id="user-dropdown">
            <div style="padding: 0.65rem 1.2rem; border-bottom: 1px solid var(--border-color);">
              <div style="font-weight: 700; color: var(--text-main); font-size: 0.95rem;">${user.name}</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">${user.email}</div>
            </div>
            <a href="${p}dashboard.html" class="dropdown-item"><i class="fa-solid fa-gauge"></i> My Dashboard</a>
            <a href="${p}matches.html" class="dropdown-item"><i class="fa-solid fa-bolt"></i> My Matches</a>
            <a href="${p}claims.html" class="dropdown-item"><i class="fa-solid fa-clipboard-check"></i> My Claims</a>
            <a href="${p}profile.html" class="dropdown-item"><i class="fa-regular fa-user"></i> My Profile</a>
            ${user.role === 'ADMIN' ? `
              <div class="dropdown-divider"></div>
              <a href="${p}admin/index.html" class="dropdown-item" style="color: var(--accent-cyan); font-weight: 600;"><i class="fa-solid fa-shield-halved"></i> Admin Panel</a>
            ` : ''}
            <div class="dropdown-divider"></div>
            <a href="#" class="dropdown-item" onclick="handleLogout(event)" style="color: var(--lost-red);"><i class="fa-solid fa-arrow-right-from-bracket"></i> Sign Out</a>
          </div>
        </div>

        <button class="mobile-toggle" onclick="toggleMobileNav()"><i class="fa-solid fa-bars"></i></button>
      </div>
    `;
  } else {
    actionsHtml = `
      <div class="nav-actions">
        <a href="${p}login.html" class="btn btn-outline btn-sm">Log In</a>
        <a href="${p}register.html" class="btn btn-primary btn-sm">Register</a>
        <button class="mobile-toggle" onclick="toggleMobileNav()"><i class="fa-solid fa-bars"></i></button>
      </div>
    `;
  }

  navContainer.innerHTML = `
    <a href="${p}index.html" class="nav-brand">
      <div class="brand-icon"><i class="fa-solid fa-graduation-cap"></i></div>
      Find<span>Back</span>
    </a>
    ${linksHtml}
    ${actionsHtml}
  `;

  // Fetch unread notifications count if logged in
  if (user) {
    fetchUnreadNotificationsCount();
  }
}

function toggleUserDropdown(event) {
  event.stopPropagation();
  const dropdown = document.getElementById('user-dropdown');
  if (dropdown) dropdown.classList.toggle('show');
}

document.addEventListener('click', () => {
  const dropdown = document.getElementById('user-dropdown');
  if (dropdown) dropdown.classList.remove('show');
});

function toggleMobileNav() {
  const links = document.getElementById('nav-links');
  if (links) links.classList.toggle('show');
}

async function handleLogout(e) {
  if (e) e.preventDefault();
  const p = getAppRootPrefix();
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch (err) {
    // Continue cleanup even if failed
  }
  Auth.clear();
  showToast('You have been logged out.', 'info');
  setTimeout(() => {
    window.location.href = `${p}login.html`;
  }, 500);
}

async function fetchUnreadNotificationsCount() {
  try {
    const res = await apiFetch('/notifications?unread_only=true');
    const badge = document.getElementById('nav-notif-count');
    if (badge && res.unread_count > 0) {
      badge.innerText = res.unread_count > 99 ? '99+' : res.unread_count;
      badge.style.display = 'block';
    }
  } catch (e) {
    // silent fail
  }
}

function setupAuthForms() {
  const p = getAppRootPrefix();

  // Login Form Handler
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing In...';

      try {
        const res = await apiFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });

        Auth.setToken(res.token);
        Auth.setUser(res.user);

        showToast(res.message, 'success');
        
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');

        setTimeout(() => {
          if (redirect) {
            window.location.href = redirect;
          } else if (res.user.role === 'ADMIN') {
            window.location.href = `${p}admin/index.html`;
          } else {
            window.location.href = `${p}dashboard.html`;
          }
        }, 500);
      } catch (err) {
        showToast(err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Sign In';
      }
    });
  }

  // Registration Form Handler
  const regForm = document.getElementById('register-form');
  if (regForm) {
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirm_password = document.getElementById('confirm_password').value;
      const phone = document.getElementById('phone')?.value.trim() || '';
      const general_location = document.getElementById('general_location')?.value.trim() || '';

      const submitBtn = regForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...';

      try {
        const res = await apiFetch('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password, confirm_password, phone, general_location })
        });

        Auth.setToken(res.token);
        Auth.setUser(res.user);

        showToast(res.message, 'success');
        setTimeout(() => {
          window.location.href = `${p}dashboard.html`;
        }, 600);
      } catch (err) {
        showToast(err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Create Account';
      }
    });
  }
}
