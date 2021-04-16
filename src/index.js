const Listr = require("listr");

const testConfig = require("./setup/test-config");
const cleanDist = require("./setup/clean-dist");

const tasks = new Listr([
	{
        title: "Setup & Pre-flight checks",
        task: () => {
            return new Listr([
                {
                    title: "Check env config",
                    task: () => testConfig()
                },
                {
                    title: "Clean destination folder",
                    task: () => cleanDist()
                }
            ]);
        }
    },
]);

tasks.run().catch(err => console.error(err));