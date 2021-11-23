const {writeFileSync, readFileSync, fstat, appendFileSync} = require("fs");
const path = require("path");
const moment = require("moment");

function getJSONFile (fileName){
    const filePath = path.resolve(__dirname,`../json/${fileName}`);
    return JSON.parse(readFileSync(filePath));
};
function setJSONFile (fileName, contents){
    const filePath = path.resolve(__dirname,`../json/${fileName}`);
    writeFileSync(filePath, JSON.stringify(contents,null,2));
}

function writeToLogFile (username, msg){
    const filePath = path.resolve(__dirname,`../log/${moment().month()}-${moment().date()}-${moment().year()}-log.txt`);
    appendFileSync(filePath,`${moment()} ${username} ${msg}\n`);
}

module.exports = {
    getJSONFile,
    setJSONFile,
    writeToLogFile
}