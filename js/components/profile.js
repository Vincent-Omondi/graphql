/**
 * Profile Component
 * Displays user profile information and statistics
 */
import { fetchGraphQL, createLoadingIndicator, showError } from '../utils/graphqlClient.js';
import { createElement, formatNumber, formatDate, createTabs } from '../utils/domHelpers.js';
import { transformXpData, transformProjectResults, transformSkillsData, transformAuditData } from '../utils/dataTransformers.js';
import { createXPLineChart, createXPBarChart } from '../graphs/xpChart.js';
import { createDonutChart, createSkillsRadarChart } from '../graphs/projectsChart.js';
import { createAuditRatioChart, createAuditComparisonChart } from '../graphs/auditChart.js';

// Application state
const state = {
  user: null,
  xpData: null,
  projectResults: null,
  auditData: null,
  skillsData: null,
  isLoading: false,
  error: null
};

/**
 * GraphQL Queries
 */
const QUERIES = {
  user: `{
    user {
      id
      login
      firstName
      lastName
      attrs
      auditRatio
    }
  }`,
  
  xp: `{
    transaction(
      where: {
        type: {_eq: "xp"}
      },
      order_by: {createdAt: asc}
    ) {
      id
      amount
      createdAt
      objectId
      object {
        id
        name
        type
      }
    }
  }`,
  
  results: `{
    result(
      order_by: {createdAt: asc}
    ) {
      id
      grade
      createdAt
      objectId
      object {
        id
        name
        type
      }
    }
  }`,
  
  audits: `{
    audits: transaction(
      where: {
        type: {_eq: "up"}
      }
    ) {
      id
      amount
      type
      createdAt
      objectId
      object {
        id
        name
        type
      }
    }
    auditsDone: progress(
      where: {
        isDone: {_eq: true}
      }
    ) {
      id
      createdAt
      objectId
      grade
      isDone
      object {
        id
        name
        type
      }
    }
    auditsReceived: progress(
      where: {
        isDone: {_eq: true}, 
        updatedAt: {_is_null: false}
      }
    ) {
      id
      createdAt
      objectId
      grade
      isDone
      object {
        id
        name
        type
      }
    }
  }`
};

/**
 * Fetch user profile data
 */
async function fetchProfileData() {
  state.isLoading = true;
  state.error = null;
  
  try {
    // Fetch user data
    const userData = await fetchGraphQL(QUERIES.user);
    state.user = userData.user[0];
    
    // Fetch XP transactions
    const xpData = await fetchGraphQL(QUERIES.xp);
    state.xpData = transformXpData(xpData.transaction);
    
    // Fetch project results
    const resultsData = await fetchGraphQL(QUERIES.results);
    state.projectResults = transformProjectResults(resultsData.result);
    
    // Fetch audits data
    const auditData = await fetchGraphQL(QUERIES.audits);
    state.auditData = transformAuditData({
      done: auditData.auditsDone,
      received: auditData.auditsReceived
    });
    
    // Create skills data from XP transactions
    state.skillsData = transformSkillsData(xpData.transaction);
    
  } catch (error) {
    console.error('Error fetching profile data:', error);
    state.error = error.message;
  } finally {
    state.isLoading = false;
  }
}

/**
 * Render the profile component
 * @param {HTMLElement} container - Container to render the profile component
 */
export function renderProfileComponent(container, user = null) {
  // Create loading indicator
  const loadingIndicator = createLoadingIndicator(container);
  loadingIndicator.show();
  
  // Create profile container
  const profileContainer = createElement('div', {
    className: 'profile-container glow-container'
  });
  
  // Fetch profile data
  fetchProfileData()
    .then(() => {
      // Remove loading indicator
      loadingIndicator.hide();
      
      // If there was an error, show error message
      if (state.error) {
        showError(profileContainer, state.error);
        container.appendChild(profileContainer);
        return;
      }
      
      // Render profile
      renderProfile(profileContainer);
      
      // Add to container
      container.appendChild(profileContainer);
    })
    .catch(error => {
      loadingIndicator.hide();
      showError(profileContainer, error.message);
      container.appendChild(profileContainer);
    });
}

/**
 * Render profile content
 * @param {HTMLElement} container - Container to render profile
 */
function renderProfile(container) {
  // Header section
  const header = createElement('header', {
    className: 'profile-header'
  }, [
    createElement('div', {
      className: 'logout-button'
    }, [
      createElement('button', {
        className: 'button',
        innerHTML: '<i class="fas fa-sign-out-alt"></i> Logout',
        onclick: () => {
          document.dispatchEvent(new Event('logout'));
        }
      })
    ]),
    createElement('div', {
      className: 'user-info'
    }, [
      createElement('h1', {
        className: 'gradient-text',
        textContent: state.user?.login || 'User'
      }),
      createElement('p', {
        textContent: `ID: ${state.user?.id || 'Unknown'}`
      })
    ])
  ]);
  
  // Dashboard summary
  const dashboard = createElement('div', {
    className: 'dashboard-summary glass-card'
  }, [
    createElement('div', {
      className: 'summary-item'
    }, [
      createElement('h3', {
        textContent: 'Total XP'
      }),
      createElement('p', {
        className: 'gradient-text',
        textContent: formatNumber(state.xpData?.total || 0)
      })
    ]),
    createElement('div', {
      className: 'summary-item'
    }, [
      createElement('h3', {
        textContent: 'Projects'
      }),
      createElement('p', {
        className: 'gradient-text',
        textContent: `${state.projectResults?.passed || 0}/${state.projectResults?.total || 0}`
      })
    ]),
    createElement('div', {
      className: 'summary-item'
    }, [
      createElement('h3', {
        textContent: 'Audit Ratio'
      }),
      createElement('p', {
        className: 'gradient-text',
        textContent: state.auditData?.ratio.toFixed(2) || '0.00'
      })
    ])
  ]);
  
  // Statistics tabs
  const statisticsTabs = createElement('div', {
    className: 'statistics-dashboard'
  });
  
  // Create chart sections
  const xpSection = createElement('div', {
    className: 'dashboard-section',
    id: 'xp-section'
  }, [
    createElement('h2', {
      className: 'section-title',
      textContent: 'XP Progression'
    }),
    createElement('div', {
      className: 'charts-row'
    }, [
      createElement('div', {
        className: 'chart-container',
        id: 'xp-line-chart'
      }),
      createElement('div', {
        className: 'chart-container',
        id: 'xp-bar-chart'
      })
    ])
  ]);
  
  const projectsSection = createElement('div', {
    className: 'dashboard-section',
    id: 'projects-section'
  }, [
    createElement('h2', {
      className: 'section-title',
      textContent: 'Projects & Skills'
    }),
    createElement('div', {
      className: 'charts-row'
    }, [
      createElement('div', {
        className: 'chart-container',
        id: 'projects-donut-chart'
      }),
      createElement('div', {
        className: 'chart-container',
        id: 'skills-radar-chart'
      })
    ])
  ]);
  
  const auditsSection = createElement('div', {
    className: 'dashboard-section',
    id: 'audits-section'
  }, [
    createElement('h2', {
      className: 'section-title',
      textContent: 'Audit Information'
    }),
    createElement('div', {
      className: 'audit-container'
    }, [
      createElement('div', {
        className: 'audit-stats glass-card'
      }, [
        createElement('h3', {
          textContent: 'Audit Statistics'
        }),
        createElement('div', {
          className: 'audit-stats-grid'
        }, [
          createElement('div', {
            className: 'stat-item'
          }, [
            createElement('span', {
              className: 'stat-label',
              textContent: 'Done'
            }),
            createElement('span', {
              className: 'stat-value',
              textContent: state.auditData?.done || 0
            })
          ]),
          createElement('div', {
            className: 'stat-item'
          }, [
            createElement('span', {
              className: 'stat-label',
              textContent: 'Received'
            }),
            createElement('span', {
              className: 'stat-value',
              textContent: state.auditData?.received || 0
            })
          ]),
          createElement('div', {
            className: 'stat-item'
          }, [
            createElement('span', {
              className: 'stat-label',
              textContent: 'Ratio'
            }),
            createElement('span', {
              className: 'stat-value',
              textContent: state.auditData?.ratio.toFixed(2) || '0.00'
            })
          ]),
          createElement('div', {
            className: 'stat-item'
          }, [
            createElement('span', {
              className: 'stat-label',
              textContent: 'Status'
            }),
            createElement('span', {
              className: `stat-value ${state.auditData?.upToDate ? 'status-good' : 'status-warning'}`,
              textContent: state.auditData?.upToDate ? 'Up to date' : 'Needs audits'
            })
          ])
        ])
      ]),
      createElement('div', {
        className: 'charts-row'
      }, [
        createElement('div', {
          className: 'chart-container',
          id: 'audit-ratio-chart'
        }),
        createElement('div', {
          className: 'chart-container',
          id: 'audit-comparison-chart'
        })
      ])
    ])
  ]);
  
  // Add sections to the dashboard
  statisticsTabs.appendChild(xpSection);
  statisticsTabs.appendChild(projectsSection);
  statisticsTabs.appendChild(auditsSection);
  
  // Add sections to container
  container.appendChild(header);
  container.appendChild(dashboard);
  container.appendChild(statisticsTabs);
  
  // Render charts after DOM is updated
  setTimeout(() => {
    console.log('Rendering charts with data state:', state);
    
    // Basic fallback for any chart container
    const createFallbackContent = (container, title, message) => {
      container.innerHTML = '';
      
      const titleElement = createElement('h3', {
        className: 'chart-title',
        textContent: title
      });
      
      const fallbackContent = createElement('div', {
        className: 'no-data-message',
        innerHTML: `<h3>${title}</h3><p>${message}</p>`
      });
      
      container.appendChild(fallbackContent);
    };
    
    try {
      // XP charts
      const xpLineContainer = document.querySelector('#xp-line-chart');
      const xpBarContainer = document.querySelector('#xp-bar-chart');
      
      // Debug data
      console.log('XP Data for charts:', {
        byDate: state.xpData?.byDate || [],
        byProject: state.xpData?.byProject || []
      });
      
      // XP Line Chart
      if (state.xpData?.byDate && state.xpData.byDate.length > 1) {
        xpLineContainer.innerHTML = ''; // Clear container
        
        const title = createElement('h3', {
          className: 'chart-title',
          textContent: 'XP Progression Over Time'
        });
        xpLineContainer.appendChild(title);
        
        createXPLineChart(state.xpData.byDate, xpLineContainer);
      } else {
        createFallbackContent(xpLineContainer, 'XP Progression', 'Not enough XP data to display progression over time.');
      }
      
      // XP Bar Chart
      if (state.xpData?.byProject && state.xpData.byProject.length > 0) {
        xpBarContainer.innerHTML = ''; // Clear container
        
        const title = createElement('h3', {
          className: 'chart-title',
          textContent: 'XP by Project'
        });
        xpBarContainer.appendChild(title);
        
        createXPBarChart(state.xpData.byProject, xpBarContainer);
      } else {
        createFallbackContent(xpBarContainer, 'XP by Project', 'No project XP data available to display.');
      }
      
      // Projects tab
      const donutContainer = document.querySelector('#projects-donut-chart');
      const radarContainer = document.querySelector('#skills-radar-chart');
      
      // Debug data
      console.log('Project Data for charts:', {
        results: state.projectResults || {},
        skills: state.skillsData || []
      });
      
      // Project Donut Chart
      if (state.projectResults && state.projectResults.total > 0) {
        donutContainer.innerHTML = ''; // Clear container
        
        const title = createElement('h3', {
          className: 'chart-title',
          textContent: 'Project Success Rate'
        });
        donutContainer.appendChild(title);
        
        createDonutChart({
          passed: state.projectResults.passed || 0,
          failed: state.projectResults.failed || 0
        }, donutContainer);
      } else {
        createFallbackContent(donutContainer, 'Project Success Rate', 'No project data available to display success rate.');
      }
      
      // Skills Radar Chart (in Projects tab)
      if (state.skillsData && state.skillsData.length >= 3) {
        radarContainer.innerHTML = ''; // Clear container
        
        const title = createElement('h3', {
          className: 'chart-title',
          textContent: 'Skills Distribution'
        });
        radarContainer.appendChild(title);
        
        createSkillsRadarChart(state.skillsData, radarContainer);
      } else {
        createFallbackContent(radarContainer, 'Skills Distribution', 'At least 3 different skill categories are required for the radar chart.');
      }
      
      // Audits tab
      const ratioContainer = document.querySelector('#audit-ratio-chart');
      const comparisonContainer = document.querySelector('#audit-comparison-chart');
      
      // Debug data
      console.log('Audit Data for charts:', state.auditData || {});
      
      // Audit Ratio Chart
      if (state.auditData && state.auditData.history && state.auditData.history.length > 0) {
        ratioContainer.innerHTML = ''; // Clear container
        
        const title = createElement('h3', {
          className: 'chart-title',
          textContent: 'Audit Ratio History'
        });
        ratioContainer.appendChild(title);
        
        createAuditRatioChart(state.auditData.history, ratioContainer);
      } else {
        createFallbackContent(ratioContainer, 'Audit Ratio History', 'No audit history data available to display ratio over time.');
      }
      
      // Audit Comparison Chart
      if (state.auditData) {
        comparisonContainer.innerHTML = ''; // Clear container
        
        const title = createElement('h3', {
          className: 'chart-title',
          textContent: 'Audits Done vs. Received'
        });
        comparisonContainer.appendChild(title);
        
        createAuditComparisonChart(state.auditData, comparisonContainer);
      } else {
        createFallbackContent(comparisonContainer, 'Audits Done vs. Received', 'No audit data available to display comparison.');
      }
    } catch (error) {
      console.error('Error rendering charts:', error);
      
      // Display error in all chart containers
      document.querySelectorAll('.chart-container').forEach(container => {
        container.innerHTML = `
          <div class="error-message">
            <div class="error-icon">⚠️</div>
            <p>Error rendering chart: ${error.message}</p>
          </div>
        `;
      });
    }
  }, 100); // Small delay to ensure DOM is ready
}

// Export component
export default {
  render: renderProfileComponent
}; 