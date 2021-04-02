const postMark = require("postmark");
const postMarkClient = new postMark.ServerClient(config.postmark.api_key);

exports.do = (request, response) => {
  try {
    checkParams(request)
      .then(() => checkData(request))
      .then(() => persistVerificationCode(request))
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
    console.error(error);
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
      if (validate.isEmpty(params.username)) {
        rejects["username"] = request.__("requiredField");
      }
      if (validate.isEmpty(params.email)) {
        rejects["email"] = request.__("requiredField");
      } else {
        if (validate.email(params.email)) {
          rejects["email"] = request.__("invalidEmail");
        }
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

const checkData = (request) => {
  return new Promise((resolve, reject) => {
    try {
      let params = request.body;
      db.collection("users")
        .findOne({
          username: sanitizer.string(params.username),
          email: sanitizer.string(params.email),
        })
        .then((result) => {
          if (result) {
            return resolve();
          } else {
            return reject([request.__("invalidAccess"), null]);
          }
        });
    } catch (error) {
      console.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const persistVerificationCode = (request) => {
  return new Promise((resolve, reject) => {
    try {
      const code = Math.floor(100000 + Math.random() * 900000);
      let params = request.body;
      db.collection("verificationCodes")
        .findOne({
          email: sanitizer.string(params.email),
        })
        .then((result) => {
          if (result) {
            return resolve();
          } else {
            let document = {
              email: sanitizer.string(params.email),
              checked: false,
              code: code,
              created: new Date(),
            };
            db.collection("verificationCodes").insertOne(document, (error) => {
              if (error) {
                console.log(error);
                return reject([request.__("unavailableService"), null]);
              } else {
                sendVerificationCode(request, code);
                return resolve();
              }
            });
          }
        });
    } catch (error) {
      console.log(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const sendVerificationCode = (request, code) => {
  return new Promise((resolve, reject) => {
    try {
      let params = request.body;
      postMarkClient.sendEmail({
        From: config.app.email,
        To: params.email,
        Subject: request.__("email.verificationCode.subject", {
          name: params.username,
          code: code,
        }),
        HtmlBody: request.__("email.verificationCode.html", {
          name: params.username,
          code: code,
          company: config.app.name,
        }),
        TextBody: request.__("email.verificationCode.text", {
          name: params.username,
          code: code,
          company: config.app.name,
        }),
        MessageStream: "outbound",
      });
      return resolve(code);
    } catch (error) {
      console.log(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};
