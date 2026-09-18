/**
 * FindBack — Centralized API Client & Client-Side Serverless Engine
 * Pure JavaScript - 100% Standalone, Zero Backend Server Required
 */

// Auth Token & User Helpers
const Auth = {
  getToken() {
    return localStorage.getItem('findback_token');
  },
  setToken(token) {
    localStorage.setItem('findback_token', token);
  },
  getUser() {
    const raw = localStorage.getItem('findback_user');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },
  setUser(user) {
    localStorage.setItem('findback_user', JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem('findback_token');
    localStorage.removeItem('findback_user');
  },
  isLoggedIn() {
    return Boolean(this.getToken() && this.getUser());
  },
  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'ADMIN';
  }
};

/**
 * Universal Client-Side API Router & Fetch Wrapper
 * Seamlessly handles all routes in-browser via FindBackDB and MatchingEngine.
 */
async function apiFetch(endpoint, options = {}) {
  // Artificial micro-delay (30ms) for natural UX transitions
  await new Promise(r => setTimeout(r, 30));

  const url = endpoint.replace(/^\/api/, '');
  const method = (options.method || 'GET').toUpperCase();
  const currentUser = Auth.getUser();

  // Helper to parse body
  let body = {};
  if (options.body) {
    if (options.body instanceof FormData) {
      for (const [k, v] of options.body.entries()) {
        body[k] = v;
      }
    } else if (typeof options.body === 'string') {
      try {
        body = JSON.parse(options.body);
      } catch (e) {
        body = {};
      }
    } else {
      body = options.body;
    }
  }

  // Parse URL & Query params
  const [pathname, queryString] = url.split('?');
  const params = new URLSearchParams(queryString || '');

  // ----------------------------------------------------
  // 1. AUTHENTICATION ROUTES
  // ----------------------------------------------------
  if (pathname === '/auth/login' && method === 'POST') {
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';

    const user = FindBackDB.find('users', u => u.email.toLowerCase() === email);
    if (!user) {
      throw new Error('Invalid email or password.');
    }
    if (user.status === 'BLOCKED') {
      throw new Error('This account has been suspended by system administrators.');
    }
    // Check password
    if (user.password && user.password !== password) {
      throw new Error('Invalid email or password.');
    }

    const token = `fb_token_${user.id}_${Date.now()}`;
    const safeUser = { ...user };
    delete safeUser.password;

    FindBackDB.logAudit(user.id, 'USER_LOGIN', 'USER', user.id, { email: user.email });

    return {
      message: 'Welcome back!',
      token,
      user: safeUser
    };
  }

  if (pathname === '/auth/register' && method === 'POST') {
    const email = (body.email || '').trim().toLowerCase();
    const name = (body.name || '').trim();
    const password = body.password || '';
    const confirm_password = body.confirm_password || '';

    if (!name || !email || !password) {
      throw new Error('Please fill in all required fields.');
    }
    if (password !== confirm_password) {
      throw new Error('Passwords do not match.');
    }
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters.');
    }

    const existing = FindBackDB.find('users', u => u.email.toLowerCase() === email);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const newUser = FindBackDB.insert('users', {
      name,
      email,
      password,
      phone: (body.phone || '').trim(),
      general_location: (body.general_location || '').trim(),
      role: 'USER',
      status: 'ACTIVE'
    });

    const token = `fb_token_${newUser.id}_${Date.now()}`;
    const safeUser = { ...newUser };
    delete safeUser.password;

    FindBackDB.logAudit(newUser.id, 'USER_REGISTER', 'USER', newUser.id, { email });

    return {
      message: 'Account created successfully!',
      token,
      user: safeUser
    };
  }

  if (pathname === '/auth/me' && method === 'GET') {
    if (!currentUser) throw new Error('Unauthorized');
    const user = FindBackDB.getById('users', currentUser.id);
    if (!user) throw new Error('User not found');

    const lostReports = FindBackDB.filter('reports', r => Number(r.user_id) === Number(user.id) && r.report_type === 'LOST');
    const foundReports = FindBackDB.filter('reports', r => Number(r.user_id) === Number(user.id) && r.report_type === 'FOUND');
    const claims = FindBackDB.filter('claims', c => Number(c.claimant_id) === Number(user.id) || Number(c.finder_id) === Number(user.id));
    const recoveredReports = FindBackDB.filter('reports', r => Number(r.user_id) === Number(user.id) && r.status === 'RETURNED');

    const safeUser = {
      ...user,
      stats: {
        lost_count: lostReports.length,
        found_count: foundReports.length,
        claims_count: claims.length,
        recovered_count: recoveredReports.length
      }
    };
    delete safeUser.password;
    return { user: safeUser };
  }

  if (pathname === '/auth/profile' && method === 'PUT') {
    if (!currentUser) throw new Error('Unauthorized');

    const updates = {};
    if (body.name) updates.name = body.name.trim();
    if (body.phone !== undefined) updates.phone = body.phone.trim();
    if (body.general_location !== undefined) updates.general_location = body.general_location.trim();

    if (body.new_password) {
      const user = FindBackDB.getById('users', currentUser.id);
      if (user.password && user.password !== body.old_password) {
        throw new Error('Current password is incorrect.');
      }
      updates.password = body.new_password;
    }

    const updated = FindBackDB.update('users', currentUser.id, updates);
    const safeUser = { ...updated };
    delete safeUser.password;

    FindBackDB.logAudit(currentUser.id, 'PROFILE_UPDATED', 'USER', currentUser.id, {});

    return {
      message: 'Profile updated successfully.',
      user: safeUser
    };
  }

  if (pathname === '/auth/logout' && method === 'POST') {
    return { message: 'Logged out successfully.' };
  }

  // ----------------------------------------------------
  // 2. CATEGORIES ROUTE
  // ----------------------------------------------------
  if (pathname === '/categories' && method === 'GET') {
    const categories = FindBackDB.getAll('categories');
    return { categories };
  }

  // ----------------------------------------------------
  // 3. REPORTS ROUTES
  // ----------------------------------------------------
  if (pathname === '/reports/check-duplicate' && method === 'POST') {
    const userId = currentUser ? currentUser.id : null;
    const res = MatchingEngine.checkForDuplicates(
      userId,
      body.report_type,
      body.category_id,
      body.item_name,
      body.report_date,
      body.location_name,
      body.latitude ? Number(body.latitude) : null,
      body.longitude ? Number(body.longitude) : null,
      body.description
    );
    return res;
  }

  if ((pathname === '/reports/lost' || pathname === '/reports/found') && method === 'POST') {
    const isLost = pathname.includes('lost');
    const reportType = isLost ? 'LOST' : 'FOUND';

    const itemName = (body.item_name || '').trim();
    const categoryId = Number(body.category_id) || 1;
    const reportDate = body.report_date || body.lost_date || body.found_date || new Date().toISOString().split('T')[0];
    const reportTime = body.report_time || body.lost_time || body.found_time || '';
    const locationName = (body.location_name || '').trim();
    const description = (body.description || '').trim();
    const identifyingChars = (body.identifying_characteristics || '').trim();
    const conditionInfo = (body.condition_info || '').trim();
    const preferredContact = body.preferred_contact || 'Phone';
    const contactName = (body.contact_name || (currentUser ? currentUser.name : 'Campus Student')).trim();
    const contactPhone = (body.contact_phone || (currentUser && currentUser.phone ? currentUser.phone : '9876543210')).trim();
    const latitude = body.latitude ? Number(body.latitude) : null;
    const longitude = body.longitude ? Number(body.longitude) : null;

    if (!itemName || !categoryId || !locationName) {
      throw new Error('Please provide item name, category, and campus location.');
    }

    const cat = FindBackDB.getById('categories', categoryId);
    const isSensitive = MatchingEngine.isItemSensitive(cat ? cat.name : '', itemName, description);

    // Image handling: if file is attached in browser, convert or read DataURL
    let imagePath = null;
    if (body.image instanceof File && body.image.size > 0) {
      try {
        imagePath = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(body.image);
        });
      } catch (e) {
        imagePath = null;
      }
    }

    const caseId = FindBackDB.generateCaseId();
    const userId = currentUser ? currentUser.id : 2;

    const newReport = FindBackDB.insert('reports', {
      case_id: caseId,
      user_id: userId,
      category_id: categoryId,
      report_type: reportType,
      item_name: itemName,
      description: description || `${reportType} item reported on campus`,
      report_date: reportDate,
      report_time: reportTime,
      location_name: locationName,
      latitude,
      longitude,
      image_path: imagePath,
      condition_info: conditionInfo || null,
      identifying_characteristics: identifyingChars || null,
      preferred_contact: preferredContact,
      contact_name: contactName,
      contact_phone: contactPhone,
      is_sensitive: isSensitive,
      status: 'ACTIVE'
    });

    // Handle verification questions for found items
    if (!isLost) {
      const q1 = body.question_1 || body['questions[0]'];
      const a1 = body.answer_1 || body['answers[0]'];
      const q2 = body.question_2 || body['questions[1]'];
      const a2 = body.answer_2 || body['answers[1]'];

      if (q1) FindBackDB.insert('verification_questions', { report_id: newReport.id, question: q1, expected_answer: a1 || '' });
      if (q2) FindBackDB.insert('verification_questions', { report_id: newReport.id, question: q2, expected_answer: a2 || '' });
    }

    // Run 100-point matching engine automatically
    const matches = MatchingEngine.runMatchingForReport(newReport);

    FindBackDB.logAudit(currentUser.id, 'REPORT_CREATED', 'REPORT', newReport.id, {
      type: reportType,
      case_id: caseId,
      matches_found: matches.length
    });

    return {
      message: `${isLost ? 'Lost' : 'Found'} item reported successfully!`,
      report: newReport,
      potential_matches_found: matches.length
    };
  }

  if (pathname === '/reports' && method === 'GET') {
    let reports = FindBackDB.getAll('reports');

    const q = (params.get('q') || '').toLowerCase().trim();
    const type = params.get('report_type') || '';
    const categoryId = params.get('category_id') ? Number(params.get('category_id')) : null;
    const userId = params.get('user_id') ? Number(params.get('user_id')) : null;
    const sortBy = params.get('sort_by') || 'newest';
    const lat = params.get('lat') ? Number(params.get('lat')) : null;
    const lng = params.get('lng') ? Number(params.get('lng')) : null;
    const radiusKm = params.get('radius_km') ? Number(params.get('radius_km')) : null;

    const page = Math.max(1, Number(params.get('page')) || 1);
    const perPage = Math.max(1, Number(params.get('per_page')) || 9);

    // Filtering
    reports = reports.filter(r => {
      if (type && r.report_type !== type) return false;
      if (categoryId && Number(r.category_id) !== categoryId) return false;
      if (userId && Number(r.user_id) !== userId) return false;

      if (q) {
        const hay = `${r.item_name} ${r.description} ${r.location_name} ${r.case_id}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (lat !== null && lng !== null && radiusKm !== null) {
        const dist = MatchingEngine.haversineDistance(lat, lng, r.latitude, r.longitude);
        if (dist === null || dist > radiusKm) return false;
        r.distance_km = Math.round(dist * 10) / 10;
      }

      return true;
    });

    // Sorting
    if (sortBy === 'newest') {
      reports.sort((a, b) => new Date(b.report_date) - new Date(a.report_date));
    } else if (sortBy === 'oldest') {
      reports.sort((a, b) => new Date(a.report_date) - new Date(b.report_date));
    } else if (sortBy === 'closest' && lat !== null && lng !== null) {
      reports.sort((a, b) => (a.distance_km || 9999) - (b.distance_km || 9999));
    }

    // Enrich
    const categories = FindBackDB.getAll('categories');
    const users = FindBackDB.getAll('users');

    const enriched = reports.map(r => {
      const cat = categories.find(c => c.id === r.category_id);
      const rep = users.find(u => u.id === r.user_id);
      return {
        ...r,
        category_name: cat ? cat.name : 'General',
        reporter_name: r.contact_name || (rep ? rep.name : 'Campus Student'),
        contact_name: r.contact_name || (rep ? rep.name : 'Campus Student'),
        contact_phone: r.contact_phone || (rep && rep.phone ? rep.phone : '9876543210')
      };
    });

    const total = enriched.length;
    const totalPages = Math.ceil(total / perPage);
    const paginated = enriched.slice((page - 1) * perPage, page * perPage);

    return {
      reports: paginated,
      total,
      page,
      per_page: perPage,
      total_pages: totalPages
    };
  }

  // Single report details: /reports/:id
  const reportMatch = pathname.match(/^\/reports\/(\d+)$/);
  if (reportMatch && method === 'GET') {
    const reportId = Number(reportMatch[1]);
    const report = FindBackDB.getById('reports', reportId);
    if (!report) throw new Error('Report not found');

    const cat = FindBackDB.getById('categories', report.category_id);
    const reporter = FindBackDB.getById('users', report.user_id);
    const questions = FindBackDB.filter('verification_questions', q => Number(q.report_id) === reportId);

    const isOwner = currentUser && Number(currentUser.id) === Number(report.user_id);
    const isAdmin = currentUser && currentUser.role === 'ADMIN';

    // Mask sensitive details if not owner or admin
    let displayDesc = report.description;
    let displayChars = report.identifying_characteristics;
    if (report.is_sensitive && !isOwner && !isAdmin) {
      displayDesc = MatchingEngine.maskSensitiveText(displayDesc);
      displayChars = MatchingEngine.maskSensitiveText(displayChars);
    }

    // Do not leak expected answers to public
    const publicQuestions = questions.map(q => ({
      id: q.id,
      question: q.question
    }));

    return {
      report: {
        ...report,
        description: displayDesc,
        identifying_characteristics: displayChars,
        category_name: cat ? cat.name : 'General',
        reporter_name: report.contact_name || (reporter ? reporter.name : 'Campus Student'),
        contact_name: report.contact_name || (reporter ? reporter.name : 'Campus Student'),
        contact_phone: report.contact_phone || (reporter && reporter.phone ? reporter.phone : '9876543210'),
        verification_questions: publicQuestions
      }
    };
  }

  // Flag abuse: /reports/:id/abuse
  const abuseReportMatch = pathname.match(/^\/reports\/(\d+)\/abuse$/);
  if (abuseReportMatch && method === 'POST') {
    if (!currentUser) throw new Error('Please sign in to flag a report.');
    const reportId = Number(abuseReportMatch[1]);

    FindBackDB.insert('abuse_reports', {
      reporter_id: currentUser.id,
      report_id: reportId,
      reason: body.reason || 'Other',
      description: body.description || '',
      status: 'PENDING'
    });

    FindBackDB.logAudit(currentUser.id, 'REPORT_FLAGGED', 'REPORT', reportId, { reason: body.reason });

    return { message: 'Thank you for reporting. Our moderation team will inspect this listing.' };
  }

  // ----------------------------------------------------
  // 4. MATCHES ROUTES
  // ----------------------------------------------------
  if (pathname === '/matches/user' && method === 'GET') {
    if (!currentUser) throw new Error('Unauthorized');
    const userReports = FindBackDB.filter('reports', r => Number(r.user_id) === Number(currentUser.id));
    const userReportIds = new Set(userReports.map(r => r.id));

    const matches = FindBackDB.filter('matches', m =>
      userReportIds.has(Number(m.lost_report_id)) || userReportIds.has(Number(m.found_report_id))
    );

    matches.sort((a, b) => b.match_score - a.match_score);

    const enriched = matches.map(m => enrichMatch(m));
    return { matches: enriched };
  }

  const matchReportTarget = pathname.match(/^\/matches\/report\/(\d+)$/);
  if (matchReportTarget && method === 'GET') {
    const reportId = Number(matchReportTarget[1]);
    const report = FindBackDB.getById('reports', reportId);
    if (!report) throw new Error('Report not found');

    const matches = FindBackDB.filter('matches', m =>
      Number(m.lost_report_id) === reportId || Number(m.found_report_id) === reportId
    );

    matches.sort((a, b) => b.match_score - a.match_score);
    const enriched = matches.map(m => enrichMatch(m));

    return {
      report,
      matches: enriched
    };
  }

  // ----------------------------------------------------
  // 5. CLAIMS ROUTES
  // ----------------------------------------------------
  if (pathname === '/claims' && method === 'GET') {
    if (!currentUser) throw new Error('Unauthorized');

    let claims = FindBackDB.filter('claims', c =>
      Number(c.claimant_id) === Number(currentUser.id) || Number(c.finder_id) === Number(currentUser.id)
    );

    claims.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const enriched = claims.map(c => {
      const rep = FindBackDB.getById('reports', c.report_id) || {};
      const claimant = FindBackDB.getById('users', c.claimant_id) || {};
      const finder = FindBackDB.getById('users', c.finder_id) || {};
      return {
        ...c,
        item_name: rep.item_name || 'Reported Item',
        case_id: rep.case_id || 'FB-CASE',
        claimant_name: claimant.name || 'Claimant',
        finder_name: finder.name || 'Finder'
      };
    });

    return { claims: enriched };
  }

  if (pathname === '/claims' && method === 'POST') {
    if (!currentUser) throw new Error('Please sign in to submit a claim.');
    const reportId = Number(body.report_id);
    const report = FindBackDB.getById('reports', reportId);
    if (!report) throw new Error('Report not found.');

    if (Number(report.user_id) === Number(currentUser.id)) {
      throw new Error('You cannot claim an item you reported yourself.');
    }

    const newClaim = FindBackDB.insert('claims', {
      match_id: body.match_id ? Number(body.match_id) : null,
      report_id: reportId,
      claimant_id: currentUser.id,
      finder_id: report.user_id,
      verification_response: body.verification_response || {},
      status: 'UNDER_REVIEW',
      reviewer_id: null,
      review_notes: '',
      handover_date: null,
      handover_location: '',
      confirmed_by_claimant: false,
      confirmed_by_finder: false,
      completed_at: null
    });

    // Update report status
    FindBackDB.update('reports', reportId, { status: 'PENDING_CLAIM' });

    // Notify finder
    FindBackDB.insert('notifications', {
      user_id: report.user_id,
      type: 'CLAIM_SUBMITTED',
      title: 'Ownership Claim Received',
      message: `${currentUser.name} has submitted an ownership claim for your found item '${report.item_name}'.`,
      link: 'claims.html',
      is_read: false
    });

    FindBackDB.logAudit(currentUser.id, 'CLAIM_SUBMITTED', 'CLAIM', newClaim.id, { report_id: reportId });

    return {
      message: 'Claim submitted successfully! The finder will review your verification answers.',
      claim: newClaim
    };
  }

  const claimStatusMatch = pathname.match(/^\/claims\/(\d+)\/status$/);
  if (claimStatusMatch && method === 'PUT') {
    if (!currentUser) throw new Error('Unauthorized');
    const claimId = Number(claimStatusMatch[1]);
    const claim = FindBackDB.getById('claims', claimId);
    if (!claim) throw new Error('Claim not found');

    const newStatus = body.status;
    const reviewNotes = body.review_notes || '';

    FindBackDB.update('claims', claimId, {
      status: newStatus,
      reviewer_id: currentUser.id,
      review_notes: reviewNotes
    });

    // Notify claimant
    FindBackDB.insert('notifications', {
      user_id: claim.claimant_id,
      type: 'CLAIM_STATUS_UPDATE',
      title: `Claim ${newStatus}`,
      message: `Your ownership claim was marked as ${newStatus}. ${reviewNotes ? 'Notes: ' + reviewNotes : ''}`,
      link: 'claims.html',
      is_read: false
    });

    FindBackDB.logAudit(currentUser.id, 'CLAIM_STATUS_UPDATED', 'CLAIM', claimId, { status: newStatus });

    return { message: `Claim status updated to ${newStatus}.` };
  }

  const claimHandoverMatch = pathname.match(/^\/claims\/(\d+)\/handover$/);
  if (claimHandoverMatch && method === 'PUT') {
    if (!currentUser) throw new Error('Unauthorized');
    const claimId = Number(claimHandoverMatch[1]);
    const claim = FindBackDB.getById('claims', claimId);
    if (!claim) throw new Error('Claim not found');

    const location = body.handover_location || '';
    FindBackDB.update('claims', claimId, { handover_location: location });

    // Notify counterparty
    const targetUserId = Number(currentUser.id) === Number(claim.claimant_id) ? claim.finder_id : claim.claimant_id;
    FindBackDB.insert('notifications', {
      user_id: targetUserId,
      type: 'HANDOVER_UPDATE',
      title: 'Meeting Location Updated',
      message: `The recovery meeting location was set to: ${location}`,
      link: 'claims.html',
      is_read: false
    });

    return { message: 'Meeting location updated.' };
  }

  const claimConfirmMatch = pathname.match(/^\/claims\/(\d+)\/confirm-handover$/);
  if (claimConfirmMatch && method === 'POST') {
    if (!currentUser) throw new Error('Unauthorized');
    const claimId = Number(claimConfirmMatch[1]);
    const claim = FindBackDB.getById('claims', claimId);
    if (!claim) throw new Error('Claim not found');

    const isClaimant = Number(currentUser.id) === Number(claim.claimant_id);
    const isFinder = Number(currentUser.id) === Number(claim.finder_id);

    if (!isClaimant && !isFinder && currentUser.role !== 'ADMIN') {
      throw new Error('You are not authorized to confirm this handover.');
    }

    const updates = {};
    if (isClaimant) updates.confirmed_by_claimant = true;
    if (isFinder) updates.confirmed_by_finder = true;

    const currentClaimantConfirmed = updates.confirmed_by_claimant !== undefined ? updates.confirmed_by_claimant : claim.confirmed_by_claimant;
    const currentFinderConfirmed = updates.confirmed_by_finder !== undefined ? updates.confirmed_by_finder : claim.confirmed_by_finder;

    const bothConfirmed = currentClaimantConfirmed && currentFinderConfirmed;

    if (bothConfirmed) {
      updates.status = 'COMPLETED';
      updates.completed_at = new Date().toISOString();

      // Mark report returned
      FindBackDB.update('reports', claim.report_id, { status: 'RETURNED' });

      // If there was a match, update match and lost report
      if (claim.match_id) {
        const match = FindBackDB.getById('matches', claim.match_id);
        if (match) {
          FindBackDB.update('matches', match.id, { status: 'CLAIMED' });
          FindBackDB.update('reports', match.lost_report_id, { status: 'RETURNED' });
        }
      }

      // Notify both parties
      [claim.claimant_id, claim.finder_id].forEach(uId => {
        FindBackDB.insert('notifications', {
          user_id: uId,
          type: 'RECOVERY_CONFIRMED',
          title: 'Item Recovery Confirmed! 🎉',
          message: 'Both parties confirmed safe item handover. Case is now closed and marked Recovered.',
          link: 'claims.html',
          is_read: false
        });
      });

      FindBackDB.logAudit(currentUser.id, 'CLAIM_COMPLETED', 'CLAIM', claimId, { both_confirmed: true });

      FindBackDB.update('claims', claimId, updates);
      return { message: 'Item marked as successfully recovered! Case officially closed.' };
    }

    FindBackDB.update('claims', claimId, updates);
    return { message: 'Your handover confirmation recorded! Waiting for counter-party confirmation.' };
  }

  // ----------------------------------------------------
  // 6. NOTIFICATIONS ROUTES
  // ----------------------------------------------------
  if (pathname === '/notifications' && method === 'GET') {
    if (!currentUser) throw new Error('Unauthorized');
    const unreadOnly = params.get('unread_only') === 'true';

    let notifs = FindBackDB.filter('notifications', n => Number(n.user_id) === Number(currentUser.id));
    if (unreadOnly) {
      const unreadCount = notifs.filter(n => !n.is_read).length;
      return { unread_count: unreadCount };
    }

    notifs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { notifications: notifs };
  }

  const notifReadMatch = pathname.match(/^\/notifications\/(\d+)\/read$/);
  if (notifReadMatch && method === 'PUT') {
    const notifId = Number(notifReadMatch[1]);
    FindBackDB.update('notifications', notifId, { is_read: true });
    return { message: 'Notification marked read.' };
  }

  if (pathname === '/notifications/read-all' && method === 'PUT') {
    if (!currentUser) throw new Error('Unauthorized');
    const notifs = FindBackDB.filter('notifications', n => Number(n.user_id) === Number(currentUser.id));
    notifs.forEach(n => FindBackDB.update('notifications', n.id, { is_read: true }));
    return { message: 'All notifications marked as read.' };
  }

  // ----------------------------------------------------
  // 7. OFFICIAL CASE QR RESOLVER
  // ----------------------------------------------------
  const caseMatch = pathname.match(/^\/cases\/([A-Za-z0-9\-]+)$/);
  if (caseMatch && method === 'GET') {
    const caseId = caseMatch[1];
    const report = FindBackDB.find('reports', r => r.case_id.toUpperCase() === caseId.toUpperCase());
    if (!report) throw new Error('Invalid or expired Case ID.');

    const activeClaim = FindBackDB.find('claims', c => Number(c.report_id) === Number(report.id) && ['UNDER_REVIEW', 'APPROVED'].includes(c.status));

    return {
      case_id: report.case_id,
      report,
      is_recovered: report.status === 'RETURNED',
      has_active_handover: Boolean(activeClaim && activeClaim.status === 'APPROVED')
    };
  }

  // ----------------------------------------------------
  // 8. ADMIN ROUTES
  // ----------------------------------------------------
  if (pathname === '/admin/dashboard' && method === 'GET') {
    if (!Auth.isAdmin()) throw new Error('Administrator privileges required.');

    const users = FindBackDB.getAll('users');
    const reports = FindBackDB.getAll('reports');
    const matches = FindBackDB.getAll('matches');
    const claims = FindBackDB.getAll('claims');
    const abuse = FindBackDB.getAll('abuse_reports');
    const categories = FindBackDB.getAll('categories');

    const totalLost = reports.filter(r => r.report_type === 'LOST').length;
    const totalFound = reports.filter(r => r.report_type === 'FOUND').length;
    const recoveredItems = reports.filter(r => r.status === 'RETURNED').length;
    const pendingClaims = claims.filter(c => ['UNDER_REVIEW', 'PENDING', 'APPROVED'].includes(c.status)).length;
    const recoveryRate = reports.length > 0 ? Math.round((recoveredItems / reports.length) * 100) : 0;

    // Top categories
    const catCounts = {};
    reports.forEach(r => {
      catCounts[r.category_id] = (catCounts[r.category_id] || 0) + 1;
    });

    const topCategories = Object.keys(catCounts).map(catId => {
      const c = categories.find(cat => cat.id === Number(catId));
      return {
        name: c ? c.name : 'Other',
        count: catCounts[catId]
      };
    }).sort((a, b) => b.count - a.count).slice(0, 5);

    return {
      metrics: {
        total_users: users.length,
        total_lost: totalLost,
        total_found: totalFound,
        potential_matches: matches.length,
        pending_claims: pendingClaims,
        recovered_items: recoveredItems,
        recovery_rate: recoveryRate,
        avg_recovery_hours: 18.5,
        reported_abuse: abuse.length,
        top_categories: topCategories
      }
    };
  }

  if (pathname === '/admin/heatmap' && method === 'GET') {
    const reports = FindBackDB.getAll('reports');
    const points = reports
      .filter(r => r.latitude !== null && r.longitude !== null)
      .map(r => ({
        lat: r.latitude,
        lng: r.longitude,
        title: r.item_name,
        type: r.report_type
      }));
    return { points };
  }

  if (pathname === '/admin/users' && method === 'GET') {
    if (!Auth.isAdmin()) throw new Error('Administrator privileges required.');
    const q = (params.get('q') || '').toLowerCase().trim();
    let users = FindBackDB.getAll('users');

    if (q) {
      users = users.filter(u => `${u.name} ${u.email}`.toLowerCase().includes(q));
    }

    const reports = FindBackDB.getAll('reports');
    const enriched = users.map(u => {
      const count = reports.filter(r => Number(r.user_id) === Number(u.id)).length;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        reports_count: count,
        created_at: u.created_at
      };
    });

    return { users: enriched };
  }

  const userStatusMatch = pathname.match(/^\/admin\/users\/(\d+)\/status$/);
  if (userStatusMatch && method === 'PUT') {
    if (!Auth.isAdmin()) throw new Error('Administrator privileges required.');
    const targetUserId = Number(userStatusMatch[1]);
    const targetStatus = body.status;

    FindBackDB.update('users', targetUserId, { status: targetStatus });
    FindBackDB.logAudit(currentUser.id, targetStatus === 'BLOCKED' ? 'USER_BLOCKED' : 'USER_UNBLOCKED', 'USER', targetUserId, {});

    return { message: `User status changed to ${targetStatus}.` };
  }

  if (pathname === '/admin/claims' && method === 'GET') {
    if (!Auth.isAdmin()) throw new Error('Administrator privileges required.');
    let claims = FindBackDB.getAll('claims');
    claims.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const enriched = claims.map(c => {
      const rep = FindBackDB.getById('reports', c.report_id) || {};
      const claimant = FindBackDB.getById('users', c.claimant_id) || {};
      const finder = FindBackDB.getById('users', c.finder_id) || {};
      return {
        ...c,
        item_name: rep.item_name || 'Reported Item',
        case_id: rep.case_id || 'FB-CASE',
        claimant_name: claimant.name || 'Claimant',
        finder_name: finder.name || 'Finder'
      };
    });
    return { claims: enriched };
  }

  if (pathname === '/admin/reports' && method === 'GET') {
    if (!Auth.isAdmin()) throw new Error('Administrator privileges required.');
    const reports = FindBackDB.getAll('reports');
    const categories = FindBackDB.getAll('categories');

    const enriched = reports.map(r => {
      const c = categories.find(cat => cat.id === r.category_id);
      return {
        ...r,
        category_name: c ? c.name : 'General'
      };
    });

    enriched.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { reports: enriched };
  }

  const adminDeleteReportMatch = pathname.match(/^\/admin\/reports\/(\d+)$/);
  if (adminDeleteReportMatch && method === 'DELETE') {
    if (!Auth.isAdmin()) throw new Error('Administrator privileges required.');
    const reportId = Number(adminDeleteReportMatch[1]);

    FindBackDB.delete('reports', reportId);
    FindBackDB.logAudit(currentUser.id, 'REPORT_DELETED_BY_ADMIN', 'REPORT', reportId, {});

    return { message: 'Report permanently deleted.' };
  }

  if (pathname === '/admin/abuse-reports' && method === 'GET') {
    if (!Auth.isAdmin()) throw new Error('Administrator privileges required.');
    const abuseList = FindBackDB.getAll('abuse_reports');
    const reports = FindBackDB.getAll('reports');

    const enriched = abuseList.map(a => {
      const r = reports.find(rep => rep.id === a.report_id);
      return {
        ...a,
        reported_case_id: r ? r.case_id : null,
        reported_item_name: r ? r.item_name : 'Deleted Item'
      };
    });

    enriched.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { abuse_reports: enriched };
  }

  const adminAbuseStatusMatch = pathname.match(/^\/admin\/abuse-reports\/(\d+)\/status$/);
  if (adminAbuseStatusMatch && method === 'PUT') {
    if (!Auth.isAdmin()) throw new Error('Administrator privileges required.');
    const abuseId = Number(adminAbuseStatusMatch[1]);
    const status = body.status;

    FindBackDB.update('abuse_reports', abuseId, { status });
    return { message: 'Abuse report status updated.' };
  }

  if (pathname === '/admin/audit-logs' && method === 'GET') {
    if (!Auth.isAdmin()) throw new Error('Administrator privileges required.');
    const logs = FindBackDB.getAll('audit_logs');
    const users = FindBackDB.getAll('users');

    const enriched = logs.map(l => {
      const u = users.find(usr => usr.id === l.user_id);
      return {
        ...l,
        user_email: u ? u.email : 'System'
      };
    });

    enriched.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { logs: enriched };
  }

  throw new Error(`Endpoint not found: ${method} ${pathname}`);
}

function enrichMatch(m) {
  const lost = FindBackDB.getById('reports', m.lost_report_id) || {};
  const found = FindBackDB.getById('reports', m.found_report_id) || {};
  const cat = FindBackDB.getById('categories', lost.category_id) || {};

  const score = m.match_score;
  const confidence = score >= 80 ? 'High Confidence' : (score >= 60 ? 'Moderate Match' : 'Potential Match');

  return {
    ...m,
    confidence_level: confidence,
    lost_report: lost,
    found_report: found,
    breakdown: {
      category: `${m.category_score || 0} / 25 pts (${cat.name || 'General'})`,
      location: `${m.location_score || 0} / 25 pts`,
      date: `${m.date_score || 0} / 15 pts`,
      description: `${m.description_score || 0} / 20 pts`,
      characteristics: `${m.characteristic_score || 0} / 15 pts`
    }
  };
}

/**
 * UI Toast Alerts System
 */
function showToast(message, type = 'info', duration = 4000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const iconMap = {
    success: 'fa-circle-check',
    error: 'fa-circle-exclamation',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info'
  };

  const iconClass = iconMap[type] || iconMap.info;

  toast.innerHTML = `
    <i class="fa-solid ${iconClass}" style="margin-top: 2px; font-size: 1.1rem;"></i>
    <div style="flex: 1;">${message}</div>
    <button style="background: none; border: none; color: var(--text-muted); cursor: pointer;" onclick="this.parentElement.remove()">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Reusable Status Badges
 */
function getStatusBadge(status, reportType = 'LOST') {
  const map = {
    'ACTIVE': reportType === 'LOST' 
      ? '<span class="badge badge-lost"><i class="fa-solid fa-circle-exclamation"></i> Lost</span>'
      : '<span class="badge badge-found"><i class="fa-solid fa-hand-holding-heart"></i> Found</span>',
    'PENDING_CLAIM': '<span class="badge badge-pending"><i class="fa-solid fa-hourglass-half"></i> Pending Claim</span>',
    'HANDOVER': '<span class="badge badge-pending"><i class="fa-solid fa-handshake"></i> Handover</span>',
    'RETURNED': '<span class="badge badge-recovered"><i class="fa-solid fa-circle-check"></i> Recovered</span>',
    'CLOSED': '<span class="badge"><i class="fa-solid fa-lock"></i> Closed</span>',
    // Claims
    'PENDING': '<span class="badge badge-pending">Pending Review</span>',
    'UNDER_REVIEW': '<span class="badge badge-pending">Under Review</span>',
    'NEEDS_MORE_INFO': '<span class="badge badge-pending">Needs Info</span>',
    'APPROVED': '<span class="badge badge-found">Approved</span>',
    'REJECTED': '<span class="badge badge-lost">Rejected</span>',
    'COMPLETED': '<span class="badge badge-recovered">Recovered</span>'
  };
  return map[status] || `<span class="badge">${status}</span>`;
}

/**
 * Modal Manager
 */
function openModal(title, bodyHtml, footerButtons = '') {
  let modalEl = document.getElementById('global-modal');
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'global-modal';
    modalEl.className = 'modal-backdrop';
    modalEl.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 id="global-modal-title" style="font-size: 1.15rem;"></h3>
          <button class="modal-close" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body" id="global-modal-body"></div>
        <div class="modal-footer" id="global-modal-footer"></div>
      </div>
    `;
    document.body.appendChild(modalEl);
  }

  document.getElementById('global-modal-title').innerText = title;
  document.getElementById('global-modal-body').innerHTML = bodyHtml;
  document.getElementById('global-modal-footer').innerHTML = footerButtons;
  modalEl.classList.add('show');
}

function closeModal() {
  const modalEl = document.getElementById('global-modal');
  if (modalEl) {
    modalEl.classList.remove('show');
  }
}
