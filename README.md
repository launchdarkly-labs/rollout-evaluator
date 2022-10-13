## WIP

Simple Node application aiming to give LaunchDarkly users the ability to identify who'll be part of a percentage rollout. 

It accepts a CSV file with a single column called `key`. The output is a CSV with two columns: one with user keys and the second with header matching the provided flag key and values matching the assigned variations for the particular % rollout.

**tldr instructions for use:**

* Clone the repository, enter the folder, and run `npm install`.
* Create `.env` file in the root directory of your project and add a single variable: `SDK_KEY`. Set the SDK key of the LD environment where you want to do your rollout as its value.
* Place a csv file with a single column holding your user keys inside the `source` folder. The header of the single column of data needs to be set to `key`.
* Edit line 20 in the `index.js` file so it matches the flag key of the flag you want to roll out.
* Edit line 30 in the `index.js` file so it points to your file.
* Execute the script with `node index.js`.
* If all goes well, you should see a new CSV file added to the `output` folder. Here you should see the variation assignment for the selected flag next to each user key.

