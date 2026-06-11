const { v4: uuidv4 } = require("uuid");

function generateDOI() {
    const prefix = "10.2026/MABRIG";
    const suffix = uuidv4().split("-")[0];
    return `${prefix}/${suffix}`;
}

module.exports = generateDOI;
