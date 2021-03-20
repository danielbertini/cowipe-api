const moment = require("moment");
const sgMail = require("@sendgrid/mail");
const bcrypt = require("bcrypt");

exports.get = (request, response) => {
  try {
    jwt.verify(
      request.headers.authorization,
      config.jwt.secret,
      (error, decode) => {
        if (error) {
          console.error(error);
          response.status(401).send({
            success: false,
            message: request.__("invalidToken"),
          });
        } else {
          db.collection("users")
            .findOne({ _id: ObjectId(decode.id) })
            .then((result) => {
              response.status(200).send({
                success: true,
                data: {
                  username: result.username,
                  email: result.email,
                  birthday: result.birthday,
                },
              });
            });
        }
      }
    );
  } catch (error) {
    console.error(error);
    response.status(500).send({
      success: false,
      message: request.__("unavailableService"),
    });
  }
};

exports.emailChangeRequestPending = (request, response) => {
  try {
    jwt.verify(
      request.headers.authorization,
      config.jwt.secret,
      (error, decode) => {
        if (error) {
          console.error(error);
          response.status(401).send({
            success: false,
            message: request.__("invalidToken"),
          });
        } else {
          db.collection("verificationCodes")
            .findOne({
              _userId: ObjectId(decode.id),
            })
            .then((result, error) => {
              if (error) {
                response.status(200).send({
                  success: true,
                });
              } else {
                if (result) {
                  response.status(200).send({
                    success: true,
                    data: {
                      email: result.email,
                    },
                  });
                } else {
                  response.status(200).send({
                    success: true,
                  });
                }
              }
            });
        }
      }
    );
  } catch (error) {
    console.error(error);
    response.status(500).send({
      success: false,
      message: request.__("unavailableService"),
    });
  }
};

exports.cancelEmailChange = (request, response) => {
  try {
    jwt.verify(
      request.headers.authorization,
      config.jwt.secret,
      (error, decode) => {
        if (error) {
          console.error(error);
          response.status(401).send({
            success: false,
            message: request.__("invalidToken"),
          });
        } else {
          db.collection("verificationCodes")
            .deleteOne({
              _userId: ObjectId(decode.id),
            })
            .then((result, error) => {
              if (error) {
                response.status(200).send({
                  success: false,
                  message: request.__("unavailableService"),
                });
              } else {
                response.status(200).send({
                  success: true,
                });
              }
            });
        }
      }
    );
  } catch (error) {
    console.error(error);
    response.status(500).send({
      success: false,
      message: request.__("unavailableService"),
    });
  }
};

exports.informations = (request, response) => {
  try {
    jwt.verify(
      request.headers.authorization,
      config.jwt.secret,
      (error, decode) => {
        if (error) {
          console.error(error);
          response.status(403).send({
            success: false,
            message: request.__("invalidAccess"),
          });
        } else {
          checkInformationsParams(request)
            .then(() => checkUsername(request, decode.id))
            .then(() => getZodiac(request))
            .then(() => getZodiac(request))
            .then((zodiac) => persistInformations(request, zodiac, decode.id))
            .then(() => getUser(request, decode.id))
            .then((result) => {
              response.status(200).send({
                success: true,
                document: {
                  username: result.username,
                  email: result.email,
                  picture: result.picture,
                },
              });
            })
            .catch((result) => {
              response.status(200).send({
                success: false,
                message: result[0],
                errors: result[1],
              });
            });
        }
      }
    );
  } catch (error) {
    console.error(error);
    response.status(500).send({
      success: false,
      message: request.__("unavailableService"),
    });
  }
};

const checkInformationsParams = (request) => {
  return new Promise((resolve, reject) => {
    try {
      let params = request.body;
      let rejects = {};
      if (validate.isEmpty(params.username)) {
        rejects["username"] = request.__("requiredField");
      }
      if (validate.isEmpty(params.birthday)) {
        rejects["birthday"] = request.__("requiredField");
      } else {
        const age = parseInt(
          moment(params.birthday, "DD/MM/YYYY").fromNow(true).split(/ (.+)/)[0]
        );
        if (age < 18) {
          rejects["birthday"] = request.__("minimumAge18Years");
        }
      }
      if (Object.entries(rejects).length === 0) {
        resolve();
      } else {
        reject([request.__("checkTheForm"), rejects]);
      }
    } catch (error) {
      console.error(error);
      reject([request.__("unavailableService"), null]);
    }
  });
};

const checkUsername = (request, id) => {
  return new Promise((resolve, reject) => {
    try {
      let params = request.body;
      db.collection("users")
        .findOne({
          username: sanitizer.string(params.username),
          _id: { $ne: ObjectId(id) },
        })
        .then((result) => {
          if (result) {
            return reject([
              request.__("checkTheForm"),
              { username: request.__("usernameAlreadyInUse") },
            ]);
          } else {
            return resolve();
          }
        });
    } catch (error) {
      console.log(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const getZodiac = (request) => {
  return new Promise((resolve, reject) => {
    try {
      let params = request.body;
      let day = params.birthday.substring(0, 2);
      let month = params.birthday.substring(3, 5);
      db.collection("zodiacSigns")
        .findOne({
          order: parseFloat(validate.getZodiac(parseInt(day), parseInt(month))),
        })
        .then((result) => {
          if (result) {
            return resolve(result._id);
          } else {
            return reject([request.__("unavailableService"), null]);
          }
        });
    } catch (error) {
      console.log(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const persistInformations = (request, zodiac, id) => {
  return new Promise((resolve, reject) => {
    try {
      let params = request.body;
      let document = {
        username: sanitizer.string(params.username),
        _zodiac: ObjectId(zodiac),
        birthday: new Date(
          moment(params.birthday, "DD/MM/YYYY").format("YYYY-MM-DD")
        ),
      };
      db.collection("users").updateOne(
        { _id: ObjectId(id) },
        { $set: document },
        { upsert: false },
        (error, result) => {
          if (error) {
            logger.fail(error);
            return reject([request.__("unavailableService"), null]);
          } else {
            return resolve();
          }
        }
      );
    } catch (error) {
      console.error(error);
      reject([request.__("unavailableService"), null]);
    }
  });
};

exports.email = (request, response) => {
  try {
    jwt.verify(
      request.headers.authorization,
      config.jwt.secret,
      (error, decode) => {
        if (error) {
          console.error(error);
          response.status(403).send({
            success: false,
            message: request.__("invalidAccess"),
          });
        } else {
          checkEmailParams(request)
            .then(() => checkIfEmailChanged(request, decode.id))
            .then(() => checkIfEmailAlreadyIUse(request, decode.id))
            .then(() => persistVerificationCode(request, decode.id))
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
        }
      }
    );
  } catch (error) {
    console.error(error);
    response.status(500).send({
      success: false,
      message: request.__("unavailableService"),
    });
  }
};

const checkEmailParams = (request) => {
  return new Promise((resolve, reject) => {
    try {
      let params = request.body;
      let rejects = {};
      if (validate.isEmpty(params.email)) {
        rejects["email"] = request.__("requiredField");
      } else {
        if (validate.email(params.email)) {
          rejects["email"] = request.__("invalidEmail");
        }
      }
      if (Object.entries(rejects).length === 0) {
        resolve();
      } else {
        reject([request.__("checkTheForm"), rejects]);
      }
    } catch (error) {
      console.error(error);
      reject([request.__("unavailableService"), null]);
    }
  });
};

const checkIfEmailChanged = (request, id) => {
  return new Promise((resolve, reject) => {
    try {
      let params = request.body;
      db.collection("users")
        .findOne({
          email: sanitizer.string(params.email),
          _id: ObjectId(id),
        })
        .then((result) => {
          if (result) {
            return reject([
              request.__("checkTheForm"),
              { email: request.__("youAlreadyUsingThisEmail") },
            ]);
          } else {
            return resolve();
          }
        });
    } catch (error) {
      console.log(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const checkIfEmailAlreadyIUse = (request, id) => {
  return new Promise((resolve, reject) => {
    try {
      let params = request.body;
      db.collection("users")
        .findOne({
          email: sanitizer.string(params.email),
          _id: { $ne: ObjectId(id) },
        })
        .then((result) => {
          if (result) {
            return reject([
              request.__("checkTheForm"),
              { email: request.__("emailAlreadyInUse") },
            ]);
          } else {
            return resolve();
          }
        });
    } catch (error) {
      console.log(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const persistVerificationCode = (request, id) => {
  return new Promise((resolve, reject) => {
    try {
      const code = Math.floor(100000 + Math.random() * 900000);
      let params = request.body;
      db.collection("verificationCodes")
        .findOne({
          _userId: ObjectId(id),
          email: sanitizer.string(params.email),
        })
        .then((result) => {
          if (result) {
            return resolve();
          } else {
            let document = {
              _userId: ObjectId(id),
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
      sgMail.setApiKey(config.sendgrid.api_key);
      const msg = {
        to: params.email,
        from: `${config.app.name} <${config.app.email}>`,
        subject: request.__("email.verificationCode.subject", {
          name: params.username,
          code: code,
        }),
        text: request.__("email.verificationCode.text", {
          name: params.username,
          code: code,
          company: config.app.name,
        }),
        html: request.__("email.verificationCode.html", {
          name: params.username,
          code: code,
          company: config.app.name,
        }),
      };
      sgMail.send(msg);
      return resolve(code);
    } catch (error) {
      console.log(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

exports.checkCodeToChangeEmail = (request, response) => {
  try {
    jwt.verify(
      request.headers.authorization,
      config.jwt.secret,
      (error, decode) => {
        if (error) {
          console.error(error);
          response.status(403).send({
            success: false,
            message: request.__("invalidAccess"),
          });
        } else {
          checkCodeToChangeEmailParams(request)
            .then(() => checkCode(request, decode.id))
            .then((email) => persistUserNewEmail(request, decode.id, email))
            .then(() => cleanVerificationCode(request, decode.id))
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
        }
      }
    );
  } catch (error) {
    console.error(error);
    response.status(500).send({
      success: false,
      message: request.__("unavailableService"),
    });
  }
};

const checkCodeToChangeEmailParams = (request) => {
  return new Promise((resolve, reject) => {
    try {
      let params = request.body;
      let rejects = {};
      if (validate.isEmpty(params.code)) {
        rejects["code"] = request.__("requiredField");
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

const checkCode = (request, id) => {
  return new Promise((resolve, reject) => {
    try {
      let rejects = {};
      let params = request.body;
      db.collection("verificationCodes")
        .findOne({
          code: parseFloat(params.code),
          _userId: ObjectId(id),
        })
        .then((result) => {
          if (result) {
            return resolve(result.email);
          } else {
            rejects["code"] = request.__("invalidCode");
            return reject([request.__("checkTheForm"), rejects]);
          }
        });
    } catch (error) {
      console.log(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const persistUserNewEmail = (request, id, email) => {
  return new Promise((resolve, reject) => {
    try {
      let document = {
        email: email,
      };
      db.collection("users").updateOne(
        { _id: ObjectId(id) },
        { $set: document },
        { upsert: false },
        (error, result) => {
          if (error) {
            logger.fail(error);
            return reject([request.__("unavailableService"), null]);
          } else {
            return resolve();
          }
        }
      );
    } catch (error) {
      console.log(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const cleanVerificationCode = (request, id) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("verificationCodes").deleteMany(
        { _userId: ObjectId(id) },
        (error) => {
          if (error) {
            console.error(error);
            return reject([request.__("unavailableService"), null]);
          } else {
            return resolve();
          }
        }
      );
    } catch (error) {
      console.log(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

exports.password = (request, response) => {
  try {
    jwt.verify(
      request.headers.authorization,
      config.jwt.secret,
      (error, decode) => {
        if (error) {
          console.error(error);
          response.status(403).send({
            success: false,
            message: request.__("invalidAccess"),
          });
        } else {
          checkPasswordParams(request)
            .then(() => checkUserPassword(request, decode.id))
            .then(() => persistUserNewPassword(request, decode.id))
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
        }
      }
    );
  } catch (error) {
    console.error(error);
    response.status(500).send({
      success: false,
      message: request.__("unavailableService"),
    });
  }
};

const checkPasswordParams = (request) => {
  return new Promise((resolve, reject) => {
    try {
      let params = request.body;
      let rejects = {};
      if (validate.isEmpty(params.currentPassword)) {
        rejects["currentPassword"] = request.__("requiredField");
      }
      if (validate.isEmpty(params.newPassword)) {
        rejects["newPassword"] = request.__("requiredField");
      }
      if (validate.isEmpty(params.passwordRepeat)) {
        rejects["passwordRepeat"] = request.__("requiredField");
      }
      if (
        !validate.isEmpty(params.newPassword) &&
        !validate.isEmpty(params.passwordRepeat)
      ) {
        if (params.newPassword != params.passwordRepeat) {
          rejects["newPassword"] = request.__("passwordsAreNotTheSame");
          rejects["passwordRepeat"] = request.__("passwordsAreNotTheSame");
        }
      }
      if (Object.entries(rejects).length === 0) {
        resolve();
      } else {
        reject([request.__("checkTheForm"), rejects]);
      }
    } catch (error) {
      console.error(error);
      reject([request.__("unavailableService"), null]);
    }
  });
};

const checkUserPassword = (request, id) => {
  return new Promise((resolve, reject) => {
    try {
      let rejects = {};
      let params = request.body;
      db.collection("users")
        .findOne(
          {
            _id: ObjectId(id),
          },
          {
            projection: {
              _id: 1,
              username: 1,
              password: 1,
            },
          }
        )
        .then((result) => {
          if (result) {
            bcrypt.compare(
              params.currentPassword,
              result.password,
              function (error, res) {
                if (error || !res) {
                  rejects["currentPassword"] = request.__("invalidPassword");
                  return reject([request.__("checkTheForm"), rejects]);
                } else {
                  return resolve();
                }
              }
            );
          } else {
            return reject([request.__("unavailableService"), null]);
          }
        });
    } catch (error) {
      console.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const persistUserNewPassword = (request, id) => {
  return new Promise((resolve, reject) => {
    try {
      let params = request.body;
      let document = {
        password: bcrypt.hashSync(params.newPassword, bcrypt.genSaltSync(10)),
      };
      db.collection("users").updateOne(
        { _id: ObjectId(id) },
        { $set: document },
        { upsert: false },
        (error, result) => {
          if (error) {
            console.error(error);
            return reject([request.__("unavailableService"), null]);
          } else {
            return resolve();
          }
        }
      );
    } catch (error) {
      console.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const getUser = (request, id) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("users")
        .findOne({
          _id: ObjectId(id),
        })
        .then((result, error) => {
          if (error) {
            console.error(error);
            reject([request.__("unavailableService"), null]);
          } else {
            return resolve(result);
          }
        });
    } catch (error) {
      console.log(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};
