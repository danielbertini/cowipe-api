var moment = require("moment");

module.exports.log = (message) => {
  let time = moment(new Date()).format("DD/MM/YYYY HH:MM:SS");
  console.log(`@ ${time} - ${JSON.stringify(message)}`);
};

module.exports.fail = (message) => {
  let time = moment(new Date()).format("DD/MM/YYYY HH:MM:SS");
  console.log(`@ ${time} - ${message}`);
};
