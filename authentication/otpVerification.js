const env = require('dotenv').config()

const config = {
    accountSid: process.env.accountSID,
    authToken: process.env.authToken,
    serviceId: process.env.serviceID

}
const client = require('twilio')(config.accountSid, config.authToken);

module.exports = {
    getOtp: (number) => {
        number = "+91" + number;
        return new Promise((resolve, reject) => {
            client.verify.v2.services(config.serviceId)
                .verifications
                .create({ to: number, channel: 'sms' })
                .then((response) => {
                    resolve(response)
                    console.log(response);
                    console.log('get otp');
                });
        })
    },
    checkOtp: (otp, number) => {
        number = "+91" + number;
        return new Promise((resolve, reject) => {
            client.verify.v2.services(config.serviceId)
                .verificationChecks
                .create({ to: number, code: otp })
                .then((verification_check) => {
                    resolve(verification_check.status);
                    console.log(verification_check.status);

                });

        })
    
    },
   
}


