import fs = require("fs");
export default JSON.parse(fs.readFileSync("app.config.json", "utf8"));
