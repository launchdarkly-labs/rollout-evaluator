const LaunchDarkly = require('launchdarkly-node-server-sdk');
const csv = require('csv-parser')
const fs = require('fs')
require('dotenv').config();

function showMessage(s) {
  console.log("*** " + s);
  console.log("");
}

// Set sdkKey & the client initialisation options
const sdkKey = process.env.SDK_KEY;
const initOptions = {
  logger: LaunchDarkly.basicLogger({ level: 'debug' }),
  sendEvents: false
};

// Set featureFlagKey to the feature flag key you want to evaluate.
const featureFlagKey = "percentage-rollout-flag";

// Initialise the LD client
const ldClient = LaunchDarkly.init(sdkKey, initOptions);

ldClient.waitForInitialization().then(function () {
  showMessage("SDK successfully initialized!");

  // Reading the content of a CSV file
  const results = [];
  fs.createReadStream('assets/user-emails.csv')
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      // Using the parsed CSV to generate user keys and evaluate them for a feature rollout
      console.log("STARTED evaluating the users");
      let trueVar = 0;
      let falseVar = 0;

      // slicedResults = results.slice(0,50);

      async function bucketUsers () {
        await Promise.all(results.map(async (result) => {
          const user = {
            "key": result.email,
            "custom": {
              "pre-bucket": true
            }
          };

          ldClient.variation(featureFlagKey, user, false).then((flagValue) => {
            if (flagValue === true) {
              trueVar++;
            } else if (flagValue === false) {
              falseVar++;
            } else {
              console.log(err);
            }
          }).catch((err) => console.log(err));
        }))
      }

      bucketUsers().then(() => {
        console.log("USING PROMISE.ALL and THEN");
        console.log(`Served TRUE variation: ${trueVar} user keys`);
        console.log(`Served FALSE variation: ${falseVar} user keys`);

        ldClient.flush(function () {
          ldClient.close();
        });
      });

      // TODO
      // 1) Add logic to count the number of users for each flag variation -> DONE
      // 2) Export this into a new CSV 
      /* 3) Create UI: 
               - Able to upload CSV
               - Able to add SDK key
               - Download output
      */
    });

}).catch(function (error) {
  showMessage("SDK failed to initialize: " + error);
  process.exit(1);
});
