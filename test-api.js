import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
let authToken = '';
let userId = '';

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  mobile: '9876543210',
  password: 'password123',
  role: 'DSA'
};

// API Test Suite
class APITester {
  constructor() {
    this.results = [];
    this.axios = axios.create({
      baseURL: BASE_URL,
      timeout: 10000
    });
  }

  async test(name, testFn) {
    try {
      console.log(`🧪 Testing: ${name}`);
      await testFn();
      this.results.push({ name, status: '✅ PASS' });
      console.log(`✅ ${name} - PASSED\n`);
    } catch (error) {
      this.results.push({ name, status: '❌ FAIL', error: error.message });
      console.log(`❌ ${name} - FAILED: ${error.message}\n`);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting API Tests...\n');

    // Health Check
    await this.test('Health Check', async () => {
      const response = await this.axios.get('/health');
      if (response.status !== 200) throw new Error('Health check failed');
    });

    // Authentication Tests
    await this.test('User Registration', async () => {
      const response = await this.axios.post('/api/auth/register', testUser);
      if (response.status !== 201) throw new Error('Registration failed');
      userId = response.data.user.user_id;
    });

    await this.test('User Login', async () => {
      const response = await this.axios.post('/api/auth/login', {
        email: testUser.email,
        password: testUser.password
      });
      if (response.status !== 200) throw new Error('Login failed');
      authToken = response.data.token;
      this.axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    });

    // Wallet Tests
    await this.test('Get Wallet Balance', async () => {
      const response = await this.axios.get('/api/wallet/balance');
      if (response.status !== 200) throw new Error('Failed to get wallet balance');
      if (response.data.balance !== 0) throw new Error('Initial balance should be 0');
    });

    await this.test('Check Balance Status', async () => {
      const response = await this.axios.get('/api/wallet/balance-check');
      if (response.status !== 200) throw new Error('Balance check failed');
      if (response.data.canSubmitBasic !== false) throw new Error('Should not allow form submission with 0 balance');
    });

    // Payment Tests (Mock)
    await this.test('Create Payment Order', async () => {
      const response = await this.axios.post('/api/payment/create-order', {
        amount: 100
      });
      if (response.status !== 200) throw new Error('Failed to create payment order');
      if (!response.data.orderId) throw new Error('Order ID not returned');
    });

    // Form Access Tests (Should fail due to insufficient balance)
    await this.test('Form Access Control (Insufficient Balance)', async () => {
      try {\n        await this.axios.post('/api/forms/basic', {\n          applicantName: 'Test Applicant',\n          loanAmount: 50000,\n          purpose: 'Business'\n        });\n        throw new Error('Should have failed due to insufficient balance');\n      } catch (error) {\n        if (error.response?.status !== 403) {\n          throw new Error('Expected 403 status for insufficient balance');\n        }\n      }\n    });\n\n    // Admin Tests (if user has admin role)\n    await this.test('Get All Users (Admin)', async () => {\n      try {\n        const response = await this.axios.get('/api/admin/users');\n        // This might fail if user doesn't have admin role, which is expected\n        if (response.status === 200) {\n          console.log('Admin access granted');\n        }\n      } catch (error) {\n        if (error.response?.status === 403) {\n          console.log('Admin access denied (expected for non-admin user)');\n        } else {\n          throw error;\n        }\n      }\n    });\n\n    // Support Tests\n    await this.test('Create Support Ticket', async () => {\n      const response = await this.axios.post('/api/support/tickets', {\n        subject: 'Test Ticket',\n        description: 'This is a test support ticket',\n        priority: 'medium'\n      });\n      if (response.status !== 201) throw new Error('Failed to create support ticket');\n    });\n\n    await this.test('Get User Support Tickets', async () => {\n      const response = await this.axios.get('/api/support/tickets');\n      if (response.status !== 200) throw new Error('Failed to get support tickets');\n    });\n\n    // Transaction History\n    await this.test('Get Transaction History', async () => {\n      const response = await this.axios.get('/api/wallet/transactions');\n      if (response.status !== 200) throw new Error('Failed to get transaction history');\n    });\n\n    // User Profile Tests\n    await this.test('Get User Profile', async () => {\n      const response = await this.axios.get('/api/auth/profile');\n      if (response.status !== 200) throw new Error('Failed to get user profile');\n      if (response.data.email !== testUser.email) throw new Error('Profile data mismatch');\n    });\n\n    await this.test('Update User Profile', async () => {\n      const response = await this.axios.put('/api/auth/profile', {\n        name: 'Updated Test User',\n        email: testUser.email\n      });\n      if (response.status !== 200) throw new Error('Failed to update profile');\n    });\n\n    // Subscription Tests\n    await this.test('Get Subscription Plans', async () => {\n      const response = await this.axios.get('/api/subscription/plans');\n      if (response.status !== 200) throw new Error('Failed to get subscription plans');\n    });\n\n    // Billing Tests\n    await this.test('Get User Invoices', async () => {\n      const response = await this.axios.get('/api/billing/invoices');\n      if (response.status !== 200) throw new Error('Failed to get invoices');\n    });\n\n    // Print Results\n    this.printResults();\n  }\n\n  printResults() {\n    console.log('\\n📊 TEST RESULTS:');\n    console.log('=' .repeat(50));\n    \n    let passed = 0;\n    let failed = 0;\n    \n    this.results.forEach(result => {\n      console.log(`${result.status} ${result.name}`);\n      if (result.error) {\n        console.log(`   Error: ${result.error}`);\n      }\n      \n      if (result.status.includes('PASS')) passed++;\n      else failed++;\n    });\n    \n    console.log('=' .repeat(50));\n    console.log(`Total Tests: ${this.results.length}`);\n    console.log(`✅ Passed: ${passed}`);\n    console.log(`❌ Failed: ${failed}`);\n    console.log(`Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);\n    \n    if (failed === 0) {\n      console.log('\\n🎉 All tests passed! Your API is working correctly.');\n    } else {\n      console.log('\\n⚠️  Some tests failed. Please check the errors above.');\n    }\n  }\n}\n\n// Run tests\nconst tester = new APITester();\ntester.runAllTests().catch(error => {\n  console.error('Test suite failed:', error);\n  process.exit(1);\n});