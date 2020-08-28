// import dependencies
const IBMCloudEnv = require('ibm-cloud-env');
IBMCloudEnv.init('/server/config/mappings.json');

// initialize Cloudant
const CloudantSDK = require('@cloudant/cloudant');
const cloudant = new CloudantSDK(IBMCloudEnv.getString('cloudant_url'));
util.log(cloudant)
cloudant.db.list().then((body) => {
    body.forEach((db) => {
      util.log(db);
    });
}).catch((err) => { util.log(err); });
