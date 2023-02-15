const LaunchDarkly = require('launchdarkly-node-server-sdk');
const csv = require('csv-parser')
const fs = require('fs')
const { parseAsync } = require('json2csv');
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
  const users = [];
  fs.createReadStream('source/user-emails.csv')
    .pipe(csv())
    .on('data', (data) => users.push(data))
    .on('end', () => {
      // Using the parsed CSV to generate user keys and evaluate them for a feature rollout 
      console.log("STARTED evaluating the users");
      const start = performance.now();
      let trueVar = 0;
      let falseVar = 0;

      slicedUsers = users.slice(0,20);
      async function bucketUsers () {
        await Promise.all(users.map(async (user) => {
          
          // Split the user email by "-" or "@" characters and take the second item in the resulting array (should be a number)
          // User email format: test-[N]@email.com
          const userNumber = parseInt(user.key.split(/[@,-]+/)[1]);
          const roundedNumber = Math.ceil(userNumber / 10);
          const determineParity = (number) => {
            let parity
            if (number % 2 == 0) {
              parity = "even";
            } else {
              parity = "odd";
            }
            return parity
          }
          user["parity"] = determineParity(userNumber);
          user["number"] = roundedNumber;

          const userContext = {
            "key": user.key,
            "custom": {
              "pre-bucket": true,
              "parity": determineParity(userNumber),
              "user-number": roundedNumber
            }
          };

          ldClient.variation(featureFlagKey, userContext, false).then((flagValue) => {
            if (flagValue === true) {
              trueVar++;
            } else if (flagValue === false) {
              falseVar++;
            } else {
              console.log(err);
            }
            user[featureFlagKey] = flagValue;

            return user;
          }).catch((err) => console.log(err));
        }))
      }

      bucketUsers().then(() => {
        const end = performance.now();

        // console.log(slicedUsers);
        console.log(`FINISHED evaluating users. Time to execute: ${(end - start).toFixed(2)} ms`);
        console.log(`Served TRUE variation: ${trueVar} user keys`);
        console.log(`Served FALSE variation: ${falseVar} user keys`);

        ldClient.flush(function () {
          ldClient.close();
        });

        // Parse final JSON to a CSV
        const fields = ['key', 'parity', "number", featureFlagKey];
        const opts = { fields };

        parseAsync(users, opts)
          .then(csv => fs.writeFileSync("output/export-3.csv", csv))
          .catch(err => console.error(err));
      });

      /* TODO
      *  1) Handle import/export logic
      *  2) [Nice to have] Option to evaluate multiple flags
      *  2) [Very nice to have] Create UI: 
      *     - Able to upload CSV
      *     - Able to add SDK key
      *     - Download output
      */
    });

}).catch(function (error) {
  showMessage("SDK failed to initialize: " + error);
  process.exit(1);
});
