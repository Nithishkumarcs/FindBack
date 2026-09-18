/**
 * FindBack — 100-Point Rule-Based Matching Engine & Safety Verification
 * Pure JavaScript - 100% Client-Side Matching Algorithm
 */

const MatchingEngine = (() => {
  const STOPWORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'with', 'by',
    'of', 'is', 'was', 'are', 'were', 'it', 'its', 'near', 'found', 'lost',
    'left', 'behind', 'my', 'some', 'this', 'that', 'from'
  ]);

  const SENSITIVE_KEYWORDS = [
    'passport', 'driving license', 'driver license', 'driver\'s license',
    'id card', 'student id', 'college id', 'university id', 'employee id',
    'identity card', 'bank card', 'credit card', 'debit card', 'atm card',
    'social security', 'ssn', 'national id', 'pan card', 'aadhaar', 'aadhar',
    'birth certificate', 'citizenship card', 'visa card', 'mastercard'
  ];

  function tokenize(text) {
    if (!text || typeof text !== 'string') return new Set();
    const words = text.toLowerCase().match(/[a-z0-9]+/g) || [];
    const tokens = new Set();
    words.forEach(w => {
      if (w.length > 2 && !STOPWORDS.has(w)) {
        tokens.add(w);
      }
    });
    return tokens;
  }

  function setIntersection(setA, setB) {
    const intersection = new Set();
    for (const elem of setB) {
      if (setA.has(elem)) intersection.add(elem);
    }
    return intersection;
  }

  function setUnion(setA, setB) {
    const union = new Set(setA);
    for (const elem of setB) {
      union.add(elem);
    }
    return union;
  }

  function haversineDistance(lat1, lon1, lat2, lon2) {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
      return null;
    }
    const R = 6371.0; // Radius of Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180.0);
    const dLon = (lon2 - lon1) * (Math.PI / 180.0);
    const rLat1 = lat1 * (Math.PI / 180.0);
    const rLat2 = lat2 * (Math.PI / 180.0);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(rLat1) * Math.cos(rLat2) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  return {
    tokenize,
    haversineDistance,

    calculateCategoryScore(lost, found) {
      if (Number(lost.category_id) === Number(found.category_id)) {
        return 25.0;
      }
      const lostTokens = tokenize(lost.item_name);
      const foundTokens = tokenize(found.item_name);
      const overlap = setIntersection(lostTokens, foundTokens);
      if (overlap.size > 0) {
        return 12.0;
      }
      return 0.0;
    },

    calculateLocationScore(lost, found) {
      const dist = haversineDistance(lost.latitude, lost.longitude, found.latitude, found.longitude);
      if (dist !== null) {
        if (dist <= 0.5) return 25.0;
        if (dist <= 2.0) return 20.0;
        if (dist <= 5.0) return 15.0;
        if (dist <= 15.0) return 8.0;
        return 0.0;
      }

      // Fallback to location name token overlap
      const loc1 = tokenize(lost.location_name);
      const loc2 = tokenize(found.location_name);
      const overlap = setIntersection(loc1, loc2);
      if (overlap.size > 0) {
        return Math.min(25.0, 10.0 + (overlap.size * 5.0));
      }
      return 0.0;
    },

    calculateDateScore(lost, found) {
      if (!lost.report_date || !found.report_date) return 0.0;
      const d1 = new Date(lost.report_date);
      const d2 = new Date(found.report_date);
      const diffDays = Math.abs(Math.round((d1 - d2) / (1000 * 60 * 60 * 24)));

      if (diffDays === 0) return 15.0;
      if (diffDays === 1) return 12.0;
      if (diffDays <= 3) return 8.0;
      if (diffDays <= 7) return 4.0;
      return 0.0;
    },

    calculateDescriptionScore(lost, found) {
      const text1 = `${lost.item_name || ''} ${lost.description || ''}`;
      const text2 = `${found.item_name || ''} ${found.description || ''}`;
      const t1 = tokenize(text1);
      const t2 = tokenize(text2);

      if (t1.size === 0 || t2.size === 0) return 0.0;
      const intersection = setIntersection(t1, t2);
      const union = setUnion(t1, t2);

      if (union.size === 0) return 0.0;
      const jaccard = intersection.size / union.size;
      const score = Math.min(20.0, (jaccard * 15.0) + (Math.min(intersection.size, 5) * 1.5));
      return Math.round(score * 10) / 10;
    },

    calculateCharacteristicScore(lost, found) {
      const c1 = lost.identifying_characteristics || '';
      const c2 = found.identifying_characteristics || '';

      if (!c1 || !c2) return 3.0; // neutral credit
      const t1 = tokenize(c1);
      const t2 = tokenize(c2);

      if (t1.size === 0 || t2.size === 0) return 3.0;
      const overlap = setIntersection(t1, t2).size;

      if (overlap >= 3) return 15.0;
      if (overlap === 2) return 11.0;
      if (overlap === 1) return 7.0;
      return 2.0;
    },

    evaluatePair(lost, found) {
      const cat = this.calculateCategoryScore(lost, found);
      const loc = this.calculateLocationScore(lost, found);
      const date = this.calculateDateScore(lost, found);
      const desc = this.calculateDescriptionScore(lost, found);
      const char = this.calculateCharacteristicScore(lost, found);

      const total = Math.min(100.0, Math.max(0.0, Math.round((cat + loc + date + desc + char) * 10) / 10));

      return {
        total_score: total,
        category_score: cat,
        location_score: loc,
        date_score: date,
        description_score: desc,
        characteristic_score: char
      };
    },

    runMatchingForReport(report) {
      if (!['ACTIVE', 'PENDING_CLAIM'].includes(report.status)) return [];

      const isLost = report.report_type === 'LOST';
      const targetType = isLost ? 'FOUND' : 'LOST';

      const candidates = FindBackDB.filter('reports', r => 
        r.report_type === targetType &&
        ['ACTIVE', 'PENDING_CLAIM'].includes(r.status) &&
        Number(r.user_id) !== Number(report.user_id)
      );

      const createdMatches = [];

      candidates.forEach(cand => {
        const lost = isLost ? report : cand;
        const found = isLost ? cand : report;

        const scores = this.evaluatePair(lost, found);
        const total = scores.total_score;

        if (total >= 40.0) {
          const existing = FindBackDB.find('matches', m => 
            Number(m.lost_report_id) === Number(lost.id) &&
            Number(m.found_report_id) === Number(found.id)
          );

          if (!existing) {
            const newMatch = FindBackDB.insert('matches', {
              lost_report_id: lost.id,
              found_report_id: found.id,
              match_score: total,
              category_score: scores.category_score,
              location_score: scores.location_score,
              date_score: scores.date_score,
              description_score: scores.description_score,
              characteristic_score: scores.characteristic_score,
              status: 'SUGGESTED'
            });
            createdMatches.push(newMatch);

            // Notify candidate report owner if high confidence
            if (total >= 60.0) {
              FindBackDB.insert('notifications', {
                user_id: cand.user_id,
                type: 'MATCH_FOUND',
                title: `Potential Match Detected (${Math.round(total)}%)`,
                message: `A newly reported item '${report.item_name}' matches your report '${cand.item_name}'.`,
                link: `matches.html?report_id=${cand.id}`,
                is_read: false
              });
            }
          } else {
            const updated = FindBackDB.update('matches', existing.id, {
              match_score: total,
              category_score: scores.category_score,
              location_score: scores.location_score,
              date_score: scores.date_score,
              description_score: scores.description_score,
              characteristic_score: scores.characteristic_score
            });
            createdMatches.push(updated);
          }
        }
      });

      return createdMatches;
    },

    checkForDuplicates(userId, reportType, categoryId, itemName, reportDate, locationName, latitude, longitude, description) {
      if (!itemName || !reportDate) return { is_duplicate: false };

      const minDate = new Date(reportDate);
      minDate.setDate(minDate.getDate() - 7);
      const maxDate = new Date(reportDate);
      maxDate.setDate(maxDate.getDate() + 7);

      const candidates = FindBackDB.filter('reports', r => {
        if (r.report_type !== reportType || Number(r.category_id) !== Number(categoryId)) return false;
        if (!['ACTIVE', 'PENDING_CLAIM'].includes(r.status)) return false;
        const rDate = new Date(r.report_date);
        return rDate >= minDate && rDate <= maxDate;
      });

      const inputTokens = tokenize(`${itemName} ${description || ''}`);

      for (const r of candidates) {
        const isSameUser = Number(r.user_id) === Number(userId);
        const dist = haversineDistance(latitude, longitude, r.latitude, r.longitude);
        const rTokens = tokenize(`${r.item_name} ${r.description || ''}`);
        const intersection = setIntersection(inputTokens, rTokens);

        if (isSameUser && intersection.size >= 2) {
          return {
            is_duplicate: true,
            existing_report_id: r.id,
            existing_case_id: r.case_id,
            existing_item_name: r.item_name,
            message: 'A similar report already exists in your account. Please review it before submitting.'
          };
        }

        if (intersection.size >= 3 && ((dist !== null && dist <= 1.0) || (locationName && r.location_name && r.location_name.toLowerCase().includes(locationName.toLowerCase())))) {
          return {
            is_duplicate: true,
            existing_report_id: r.id,
            existing_case_id: r.case_id,
            existing_item_name: r.item_name,
            message: 'A very similar report has already been submitted for this area. Please check existing listings.'
          };
        }
      }

      return { is_duplicate: false };
    },

    isItemSensitive(categoryName, itemName, description) {
      const catLower = (categoryName || '').toLowerCase().trim();
      if (['id card', 'documents'].includes(catLower)) return true;

      const combined = `${itemName || ''} ${description || ''}`.toLowerCase();
      for (const kw of SENSITIVE_KEYWORDS) {
        if (combined.includes(kw)) return true;
      }
      return false;
    },

    maskSensitiveText(text) {
      if (!text) return text;
      return text.replace(/\b\d{4,16}\b/g, '••••••••');
    }
  };
})();
