const axios = require('axios');

async function testAdminLogin() {
  try {
    console.log('Testing Admin Login...\n');
    
    const credentials = {
      email: 'admin@example.com',
      password: 'admin123'
    };
    
    console.log('Credentials:', credentials);
    console.log('Endpoint: http://localhost:5050/api/auth/login\n');
    
    const response = await axios.post('http://localhost:5050/api/auth/login', credentials);
    
    console.log('✓ LOGIN SUCCESSFUL!\n');
    console.log('Response Status:', response.status);
    console.log('User:', response.data.user);
    console.log('Role:', response.data.user?.role);
    console.log('Token:', response.data.token ? 'Token received' : 'No token');
    
  } catch (error) {
    console.error('✗ LOGIN FAILED!\n');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error Message:', error.response.data?.message || error.response.data);
    } else if (error.request) {
      console.error('No response from server');
      console.error('Is the backend running on port 5050?');
    } else {
      console.error('Error:', error.message);
    }
  }
}

testAdminLogin();
