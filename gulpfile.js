const { Indexer, Packager } = require("@vesta/devmaid");
const { series } = require("gulp")

const indexer = new Indexer("src");
indexer.generate();

let pkgr = new Packager({
    root: __dirname,
    src: "src",
    targets: ["es6"],
    files: [".npmignore", "LICENSE", "README.md"],
    publish: "--access=public",
});

const tasks = pkgr.createTasks();

module.exports = {
    default: series(tasks.default),
    publish: series(tasks.deploy, tasks.publish)
}