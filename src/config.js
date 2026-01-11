const API_URL = import.meta.env.PROD
    ? 'https://cloudflare-server.vercel.app'
    : 'http://localhost:3000';

export default API_URL;
