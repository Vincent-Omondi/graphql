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
      campus
      attrs
      auditRatio
      skills: transactions(
        where: { type: { _like: "skill_%" } },
        order_by: [{ amount: desc }]
      ) {
        type
        amount
      }
    }
  }`,
  
  xp: `{
    transaction(
      where: {
        _and: [
          { type: {_eq: "xp"} },
          { eventId: {_eq: 75} }
        ]
      },
      order_by: {createdAt: desc}
    ) {
      id
      amount
      createdAt
      objectId
      path
      object {
        id
        name
        type
      }
    }
  }`,
  
  results: `{
    result(
      where: {
        object: {
          type: {_eq: "project"}
        }
      },
      order_by: {createdAt: asc}
    ) {
      id
      grade
      createdAt
      objectId
      path
      object {
        id
        name
        type
      }
    }
  }`,
  
  audits: `{
    auditsDone: transaction(
      where: {
        type: {_eq: "up"},
        object: {
          type: {_eq: "project"}
        }
      },
      order_by: {createdAt: desc}
    ) {
      id
      amount
      type
      createdAt
      objectId
      path
      object {
        id
        name
        type
      }
    }
    auditsReceived: transaction(
      where: {
        type: {_eq: "down"},
        object: {
          type: {_eq: "project"}
        }
      },
      order_by: {createdAt: desc}
    ) {
      id
      amount
      type
      createdAt
      objectId
      path
      object {
        id
        name
        type
      }
    }
    projectProgress: progress(
      where: {
        isDone: {_eq: true},
        object: {
          type: {_eq: "project"}
        }
      },
      order_by: {createdAt: desc}
    ) {
      id
      createdAt
      objectId
      grade
      isDone
      path
      object {
        id
        name
        type
      }
    }
  }`,
  
  skills: `{
    skills: transaction(
      where: { 
        type: { _like: "skill_%" }
      },
      order_by: [{ amount: desc }]
    ) {
      type
      amount
      createdAt
      path
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
    state.auditData = transformAuditData(auditData);
    
    // Use skill data from user query if available, otherwise use XP transactions
    if (state.user && state.user.skills && state.user.skills.length > 0) {
      state.skillsData = state.user.skills.map(skill => ({
        name: skill.type,
        amount: skill.amount,
        percentage: 0, // Will be calculated below
        skill: skill.type.replace('skill_', '')
      }));
      
      // Calculate percentages
      const totalSkillAmount = state.skillsData.reduce((sum, skill) => sum + skill.amount, 0);
      state.skillsData.forEach(skill => {
        skill.percentage = (skill.amount / totalSkillAmount) * 100;
      });
    } else {
      // Fallback to using XP transactions
      const skillsData = await fetchGraphQL(QUERIES.skills);
      state.skillsData = transformSkillsData(xpData.transaction);
    }
    
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
  // Create profile container
  const profileContainer = createElement('div', {
    className: 'profile-container glow-container'
  });
  
  // Add to container immediately to establish position
  container.appendChild(profileContainer);
  
  // Create loading indicator
  const loadingIndicator = createLoadingIndicator(container);
  
  // Function to load profile data
  const loadProfileData = () => {
    // Show loading indicator
    loadingIndicator.show();
    
    // Fetch profile data
    fetchProfileData()
      .then(() => {
        // Remove loading indicator
        loadingIndicator.hide();
        
        // If there was an error, show error message
        if (state.error) {
          profileContainer.innerHTML = ''; // Clear any existing content
          showError(profileContainer, state.error);
          return;
        }
        
        // Clear container first
        profileContainer.innerHTML = '';
        
        // Render profile
        renderProfile(profileContainer);
      })
      .catch(error => {
        loadingIndicator.hide();
        profileContainer.innerHTML = ''; // Clear any existing content
        showError(profileContainer, error.message);
      });
  };
  
  // Load profile data initially
  loadProfileData();
  
  // Add event listener for reload
  document.addEventListener('reload-profile', loadProfileData);
  
  // Return a cleanup function
  return () => {
    document.removeEventListener('reload-profile', loadProfileData);
  };
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
      className: 'user-info'
    }, [
      createElement('div', {
        className: 'user-dropdown'
      }, [
        createElement('h1', {
          className: 'gradient-text user-dropdown-toggle',
          textContent: state.user?.login || 'User',
          onclick: (e) => {
            e.stopPropagation();
            const dropdown = e.target.closest('.user-dropdown').querySelector('.dropdown-menu');
            dropdown.classList.toggle('active');
            
            // If opening the dropdown, add document click listener to close it when clicking outside
            if (dropdown.classList.contains('active')) {
              // Use setTimeout to prevent immediate closing
              setTimeout(() => {
                const closeDropdown = (event) => {
                  if (!e.target.closest('.user-dropdown').contains(event.target)) {
                    dropdown.classList.remove('active');
                    document.removeEventListener('click', closeDropdown);
                  }
                };
                document.addEventListener('click', closeDropdown);
              }, 10);
            }
          }
        }),
        createElement('div', {
          className: 'dropdown-menu'
        }, [
          createElement('div', {
            className: 'dropdown-header'
          }, [
            createElement('h3', {
              textContent: getFullName(state.user)
            })
          ]),
          createElement('div', {
            className: 'dropdown-body'
          }, [
            createElement('div', {
              className: 'dropdown-item'
            }, [
              createElement('span', {
                className: 'dropdown-label',
                textContent: 'ID:'
              }),
              createElement('span', {
                className: 'dropdown-value',
                textContent: state.user?.id || 'Unknown'
              })
            ]),
            ...createUserDetailItems(state.user)
          ])
        ])
      ])
    ]),
    createElement('div', {
      className: 'logout-button'
    }, [
      createElement('button', {
        className: 'power-button',
        innerHTML: '<i class="fas fa-power-off"></i>',
        title: 'Logout',
        onclick: () => {
          document.dispatchEvent(new Event('logout'));
        }
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
        textContent: `${((state.xpData?.total || 0) / 1000000).toFixed(2)} MB`
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
        
        // Find max value for each skill type
        const skillMaxValues = {};
        
        // Get max values for each skill type
        state.skillsData.forEach(skill => {
          const type = skill.skill || skill.name.replace('skill_', '');
          if (!skillMaxValues[type] || skill.amount > skillMaxValues[type].amount) {
            skillMaxValues[type] = {
              name: `skill_${type}`,
              skill: type,
              amount: skill.amount,
              percentage: 0
            };
          }
        });
        
        // Convert to array and get top 6 skills
        const topSkills = Object.values(skillMaxValues)
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 6);
        
        // Calculate percentages based on maximum possible value
        const maxPossibleValue = Math.max(...topSkills.map(s => s.amount));
        topSkills.forEach(skill => {
          skill.percentage = (skill.amount);
        });
        
        createSkillsRadarChart(topSkills, radarContainer);
      } else {
        createFallbackContent(radarContainer, 'Skills Distribution', 'At least 3 different skill categories are required for the radar chart.');
      }
      
      // Audits tab
      const ratioContainer = document.querySelector('#audit-ratio-chart');
      const comparisonContainer = document.querySelector('#audit-comparison-chart');
      
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

// Helper function to get full name
function getFullName(user) {
  if (!user) return 'User Profile';
  return `${user.firstName || ''} ${user.attrs?.middleName || ''} ${user.lastName || ''}`.trim();
}

// Helper function to create user detail items
function createUserDetailItems(user) {
  if (!user || !user.attrs) return [];
  
  const details = [
    { label: 'Email', value: user.attrs.email },
    { label: 'Phone', value: user.attrs.phone },
    { label: 'Country', value: user.attrs.country },
    { label: 'Gender', value: user.attrs.gender },
    { label: 'Birth Date', value: user.attrs.dateOfBirth ? formatDate(user.attrs.dateOfBirth) : null }
  ];
  
  return details
    .filter(detail => detail.value)
    .map(detail => 
      createElement('div', {
        className: 'dropdown-item'
      }, [
        createElement('span', {
          className: 'dropdown-label',
          textContent: `${detail.label}:`
        }),
        createElement('span', {
          className: 'dropdown-value',
          textContent: detail.value || 'Not available'
        })
      ])
    );
}

// Export component
export default {
  render: renderProfileComponent
}; 