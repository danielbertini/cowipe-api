module.exports.error = (message) => {
  bugsnag.notify(new Error(message));
};
