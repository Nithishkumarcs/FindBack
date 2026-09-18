/**
 * FindBack — Client-Side Local Database Engine (LocalStorage)
 * Pure JavaScript - 100% Serverless, Zero-Config GitHub Pages Ready
 */

const FindBackDB = (() => {
  const STORAGE_KEY_PREFIX = 'findback_db_';
  const SEED_VERSION = 'v2.0';

  // Demo Password Hashes / Plaintext for client verification
  // Admin: Admin@123456 | Users: User@123456
  const DEFAULT_PASSWORDS = {
    'admin@findback.org': 'Admin@123456',
    'sarah.jenkins@example.com': 'User@123456',
    'michael.chen@example.com': 'User@123456',
    'emily.davis@example.com': 'User@123456',
    'spammer@example.com': 'User@123456'
  };

  const DEFAULT_CATEGORIES = [
    { id: 1, name: 'Wallet', description: 'Wallets, purses, coin holders, money clips', icon: 'fa-wallet' },
    { id: 2, name: 'Phone', description: 'Smartphones, mobile phones, cellular devices', icon: 'fa-mobile-screen' },
    { id: 3, name: 'Laptop', description: 'Laptops, notebooks, MacBooks, tablets, chargers', icon: 'fa-laptop' },
    { id: 4, name: 'Bag', description: 'Backpacks, handbags, duffel bags, tote bags', icon: 'fa-bag-shopping' },
    { id: 5, name: 'Keys', description: 'Car keys, house keys, keychains, key fobs', icon: 'fa-key' },
    { id: 6, name: 'ID Card', description: 'College IDs, student badges, access cards, employee IDs', icon: 'fa-id-badge' },
    { id: 7, name: 'Documents', description: 'Passports, licenses, bank cards, certificates, files', icon: 'fa-file-lines' },
    { id: 8, name: 'Jewelry', description: 'Rings, watches, bracelets, necklaces, earrings', icon: 'fa-gem' },
    { id: 9, name: 'Electronics', description: 'Headphones, earbuds, power banks, cameras, smartwatches', icon: 'fa-headphones' },
    { id: 10, name: 'Books', description: 'Textbooks, notebooks, binders, stationery', icon: 'fa-book' },
    { id: 11, name: 'Accessories', description: 'Glasses, sunglasses, caps, scarves, umbrellas', icon: 'fa-glasses' },
    { id: 12, name: 'Other', description: 'Other miscellaneous items', icon: 'fa-shapes' }
  ];

  const DEFAULT_USERS = [
    {
      id: 1,
      name: 'System Administrator',
      email: 'admin@findback.org',
      password: 'Admin@123456',
      phone: '+1-555-0100',
      general_location: 'Central Admin Building',
      role: 'ADMIN',
      status: 'ACTIVE',
      created_at: '2026-09-01T08:00:00Z'
    },
    {
      id: 2,
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@example.com',
      password: 'User@123456',
      phone: '+1-555-0123',
      general_location: 'North Campus Quad',
      role: 'USER',
      status: 'ACTIVE',
      created_at: '2026-09-02T09:30:00Z'
    },
    {
      id: 3,
      name: 'Michael Chen',
      email: 'michael.chen@example.com',
      password: 'User@123456',
      phone: '+1-555-0145',
      general_location: 'West Engineering Complex',
      role: 'USER',
      status: 'ACTIVE',
      created_at: '2026-09-03T11:15:00Z'
    },
    {
      id: 4,
      name: 'Emily Davis',
      email: 'emily.davis@example.com',
      password: 'User@123456',
      phone: '+1-555-0189',
      general_location: 'Student Union Building',
      role: 'USER',
      status: 'ACTIVE',
      created_at: '2026-09-04T14:00:00Z'
    },
    {
      id: 5,
      name: 'Spam Poster',
      email: 'spammer@example.com',
      password: 'User@123456',
      phone: '+1-555-0999',
      general_location: 'Unknown',
      role: 'USER',
      status: 'BLOCKED',
      created_at: '2026-09-05T16:20:00Z'
    }
  ];

  const DEFAULT_REPORTS = [
    {
      id: 1,
      case_id: 'FB-2026-001001',
      user_id: 2,
      category_id: 1,
      report_type: 'LOST',
      item_name: 'Black Leather Bifold Wallet',
      description: 'Tommy Hilfiger black leather bifold wallet with silver logo plate on the corner. Lost near the main campus library study area.',
      report_date: '2026-09-08',
      report_time: '14:30',
      location_name: 'Main Campus Library 2nd Floor',
      latitude: 37.774929,
      longitude: -122.419416,
      image_path: null,
      condition_info: null,
      identifying_characteristics: 'Slight scratch near the inner fold, photo of a golden retriever inside bill compartment',
      preferred_contact: 'Email',
      contact_name: 'Sarah (ECE 3rd Year)',
      contact_phone: '9876543210',
      is_sensitive: false,
      status: 'PENDING_CLAIM',
      created_at: '2026-09-08T15:00:00Z'
    },
    {
      id: 2,
      case_id: 'FB-2026-001002',
      user_id: 3,
      category_id: 1,
      report_type: 'FOUND',
      item_name: 'Black Leather Wallet',
      description: 'Found a men\'s black leather wallet on a wooden desk near the 2nd floor silent reading zone of the library.',
      report_date: '2026-09-08',
      report_time: '16:00',
      location_name: 'Main Campus Library 2nd Floor',
      latitude: 37.775100,
      longitude: -122.419200,
      image_path: null,
      condition_info: 'Good condition with cards inside',
      identifying_characteristics: 'Brand logo on front corner, inner pocket items',
      preferred_contact: 'In-App',
      contact_name: 'Michael (Library Assistant)',
      contact_phone: '9845123456',
      is_sensitive: false,
      status: 'PENDING_CLAIM',
      created_at: '2026-09-08T16:30:00Z'
    },
    {
      id: 3,
      case_id: 'FB-2026-001003',
      user_id: 3,
      category_id: 3,
      report_type: 'LOST',
      item_name: 'Dell XPS 15 Silver Laptop',
      description: 'Silver Dell XPS 15 with carbon fiber palm rest in a grey neoprene sleeve. Contains urgent coursework.',
      report_date: '2026-09-09',
      report_time: '10:00',
      location_name: 'Engineering Hall Room 302',
      latitude: 37.776200,
      longitude: -122.421500,
      image_path: null,
      condition_info: null,
      identifying_characteristics: 'Octocat sticker and Python logo sticker on outer lid',
      preferred_contact: 'Phone',
      contact_name: 'Michael Chen (CSE)',
      contact_phone: '9845123456',
      is_sensitive: false,
      status: 'ACTIVE',
      created_at: '2026-09-09T10:45:00Z'
    },
    {
      id: 4,
      case_id: 'FB-2026-001004',
      user_id: 4,
      category_id: 3,
      report_type: 'FOUND',
      item_name: 'Silver Dell Laptop in Sleeve',
      description: 'Found a silver laptop inside a dark protective zippered sleeve left behind on the bench outside lab 304.',
      report_date: '2026-09-09',
      report_time: '12:15',
      location_name: 'Engineering Hall 3rd Floor Corridor',
      latitude: 37.776300,
      longitude: -122.421400,
      image_path: null,
      condition_info: 'Working, screen clean',
      identifying_characteristics: 'Multiple developer stickers on top cover',
      preferred_contact: 'In-App',
      contact_name: 'Emily Davis (Mech Dept)',
      contact_phone: '9443211234',
      is_sensitive: false,
      status: 'ACTIVE',
      created_at: '2026-09-09T12:45:00Z'
    },
    {
      id: 5,
      case_id: 'FB-2026-001005',
      user_id: 4,
      category_id: 6,
      report_type: 'FOUND',
      item_name: 'University Student ID Card',
      description: 'Found a magnetic barcode student identity card near the cafeteria turnstile.',
      report_date: '2026-09-10',
      report_time: '13:00',
      location_name: 'Central Dining Commons',
      latitude: 37.773500,
      longitude: -122.418000,
      image_path: null,
      condition_info: 'Intact with lanyard clip',
      identifying_characteristics: 'Department name: Computer Science',
      preferred_contact: 'In-App',
      contact_name: 'Dining Commons Help Desk',
      contact_phone: '9123456789',
      is_sensitive: true,
      status: 'ACTIVE',
      created_at: '2026-09-10T13:20:00Z'
    },
    {
      id: 6,
      case_id: 'FB-2026-001006',
      user_id: 2,
      category_id: 5,
      report_type: 'LOST',
      item_name: 'Toyota Car Key with Blue Carabiner',
      description: 'Toyota electronic key fob with blue aluminum carabiner and silver gym tag.',
      report_date: '2026-09-05',
      report_time: '09:00',
      location_name: 'North Parking Lot Sector B',
      latitude: 37.777000,
      longitude: -122.416000,
      image_path: null,
      condition_info: null,
      identifying_characteristics: 'Slight crack on lock button',
      preferred_contact: 'In-App',
      contact_name: 'Sarah Jenkins',
      contact_phone: '9876543210',
      is_sensitive: false,
      status: 'RETURNED',
      created_at: '2026-09-05T09:30:00Z'
    },
    {
      id: 7,
      case_id: 'FB-2026-001007',
      user_id: 3,
      category_id: 5,
      report_type: 'FOUND',
      item_name: 'Electronic Car Key Fob on Blue Ring',
      description: 'Found car keys with keychain dropped in parking bay 14.',
      report_date: '2026-09-05',
      report_time: '11:00',
      location_name: 'North Parking Lot Sector B',
      latitude: 37.777050,
      longitude: -122.416050,
      image_path: null,
      condition_info: 'Functional',
      identifying_characteristics: 'Blue carabiner attached',
      preferred_contact: 'In-App',
      is_sensitive: false,
      status: 'RETURNED',
      created_at: '2026-09-05T11:30:00Z'
    }
  ];

  const DEFAULT_VERIFICATION_QUESTIONS = [
    { id: 1, report_id: 2, question: 'What specific picture or card is kept inside the bill compartment?', expected_answer: 'Photo of a golden retriever' },
    { id: 2, report_id: 2, question: 'What is the brand printed or stamped on the corner plate?', expected_answer: 'Tommy Hilfiger' },
    { id: 3, report_id: 4, question: 'Name at least two stickers on the laptop lid.', expected_answer: 'Octocat and Python' },
    { id: 4, report_id: 5, question: 'What is the student ID card number ending with (last 4 digits)?', expected_answer: '9412' }
  ];

  const DEFAULT_MATCHES = [
    {
      id: 1,
      lost_report_id: 1,
      found_report_id: 2,
      match_score: 91.5,
      category_score: 25.0,
      location_score: 25.0,
      date_score: 15.0,
      description_score: 14.5,
      characteristic_score: 12.0,
      status: 'CLAIMED',
      created_at: '2026-09-08T16:31:00Z'
    },
    {
      id: 2,
      lost_report_id: 3,
      found_report_id: 4,
      match_score: 88.0,
      category_score: 25.0,
      location_score: 25.0,
      date_score: 15.0,
      description_score: 12.0,
      characteristic_score: 11.0,
      status: 'SUGGESTED',
      created_at: '2026-09-09T12:46:00Z'
    },
    {
      id: 3,
      lost_report_id: 6,
      found_report_id: 7,
      match_score: 95.0,
      category_score: 25.0,
      location_score: 25.0,
      date_score: 15.0,
      description_score: 15.0,
      characteristic_score: 15.0,
      status: 'CLAIMED',
      created_at: '2026-09-05T11:31:00Z'
    }
  ];

  const DEFAULT_CLAIMS = [
    {
      id: 1,
      match_id: 1,
      report_id: 2,
      claimant_id: 2,
      finder_id: 3,
      verification_response: {
        q1: 'Photo of my golden retriever dog',
        q2: 'Tommy Hilfiger'
      },
      status: 'UNDER_REVIEW',
      reviewer_id: 1,
      review_notes: 'Verification details match expected item notes closely. Ready for handover coordination.',
      handover_date: '2026-09-12T15:00:00Z',
      handover_location: 'Campus Security Information Desk',
      confirmed_by_claimant: false,
      confirmed_by_finder: false,
      completed_at: null,
      created_at: '2026-09-08T17:00:00Z'
    },
    {
      id: 2,
      match_id: 3,
      report_id: 7,
      claimant_id: 2,
      finder_id: 3,
      verification_response: {
        general_proof: 'Toyota key fob with blue aluminum carabiner and gym tag'
      },
      status: 'COMPLETED',
      reviewer_id: 1,
      review_notes: 'Verified in person with vehicle unlock test. Item returned safely.',
      handover_date: '2026-09-06T14:00:00Z',
      handover_location: 'North Parking Security Office',
      confirmed_by_claimant: true,
      confirmed_by_finder: true,
      completed_at: '2026-09-06T14:15:00Z',
      created_at: '2026-09-05T12:00:00Z'
    }
  ];

  const DEFAULT_NOTIFICATIONS = [
    {
      id: 1,
      user_id: 2,
      type: 'MATCH_FOUND',
      title: 'High Potential Match Detected',
      message: 'A found Black Leather Wallet matches your lost report with 91.5% confidence score.',
      link: 'matches.html?report_id=1',
      is_read: false,
      created_at: '2026-09-08T16:32:00Z'
    },
    {
      id: 2,
      user_id: 3,
      type: 'CLAIM_SUBMITTED',
      title: 'Ownership Claim Received',
      message: 'Sarah Jenkins submitted an ownership claim with verification answers for your found item.',
      link: 'claims.html',
      is_read: false,
      created_at: '2026-09-08T17:05:00Z'
    },
    {
      id: 3,
      user_id: 3,
      type: 'MATCH_FOUND',
      title: 'Potential Match for Laptop',
      message: 'A silver Dell Laptop matching your lost report was found in Engineering Hall.',
      link: 'matches.html?report_id=3',
      is_read: false,
      created_at: '2026-09-09T12:47:00Z'
    },
    {
      id: 4,
      user_id: 2,
      type: 'RECOVERY_CONFIRMED',
      title: 'Item Recovery Confirmed',
      message: 'Your Toyota Car Key has been marked as safely recovered. Case closed.',
      link: 'claims.html',
      is_read: true,
      created_at: '2026-09-06T14:20:00Z'
    }
  ];

  const DEFAULT_ABUSE_REPORTS = [
    {
      id: 1,
      reporter_id: 4,
      report_id: 1,
      reason: 'Other',
      description: 'Initial check on duplicate listing report; resolved as genuine report.',
      status: 'REVIEWED',
      reviewed_by: 1,
      created_at: '2026-09-08T18:00:00Z',
      reviewed_at: '2026-09-08T19:00:00Z'
    }
  ];

  const DEFAULT_AUDIT_LOGS = [
    {
      id: 1,
      user_id: 1,
      action: 'SYSTEM_INITIALIZED',
      entity_type: 'SYSTEM',
      entity_id: 1,
      metadata: { version: '2.0.0', engine: 'rule-based-matching-client' },
      created_at: '2026-09-01T08:00:00Z'
    },
    {
      id: 2,
      user_id: 2,
      action: 'REPORT_CREATED',
      entity_type: 'REPORT',
      entity_id: 1,
      metadata: { type: 'LOST', case_id: 'FB-2026-001001', category: 'Wallet' },
      created_at: '2026-09-08T15:00:00Z'
    },
    {
      id: 3,
      user_id: 3,
      action: 'REPORT_CREATED',
      entity_type: 'REPORT',
      entity_id: 2,
      metadata: { type: 'FOUND', case_id: 'FB-2026-001002', category: 'Wallet' },
      created_at: '2026-09-08T16:30:00Z'
    },
    {
      id: 4,
      user_id: 1,
      action: 'MATCH_COMPUTED',
      entity_type: 'MATCH',
      entity_id: 1,
      metadata: { score: 91.5, lost_id: 1, found_id: 2 },
      created_at: '2026-09-08T16:31:00Z'
    },
    {
      id: 5,
      user_id: 2,
      action: 'CLAIM_SUBMITTED',
      entity_type: 'CLAIM',
      entity_id: 1,
      metadata: { match_id: 1, report_id: 2 },
      created_at: '2026-09-08T17:00:00Z'
    },
    {
      id: 6,
      user_id: 1,
      action: 'USER_BLOCKED',
      entity_type: 'USER',
      entity_id: 5,
      metadata: { reason: 'Spam and suspicious report creation activity' },
      created_at: '2026-09-05T16:30:00Z'
    },
    {
      id: 7,
      user_id: 1,
      action: 'CLAIM_COMPLETED',
      entity_type: 'CLAIM',
      entity_id: 2,
      metadata: { status: 'COMPLETED', recovery_confirmed: true },
      created_at: '2026-09-06T14:15:00Z'
    }
  ];

  // Storage Methods
  function getKey(collection) {
    return `${STORAGE_KEY_PREFIX}${collection}`;
  }

  function getCollection(collection) {
    try {
      const data = localStorage.getItem(getKey(collection));
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`Error reading ${collection} from storage:`, e);
      return [];
    }
  }

  function setCollection(collection, items) {
    try {
      localStorage.setItem(getKey(collection), JSON.stringify(items));
    } catch (e) {
      console.error(`Error writing ${collection} to storage:`, e);
    }
  }

  function initDatabase(force = false) {
    const initialized = localStorage.getItem(`${STORAGE_KEY_PREFIX}initialized`);
    if (!initialized || initialized !== SEED_VERSION || force) {
      setCollection('categories', DEFAULT_CATEGORIES);
      setCollection('users', DEFAULT_USERS);
      setCollection('reports', DEFAULT_REPORTS);
      setCollection('verification_questions', DEFAULT_VERIFICATION_QUESTIONS);
      setCollection('matches', DEFAULT_MATCHES);
      setCollection('claims', DEFAULT_CLAIMS);
      setCollection('notifications', DEFAULT_NOTIFICATIONS);
      setCollection('abuse_reports', DEFAULT_ABUSE_REPORTS);
      setCollection('audit_logs', DEFAULT_AUDIT_LOGS);
      localStorage.setItem(`${STORAGE_KEY_PREFIX}initialized`, SEED_VERSION);
      console.log('FindBack Local Database initialized with comprehensive demo data.');
    }
  }

  // Auto-init on load
  initDatabase();

  return {
    init: initDatabase,
    reset() {
      initDatabase(true);
    },
    getAll(collection) {
      return getCollection(collection);
    },
    getById(collection, id) {
      const numId = Number(id);
      return getCollection(collection).find(item => item.id === numId) || null;
    },
    filter(collection, predicate) {
      return getCollection(collection).filter(predicate);
    },
    find(collection, predicate) {
      return getCollection(collection).find(predicate) || null;
    },
    insert(collection, item) {
      const items = getCollection(collection);
      const maxId = items.reduce((max, i) => Math.max(max, i.id || 0), 0);
      const newItem = {
        ...item,
        id: item.id || (maxId + 1),
        created_at: item.created_at || new Date().toISOString()
      };
      items.push(newItem);
      setCollection(collection, items);
      return newItem;
    },
    update(collection, id, updates) {
      const numId = Number(id);
      const items = getCollection(collection);
      const index = items.findIndex(i => i.id === numId);
      if (index === -1) return null;

      items[index] = {
        ...items[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      setCollection(collection, items);
      return items[index];
    },
    delete(collection, id) {
      const numId = Number(id);
      const items = getCollection(collection);
      const filtered = items.filter(i => i.id !== numId);
      setCollection(collection, filtered);
      return filtered.length !== items.length;
    },
    generateCaseId() {
      const year = new Date().getFullYear();
      const rand = Math.floor(100000 + Math.random() * 900000);
      return `FB-${year}-${rand}`;
    },
    logAudit(userId, action, entityType, entityId, metadata = {}) {
      this.insert('audit_logs', {
        user_id: userId || 1,
        action,
        entity_type: entityType,
        entity_id: entityId,
        metadata
      });
    }
  };
})();
