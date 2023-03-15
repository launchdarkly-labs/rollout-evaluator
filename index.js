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

// SET THE FEATURE FLAG KEY OF THE FLAG YOU WANT TO EVALUATE
const featureFlagKey = "percentage-rollout-flag";

// Initialise the LD client
const ldClient = LaunchDarkly.init(sdkKey, initOptions);

ldClient.waitForInitialization().then(function () {
  showMessage("SDK successfully initialized!");

  // Reading the content of a CSV file
  const users = [];
  // SET THE NAME OF THE FILE TO USE AS INPUT
  fs.createReadStream('input/example-input-file.csv')
    .pipe(csv())
    .on('data', (data) => users.push(data))
    .on('end', () => {
      // Using the parsed CSV to generate user keys and evaluate them for a feature rollout 
      console.log("STARTED evaluating the users");
      const start = performance.now();
      let trueVar = 0;
      let falseVar = 0;

      // For development purposes only - option to only select a subset of users from the input file
      // slicedUsers = users.slice(0,20);

      async function bucketUsers () {
        await Promise.all(users.map(async (user) => {
          
          const evaluationContext = {
            kind: 'user',
            key: user.key
            // Optionally, you can provide additional attributes/values in here
          };

          ldClient.variation(featureFlagKey, evaluationContext, false).then((flagValue) => {
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
        const fields = ['key', featureFlagKey];
        const opts = { fields };

        parseAsync(users, opts)
          .then(csv => fs.writeFileSync("output/example-output-file.csv", csv))
          .catch(err => console.error(err));
      });
    });

}).catch(function (error) {
  showMessage("SDK failed to initialize: " + error);
  process.exit(1);
});
