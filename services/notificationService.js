import axios from 'axios';

class NotificationService {
  constructor() {
    this.authKey = process.env.MSG91_AUTH_KEY;
    this.baseURL = 'https://control.msg91.com/api/v5';
  }

  async sendSMS(mobile, message) {
    try {
      const payload = {
        authkey: this.authKey,
        mobiles: mobile,
        message: message,
        sender: 'SAASBS',
        route: 4,
        country: 91
      };

      const response = await axios.post(`${this.baseURL}/sms`, payload);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('SMS failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendWelcomeMessage(mobile, name) {
    const message = `Welcome ${name}! Your SaaS Base account is ready. Start submitting forms now.`;
    return await this.sendSMS(mobile, message);
  }

  async sendPaymentSuccess(mobile, amount, newBalance) {
    const message = `Payment success! ₹${amount} added. New balance: ₹${newBalance}`;
    return await this.sendSMS(mobile, message);
  }

  async sendLowBalanceAlert(mobile, balance) {
    const message = `Low balance alert! Current: ₹${balance}. Recharge now.`;
    return await this.sendSMS(mobile, message);
  }

  async sendFormSubmitted(mobile, formType, amount, remainingBalance) {
    const message = `${formType} submitted! ₹${amount} deducted. Balance: ₹${remainingBalance}`;
    return await this.sendSMS(mobile, message);
  }
}

export default new NotificationService();