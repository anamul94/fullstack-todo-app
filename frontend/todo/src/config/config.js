const environments = {
  development: {
    API_BASE_URL: 'http://localhost:8080/api/v1',
  },
  production: {
    API_BASE_URL: 'https://api.yourproduction.com/api/v1',
  },
};

const env = process.env.REACT_APP_ENV || 'development';
const config = environments[env];

export default config; 