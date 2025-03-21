/**
 * Audit Helper Utilities
 * Functions for analyzing and processing audit data
 */

/**
 * Calculate audit ratio and status
 * @param {number} done - Number of audits done
 * @param {number} received - Number of audits received
 * @returns {Object} Ratio and status information
 */
export function calculateAuditRatio(done, received) {
  // Prevent division by zero
  if (received === 0) {
    return {
      ratio: done > 0 ? done : 1,
      isBalanced: true,
      needsAudits: false,
      upToDate: true
    };
  }

  const ratio = done / received;
  
  return {
    ratio,
    isBalanced: ratio >= 1.0,
    needsAudits: ratio < 0.8,
    upToDate: ratio >= 1.0
  };
}

/**
 * Analyze audit detail statistics
 * @param {Array} auditsDone - Audits completed by the user
 * @param {Array} auditsReceived - Audits received by the user
 * @returns {Object} Detailed audit statistics
 */
export function analyzeAuditDetails(auditsDone, auditsReceived) {
  // Calculate averages
  const doneAvgGrade = auditsDone.reduce((sum, audit) => sum + (audit.grade || 0), 0) / 
                        (auditsDone.length || 1);
  
  const receivedAvgGrade = auditsReceived.reduce((sum, audit) => sum + (audit.grade || 0), 0) / 
                            (auditsReceived.length || 1);
  
  // Group by project
  const byProject = {};
  
  auditsDone.forEach(audit => {
    const projectName = audit.object?.name || 'Unknown';
    if (!byProject[projectName]) {
      byProject[projectName] = {
        done: 0,
        received: 0,
        averageGrade: 0,
        totalGrade: 0,
        count: 0
      };
    }
    
    byProject[projectName].done++;
    byProject[projectName].totalGrade += (audit.grade || 0);
    byProject[projectName].count++;
  });
  
  auditsReceived.forEach(audit => {
    const projectName = audit.object?.name || 'Unknown';
    if (!byProject[projectName]) {
      byProject[projectName] = {
        done: 0,
        received: 0,
        averageGrade: 0,
        totalGrade: 0,
        count: 0
      };
    }
    
    byProject[projectName].received++;
    byProject[projectName].totalGrade += (audit.grade || 0);
    byProject[projectName].count++;
  });
  
  // Calculate average grades for each project
  Object.keys(byProject).forEach(project => {
    byProject[project].averageGrade = byProject[project].totalGrade / byProject[project].count;
  });
  
  // Calculate historical trend (last 5 audits)
  const recentDone = auditsDone.slice(-5);
  const recentReceived = auditsReceived.slice(-5);
  
  const recentDoneCount = recentDone.length;
  const recentReceivedCount = recentReceived.length;
  
  return {
    averageGrades: {
      done: doneAvgGrade,
      received: receivedAvgGrade
    },
    byProject: Object.entries(byProject).map(([name, stats]) => ({
      name,
      ...stats
    })),
    recent: {
      done: recentDoneCount,
      received: recentReceivedCount,
      ratio: recentDoneCount / (recentReceivedCount || 1)
    }
  };
}

/**
 * Get audit history trend
 * @param {Array} auditsDone - Audits completed by the user, sorted by date
 * @param {Array} auditsReceived - Audits received by the user, sorted by date
 * @returns {Array} Audit history with monthly data points
 */
export function getAuditHistoryTrend(auditsDone, auditsReceived) {
  // Create a map of months
  const monthsMap = {};
  
  // Process done audits
  auditsDone.forEach(audit => {
    const date = new Date(audit.createdAt);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    
    if (!monthsMap[monthKey]) {
      monthsMap[monthKey] = {
        month: monthKey,
        done: 0,
        received: 0,
        date: new Date(date.getFullYear(), date.getMonth(), 1)
      };
    }
    
    monthsMap[monthKey].done++;
  });
  
  // Process received audits
  auditsReceived.forEach(audit => {
    const date = new Date(audit.createdAt);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    
    if (!monthsMap[monthKey]) {
      monthsMap[monthKey] = {
        month: monthKey,
        done: 0,
        received: 0,
        date: new Date(date.getFullYear(), date.getMonth(), 1)
      };
    }
    
    monthsMap[monthKey].received++;
  });
  
  // Convert to array and sort by date
  return Object.values(monthsMap)
    .map(month => ({
      ...month,
      ratio: month.done / (month.received || 1)
    }))
    .sort((a, b) => a.date - b.date);
}

export default {
  calculateAuditRatio,
  analyzeAuditDetails,
  getAuditHistoryTrend
}; 