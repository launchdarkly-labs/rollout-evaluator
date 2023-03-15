## LaunchDarkly Rollout Evaluator

Simple NodeJS script which evaluates the context keys provided via a CSV file and outputs a file that shows what flag variation would be served to each context key. The original use case for which it was created were percentage rollouts without any additional targeting in place.

The script accepts a CSV file with a single column called `key`. The output is a CSV with two columns: one with context keys and the second with header matching the provided flag key and values matching the assigned variations for the particular % rollout.

**Instructions for use:**

1. Clone the repository, enter the folder, and run `npm install`.
2. Rename the `.env-example` file to `.env` and enter the `SDK_KEY` pointing to the relevant LaunchDarkly environment.
3. Place a CSV file with a single column holding your context keys inside the `input` folder. The header of the single column of data needs to be set to `key`.
4. Edit line 20 in the `index.js` file so it matches the flag key of the flag you want to evaluate.
5. Edit line 31 in the `index.js` file so it points to your input file.
6. Optionally, you can update the `bucketUsers` function to add additional attributes to the evaluation context.
7. Execute the script with `npm run evaluate`.
8. If all goes well, you should see a new CSV file added to the `output` folder. Here you should see the variation assignment for the selected flag next to each user key.

**Call outs:**

* When initializing the LaunchDarkly SDK, the script sets the `sendEvents` property to `false`. This is to prevent the polution of flag insights and experiment results dashboards and I highly recommend keeping the config option in place. 
* The script uses the (recently introduced *Custom Contexts*)[https://launchdarkly.com/blog/announcing-custom-contexts/].

**Possible improvements/additions:**

* Add the ability to specify flag key via an argument when executing the script.
* Add support for evaluating multiple/all flags in a given environment.
* Add suport for taking context attributes into consideration when running the evaluation logic.