/**
 * Audit Helper Utilities
 * Functions for analyzing and processing audit data
 */

/**
 * Calculate audit status based on ratio
 * @param {number} ratio - Audit ratio from user data
 * @returns {Object} Status information
 */
export function calculateAuditRatio(ratio) {
  return {
    ratio,
    isBalanced: ratio >= 1.0,
    needsAudits: ratio < 0.8,
    upToDate: ratio >= 1.0
  };
}

/**
 * Transform audit data
 * @param {Object} auditData - Audit data from GraphQL
 * @returns {Object} Processed audit data
 */
export function transformAuditData(auditData) {
  if (!auditData || (!auditData.auditsDone && !auditData.auditsReceived)) {
    return {
      done: 0,
      received: 0,
      doneAmount: 0,
      receivedAmount: 0,
      ratio: 1,
      upToDate: true,
      history: []
    };
  }
  
  // Get the correct audit records
  const auditsDone = auditData.auditsDone || [];
  const auditsReceived = auditData.auditsReceived || [];
  
  // Calculate counts
  const done = auditsDone.length;
  const received = auditsReceived.length;
  
  // Calculate audit ratio and status based on arrays of transactions
  const ratioStats = calculateAuditRatio(auditsDone, auditsReceived);
  
  // Get detailed audit statistics
  const details = analyzeAuditDetails(auditsDone, auditsReceived);
  
  // Get audit history trend
  const history = getAuditHistoryTrend(auditsDone, auditsReceived);
  
  return {
    done,
    received,
    doneAmount: ratioStats.doneAmount,
    receivedAmount: ratioStats.receivedAmount,
    ratio: ratioStats.ratio,
    upToDate: ratioStats.upToDate,
    needsAudits: ratioStats.needsAudits,
    details,
    history
  };
}
/**
 * Analyze audit detail statistics based on transaction data
 * @param {Array} auditsDone - "up" transactions completed by the user
 * @param {Array} auditsReceived - "down" transactions received by the user
 * @returns {Object} Detailed audit statistics
 */
export function analyzeAuditDetails(auditsDone, auditsReceived) {
  // Average amount for done audits (up transactions)
  const doneAvgAmount = auditsDone.reduce((sum, audit) => sum + (audit.amount || 0), 0) / 
                        (auditsDone.length || 1);
  
  // Average amount for received audits (down transactions)
  const receivedAvgAmount = auditsReceived.reduce((sum, audit) => sum + (audit.amount || 0), 0) / 
                           (auditsReceived.length || 1);
  
  // Group by project
  const byProject = {};
  
  // Process done audits
  auditsDone.forEach(audit => {
    const projectName = audit.object?.name || 'Unknown';
    if (!byProject[projectName]) {
      byProject[projectName] = {
        done: 0,
        received: 0,
        totalAmount: 0,
        count: 0
      };
    }
    
    byProject[projectName].done++;
    byProject[projectName].totalAmount += (audit.amount || 0);
    byProject[projectName].count++;
  });
  
  // Process received audits
  auditsReceived.forEach(audit => {
    const projectName = audit.object?.name || 'Unknown';
    if (!byProject[projectName]) {
      byProject[projectName] = {
        done: 0,
        received: 0,
        totalAmount: 0,
        count: 0
      };
    }
    
    byProject[projectName].received++;
    byProject[projectName].totalAmount += (audit.amount || 0);
    byProject[projectName].count++;
  });
  
  // Calculate average amounts for each project
  Object.keys(byProject).forEach(project => {
    byProject[project].averageAmount = byProject[project].totalAmount / byProject[project].count;
  });
  
  // Calculate historical trend (last 5 audits)
  const recentDone = auditsDone.slice(0, 5);  // Already sorted by createdAt desc
  const recentReceived = auditsReceived.slice(0, 5);  // Already sorted by createdAt desc
  
  const recentDoneCount = recentDone.length;
  const recentReceivedCount = recentReceived.length;
  
  return {
    averageAmounts: {
      done: doneAvgAmount,
      received: receivedAvgAmount
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
 * Get audit history trend based on transaction data
 * @param {Array} auditsDone - "up" transactions completed by the user
 * @param {Array} auditsReceived - "down" transactions received by the user
 * @returns {Array} Audit history with monthly data points
 */
export function getAuditHistoryTrend(auditsDone, auditsReceived) {
  // Create a map of months
  const monthsMap = {};
  
  // Ensure we're working with arrays
  const doneArray = Array.isArray(auditsDone) ? auditsDone : [];
  const receivedArray = Array.isArray(auditsReceived) ? auditsReceived : [];
  
  // If no data, return at least one placeholder data point to prevent "no data" message
  if (doneArray.length === 0 && receivedArray.length === 0) {
    const currentDate = new Date();
    return [{
      month: `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`,
      done: 0,
      received: 0,
      doneAmount: 0,
      receivedAmount: 0,
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
      ratio: 1
    }];
  }
  
  // Process done audits from "up" transactions
  doneArray.forEach(audit => {
    const date = new Date(audit.createdAt);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    
    if (!monthsMap[monthKey]) {
      monthsMap[monthKey] = {
        month: monthKey,
        done: 0,
        received: 0,
        doneAmount: 0,
        receivedAmount: 0,
        date: new Date(date.getFullYear(), date.getMonth(), 1)
      };
    }
    
    monthsMap[monthKey].done++;
    monthsMap[monthKey].doneAmount += (audit.amount || 0);
  });
  
  // Process received audits from "down" transactions
  receivedArray.forEach(audit => {
    const date = new Date(audit.createdAt);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    
    if (!monthsMap[monthKey]) {
      monthsMap[monthKey] = {
        month: monthKey,
        done: 0,
        received: 0,
        doneAmount: 0,
        receivedAmount: 0,
        date: new Date(date.getFullYear(), date.getMonth(), 1)
      };
    }
    
    monthsMap[monthKey].received++;
    monthsMap[monthKey].receivedAmount += (audit.amount || 0);
  });
  
  // Convert to array and sort by date
  const history = Object.values(monthsMap)
    .map(month => ({
      ...month,
      ratio: month.receivedAmount > 0 ? month.doneAmount / month.receivedAmount : 
             month.doneAmount > 0 ? 1 : 1 // Simplify the fallback logic
    }))
    .sort((a, b) => a.date - b.date);
  
  // Ensure we have at least one data point
  if (history.length === 0) {
    const currentDate = new Date();
    history.push({
      month: `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`,
      done: 0,
      received: 0,
      doneAmount: 0,
      receivedAmount: 0,
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
      ratio: 1
    });
  }
  
  return history;
}
export default {
  calculateAuditRatio,
  analyzeAuditDetails,
  getAuditHistoryTrend
}; 