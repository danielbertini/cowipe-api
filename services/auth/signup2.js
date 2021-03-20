const moment = require('moment');

exports.do = (request, response) => {
  try {
    checkParams(request)
    .then(() => {
      return response.status(200).send({
        success: true, 
      });
    }).catch((result) => {
      return response.status(200).send({
        success: false, 
        message: result[0],
        errors: result[1]
      });
    });
  } catch (error) {
    console.error(error);
    return response.status(500).send({
      success: false, 
      message: request.__('unavailableService')
    });
  };
};

const checkParams = (request) => {
  return new Promise((resolve, reject) => {
    try {
      let params = request.body;
      let rejects = {};
      if (validate.isEmpty(params.gender)) {
        rejects['gender'] = request.__('requiredField');
      }
      if (validate.isEmpty(params.orientation)) {
        rejects['orientation'] = request.__('requiredField');
      }
      if (validate.isEmpty(params.maritalStatus)) {
        rejects['maritalStatus'] = request.__('requiredField');
      }
      if (validate.isEmpty(params.relationship)) {
        rejects['relationship'] = request.__('requiredField');
      } else {
        if (params.relationship === "5fa9eb3a201036a4efa3f271") {
          if (validate.isEmpty(params.sugar)) {
            rejects['sugar'] = request.__('requiredField');
          }
        }
      }
      if (Object.entries(rejects).length === 0) {
        return resolve();
      } else {
        return reject([request.__('checkTheForm'), rejects]);
      }
    } catch (error) {
      console.error(error);
      return reject([request.__('unavailableService'), null]);
    }
  });
};