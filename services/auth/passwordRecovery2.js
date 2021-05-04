const bcrypt = require("bcrypt");

exports.do = (request, response) => {
  try {
    checkParams(request)
      .then(() => checkCode(request))
      .then(() => updateCodeChecked(request))
      .then(() => updatePassword(request))
      .then(() => cleanCheckedCodes(request))
      .then(() => {
        response.status(200).send({
          success: true,
        });
      })
      .catch((result) => {
        response.status(200).send({
          success: false,
          message: result[0],
          errors: result[1],
        });
      });
  } catch (error) {
    log.error(error);
    response.status(500).send({
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
      if (validate.isEmpty(params.code)) {
        rejects["code"] = request.__("requiredField");
      }
      if (validate.isEmpty(params.password)) {
        rejects["password"] = request.__("requiredField");
      }
      if (validate.isEmpty(params.passwordRetype)) {
        rejects["passwordRetype"] = request.__("requiredField");
      }
      if (params.password !== params.passwordRetype) {
        rejects["password"] = request.__("passwordsAreNotTheSame");
        rejects["passwordRetype"] = request.__("passwordsAreNotTheSame");
      }
      if (Object.entries(rejects).length === 0) {
        return resolve();
      } else {
        return reject([request.__("checkTheForm"), rejects]);
      }
    } catch (error) {
      log.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const checkCode = (request) => {
  return new Promise((resolve, reject) => {
    try {
      let params = request.body;
      console.log(sanitizer.string(params.email));
      db.collection("verificationCodes")
        .findOne({
          email: sanitizer.string(params.email),
          code: parseFloat(params.code),
        })
        .then((result, error) => {
          if (result) {
            return resolve(result);
          } else {
            return reject([
              request.__("checkTheForm"),
              { code: request.__("invalidCode") },
            ]);
          }
        });
    } catch (error) {
      log.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const updateCodeChecked = (request) => {
  return new Promise((resolve, reject) => {
    try {
      let params = request.body;
      const query = {
        email: sanitizer.string(params.email),
        code: parseFloat(params.code),
      };
      const update = {
        $set: {
          checked: true,
        },
      };
      db.collection("verificationCodes")
        .updateOne(query, update)
        .then((result, error) => {
          if (result && result.result.ok === 1) {
            return resolve();
          } else {
            return reject([request.__("unavailableService"), null]);
          }
        })
        .catch((error) => {
          log.error(error);
          return reject([request.__("unavailableService"), null]);
        });
    } catch (error) {
      log.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const updatePassword = (request) => {
  return new Promise((resolve, reject) => {
    try {
      let params = request.body;
      let document = {
        password: bcrypt.hashSync(params.password, bcrypt.genSaltSync(10)),
      };
      db.collection("users").updateOne(
        { email: params.email },
        { $set: document },
        { upsert: false },
        (error) => {
          if (error) {
            log.error(error);
            return reject([request.__("unavailableService"), null]);
          } else {
            return resolve();
          }
        }
      );
    } catch (error) {
      log.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const cleanCheckedCodes = (request) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("verificationCodes").deleteMany(
        { checked: true },
        (error) => {
          if (error) {
            log.error(error);
            return reject([request.__("unavailableService"), null]);
          } else {
            return resolve();
          }
        }
      );
    } catch (error) {
      log.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};
