var validator = require("validator");
var moment = require("moment");
var slugify = require("slugify");

module.exports.slugify = (string) => {
  return slugify(string, {
    remove: /[*+~.,^{}=_%$#<>?()/'"!:@]/g,
    lower: true,
  });
};

module.exports.clearStoreName = (string) => {
  let result = string;
  result = result.replace(".com", "");
  result = result.replace(".com.br", "");
  result = result.replace("BR", "");
  result = result.replace("& Latam", "");
  result = validator.trim(result);
  result = validator.unescape(result);
  return result;
};

module.exports.string = (string) => {
  try {
    if (string) {
      let result = validator.trim(string);
      result = validator.unescape(result);
      result = validator.stripLow(result);
      return result;
    } else {
      return null;
    }
  } catch (error) {
    console.log(error);
    bugsnag.notify(new Error(error));
  }
};

module.exports.phone = (string) => {
  try {
    if (string) {
      let result = validator.trim(string);
      result = validator.unescape(result);
      result = validator.stripLow(result);
      result = result
        .replace("(", "")
        .replace(")", "")
        .replace("-", "")
        .replace(new RegExp(" ", "g"), "");
      result = "+55" + result;
      return result;
    } else {
      return null;
    }
  } catch (error) {
    console.log(error);
    bugsnag.notify(new Error(error));
  }
};

module.exports.email = (string) => {
  try {
    if (string) {
      let result = validator.trim(string);
      result = validator.unescape(result);
      result = validator.stripLow(result);
      result = validator.normalizeEmail(result);
      return result;
    } else {
      return null;
    }
  } catch (error) {
    console.log(error);
    bugsnag.notify(new Error(error));
  }
};

module.exports.date = (string) => {
  try {
    if (string) {
      let result = validator.trim(string);
      result = validator.unescape(result);
      result = validator.stripLow(result);
      result = validator.normalizeEmail(result);
      result = result.replace(new RegExp("/", "g"), "-");
      let momentObj = moment(result, "DD-MM-YYYY");
      let momentString = momentObj.format("YYYY-MM-DD 00:00:00.000");
      return momentString;
    } else {
      return null;
    }
  } catch (error) {
    console.log(error);
    bugsnag.notify(new Error(error));
  }
};

module.exports.numbers = (string) => {
  try {
    if (string) {
      let result = validator.trim(string);
      result = validator.unescape(result);
      result = validator.stripLow(result);
      result = result.replace(/[^\d]+/g, "");
      return result;
    } else {
      return null;
    }
  } catch (error) {
    console.log(error);
    bugsnag.notify(new Error(error));
  }
};

module.exports.currency = (string) => {
  try {
    if (string.indexOf("R$") === -1) {
      return parseFloat(string);
    } else {
      let result = string.replace("R$", "");
      result = result.replace(/\./g, "");
      result = result.replace(/\,/g, ".");
      result = validator.trim(result);
      result = validator.unescape(result);
      result = validator.stripLow(result);
      return parseFloat(result);
    }
  } catch (error) {
    console.log(error);
    bugsnag.notify(new Error(error));
  }
};
