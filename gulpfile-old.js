const { parallel, series, task } = require("gulp");
const path = require("path");
const config = require("./resources/gulp/config");

const setting = Object.assign({ production: false }, config);
const { dir } = setting;

const [tasks, watches] = loadTasks(["asset", "sass", "client"]);
module.exports={
    default: series(...tasks, runWatches),
    deploy: series(production, ...tasks)
}

function loadTasks(modules) {
    let tasks = [];
    let watches = [];

    for (let i = 0, il = modules.length; i < il; ++i) {
        let result = require(path.join(dir.gulp, modules[i]))(setting);
        if (result.tasks) {
            tasks = tasks.concat(result.tasks);
        }
        if (result.watch) {
            watches = watches.concat(result.watch);
        }
    }
    return [tasks, watches];
}

function production() {
    setting.production = true;
    return Promise.resolve();
}

function runWatches(cb) {
    for (let i = 0, il = watches.length; i < il; ++i) {
        watches[i]();
    }
    cb();
}