const axios = require('axios');

// Function to check license validity
async function checkLicense(key, productName) {
  try {
    const response = await axios.get('http://your_ip:port/licenses/check', {
      params: {
        key: key,
        pn: productName,
      },
    });

    // Success response handling
    if (response.status === 200) {
      // Delete if you dont want to log responses
      console.log({
        timestamp: response.data.timestamp,
        status: response.data.status,
        message: response.data.message,
      });
      return true; // License is valid
    }
  } catch (error) {
    // Error response handling
    if (error.response) {
      // Server responded with a status other than 200
      // Delete if you dont want to log responses
      console.log({
        timestamp: error.response.data.timestamp,
        status: error.response.data.status,
        message: error.response.data.message,
        key: error.response.data.key || '',
        productName: error.response.data.productName || '',
        currentLogins: error.response.data.currentLogins || undefined,
        maxLogins: error.response.data.maxLogins || undefined,
      });
    } else {
      // Network error or no response
      console.log('Network error or no response from server:', error.message);
    }
    return false; // License is not valid due to error
  }
}

// Example usage
const licenseKey = 'YourLicenseKeyHere';
const productName = 'YourProductNameHere';

checkLicense(licenseKey, productName).then(isValid => {
  console.log("License is valid:", isValid);
});
