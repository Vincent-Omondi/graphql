/**
 * Data Transformer Utilities
 * Functions for transforming GraphQL data for charts and display
 */
import { calculateAuditRatio, analyzeAuditDetails, getAuditHistoryTrend } from './auditHelpers.js';

/**
 * Transform XP transaction data for charts
 * @param {Array} transactions - XP transactions from GraphQL
 * @returns {Object} Processed data for XP charts
 */
export function transformXpData(transactions) {
  if (!transactions || transactions.length === 0) {
    return {
      total: 0,
      byDate: [],
      byProject: []
    };
  }
  
  // Calculate total XP
  const total = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  
  // Group by date for line chart
  const dateMap = {};
  transactions.forEach(transaction => {
    const date = new Date(transaction.createdAt).toLocaleDateString('en-US');
    if (!dateMap[date]) {
      dateMap[date] = {
        date: new Date(transaction.createdAt),
        amount: 0
      };
    }
    dateMap[date].amount += transaction.amount;
  });
  
  // Sort by date and calculate cumulative values
  const byDate = Object.values(dateMap)
    .sort((a, b) => a.date - b.date)
    .map((item, index, array) => {
      // Calculate cumulative amount
      const cumulativeAmount = array
        .slice(0, index + 1)
        .reduce((sum, entry) => sum + entry.amount, 0);
      
      return {
        date: item.date,
        amount: item.amount,
        cumulativeAmount
      };
    });
  
  // Group by project for bar chart
  const projectMap = {};
  transactions.forEach(transaction => {
    const projectName = transaction.object?.name || 'Unknown';
    if (!projectMap[projectName]) {
      projectMap[projectName] = {
        project: projectName,
        amount: 0,
        type: transaction.object?.type || 'unknown'
      };
    }
    projectMap[projectName].amount += transaction.amount;
  });
  
  // Convert to array and sort by amount
  const byProject = Object.values(projectMap)
    .sort((a, b) => b.amount - a.amount);
  
  return {
    total,
    byDate,
    byProject
  };
}

/**
 * Transform project results data
 * @param {Array} results - Project results from GraphQL
 * @returns {Object} Processed data for project charts
 */
export function transformProjectResults(results) {
  if (!results || results.length === 0) {
    return {
      total: 0,
      passed: 0,
      failed: 0,
      successRate: 0,
      byType: {},
      byDate: []
    };
  }
  
  // Calculate totals
  const total = results.length;
  const passed = results.filter(result => result.grade >= 1).length;
  const failed = total - passed;
  const successRate = (passed / total) * 100;
  
  // Group by project type
  const byType = {};
  results.forEach(result => {
    const type = result.object?.type || 'unknown';
    if (!byType[type]) {
      byType[type] = {
        type,
        total: 0,
        passed: 0,
        failed: 0,
        successRate: 0
      };
    }
    
    byType[type].total++;
    if (result.grade >= 1) {
      byType[type].passed++;
    } else {
      byType[type].failed++;
    }
  });
  
  // Calculate success rates for each type
  Object.values(byType).forEach(type => {
    type.successRate = (type.passed / type.total) * 100;
  });
  
  // Group by date
  const dateMap = {};
  results.forEach(result => {
    const date = new Date(result.createdAt).toLocaleDateString('en-US');
    if (!dateMap[date]) {
      dateMap[date] = {
        date: new Date(result.createdAt),
        total: 0,
        passed: 0,
        failed: 0
      };
    }
    
    dateMap[date].total++;
    if (result.grade >= 1) {
      dateMap[date].passed++;
    } else {
      dateMap[date].failed++;
    }
  });
  
  // Convert to array and sort by date
  const byDate = Object.values(dateMap)
    .sort((a, b) => a.date - b.date)
    .map(item => ({
      ...item,
      successRate: (item.passed / item.total) * 100
    }));
  
  return {
    total,
    passed,
    failed,
    successRate,
    byType,
    byDate
  };
}

/**
 * Transform skills data based on XP transactions
 * @param {Array} transactions - XP transactions from GraphQL
 * @returns {Array} Skills data for radar chart
 */
export function transformSkillsData(transactions) {
  if (!transactions || transactions.length === 0) {
    return [];
  }
  
  // Group by project type
  const skillsMap = {};
  transactions.forEach(transaction => {
    const type = transaction.object?.type || 'unknown';
    if (!skillsMap[type]) {
      skillsMap[type] = {
        skill: type,
        xp: 0
      };
    }
    
    skillsMap[type].xp += transaction.amount;
  });
  
  // Calculate total XP for percentages
  const totalXP = Object.values(skillsMap).reduce((sum, skill) => sum + skill.xp, 0);
  
  // Convert to array with percentages
  const skills = Object.values(skillsMap)
    .map(skill => ({
      ...skill,
      percentage: (skill.xp / totalXP) * 100
    }))
    .sort((a, b) => b.xp - a.xp);
  
  return skills;
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
      history: [],
      auditsDone: [],
      auditsReceived: []
    };
  }
  
  // Get the correct audit records
  const auditsDone = auditData.auditsDone || [];
  const auditsReceived = auditData.auditsReceived || [];
  
  // Calculate counts
  const done = auditsDone.length;
  const received = auditsReceived.length;
  
  // Calculate total amounts
  const doneAmount = auditsDone.reduce((sum, audit) => sum + (audit.amount || 0), 0);
  const receivedAmount = auditsReceived.reduce((sum, audit) => sum + (audit.amount || 0), 0);
  
  // Get audit ratio from user data
  const ratio = auditData.user?.auditRatio || 1;
  
  // Get detailed audit statistics
  const details = analyzeAuditDetails(auditsDone, auditsReceived);
  
  // Get audit history trend
  const history = getAuditHistoryTrend(auditsDone, auditsReceived);
  
  const result = {
    done,
    received,
    doneAmount,
    receivedAmount,
    ratio,
    upToDate: ratio >= 1.0,
    needsAudits: ratio < 0.8,
    details,
    history,
    auditsDone,
    auditsReceived
  };
  
  return result;
}