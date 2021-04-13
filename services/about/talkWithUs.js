const postMark = require("postmark");
const postMarkClient = new postMark.ServerClient(config.postmark.api_key);

exports.do = (request, response) => {
  try {
    checkParams(request)
      .then(() => sendMessage(request))
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
      if (validate.isEmpty(params.name)) {
        rejects["name"] = request.__("requiredField");
      }
      if (validate.isEmpty(params.email)) {
        rejects["email"] = request.__("requiredField");
      } else {
        if (validate.email(params.email)) {
          rejects["email"] = request.__("invalidEmail");
        }
      }
      if (validate.isEmpty(params.message)) {
        rejects["message"] = request.__("requiredField");
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

const sendMessage = (request, code) => {
  return new Promise((resolve, reject) => {
    try {
      let params = request.body;
      postMarkClient.sendEmail({
        From: config.app.email,
        To: config.app.email,
        ReplyTo: `${params.name} <${params.email}>`,
        Subject: request.__("email.talkWithUs.subject"),
        HtmlBody: params.message,
        TextBody: params.message,
        MessageStream: "outbound",
      });
      return resolve(code);
    } catch (error) {
      console.log(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};
