const moment = require("moment");

exports.do = (request, response) => {
  try {
    checkParams(request)
      .then(() => {
        return response.status(200).send({
          success: true,
        });
      })
      .catch((result) => {
        return response.status(200).send({
          success: false,
          message: result[0],
          errors: result[1],
        });
      });
  } catch (error) {
    console.error(error);
    return response.status(500).send({
      success: false,
      message: request.__("unavailableService"),
    });
  }
};

const checkParams = (request) => {
  return new Promise((resolve, reject) => {
    try {
      let params = request.body;
      let rejects = {};
      if (!parseInt(params.height)) {
        rejects["height"] = request.__("requiredField");
      }
      if (!parseInt(params.weight)) {
        rejects["weight"] = request.__("requiredField");
      }
      if (validate.isEmpty(params.bodyType)) {
        rejects["bodyType"] = request.__("requiredField");
      }
      if (validate.isEmpty(params.hairColor)) {
        rejects["hairColor"] = request.__("requiredField");
      }
      if (validate.isEmpty(params.eyeColor)) {
        rejects["eyeColor"] = request.__("requiredField");
      }
      if (Object.entries(rejects).length === 0) {
        return resolve();
      } else {
        return reject([request.__("checkTheForm"), rejects]);
      }
    } catch (error) {
      console.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};
