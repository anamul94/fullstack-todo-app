const environments = {
  development: {
    API_BASE_URL: "http://10.0.2.20:8080/api/v1",
  },
  production: {
    API_BASE_URL: "https://10.0.2.20:8080/api/v1",
  },
};

const env = process.env.REACT_APP_ENV || 'development';
const config = environments[env];

export default config; 