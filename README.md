# GraphQL Student Profile

This project is a Single Page Application (SPA) that displays a student profile dashboard using GraphQL to fetch data from the school's API. The dashboard shows various statistics and information about a student's progress.

## Demo

- **Live Demo**: [https://vincent-graphql.vercel.app](https://vincent-graphql.vercel.app)
- **GitHub Repository**: [https://github.com/Vincent-Omondi/graphql](https://github.com/Vincent-Omondi/graphql)

## Features

- **Authentication**: Secure login with JWT token-based authentication
- **Profile Overview**: Display of student information and statistics
- **XP Progression**: Visualization of XP earned over time and by project
- **Project Statistics**: Information about projects completed and success rates
- **Skills Visualization**: Radar chart showing skills distribution based on XP
- **Audit Information**: Statistics about audits completed and received

## Technologies Used

- **Vanilla JavaScript**: No frameworks, just plain JavaScript
- **GraphQL**: For data fetching from the school's API
- **SVG**: Custom SVG-based charts and visualizations
- **CSS3**: Modern styling with CSS variables and responsive design

## Project Structure

```
/
├── css/
│   ├── components/
│   │   ├── login.css      # Login component styles
│   │   └── profile.css    # Profile component styles
│   └── main.css           # Main stylesheet
├── js/
│   ├── components/
│   │   ├── auth.js        # Authentication component
│   │   └── profile.js     # Profile component
│   ├── graphs/
│   │   ├── xpChart.js     # XP progression charts
│   │   └── projectsChart.js # Project and skills charts
│   ├── utils/
│   │   ├── graphqlClient.js # GraphQL fetch utility
│   │   ├── domHelpers.js    # DOM manipulation helpers
│   │   ├── svgHelpers.js    # SVG chart helpers
│   │   └── dataTransformers.js # Data processing utilities
│   └── app.js             # Main application file
├── index.html             # Main HTML file
└── README.md              # Project documentation
```

## Getting Started

1. Clone the repository
2. Serve the files with a local server (e.g., Live Server extension in VS Code)
3. Navigate to `localhost:5500/` or `index.html` in your browser
4. Log in with your credentials

## GraphQL API

The application communicates with the school's GraphQL API at:
`https://learn.zone01kisumu.ke/api/graphql-engine/v1/graphql`

Authentication is performed using JWT tokens stored in localStorage.

## Credits

Created by Vincent Omondi 