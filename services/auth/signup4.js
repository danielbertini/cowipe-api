const moment = require("moment");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");

exports.do = (request, response) => {
  try {
    checkParams(request)
      .then(() => checkCode(request))
      .then(() => updateCodeChecked(request))
      .then(() => cleanCheckedCodes(request))
      .then(() => checkAllParams(request))
      .then(() => checkUsername(request))
      .then(() => checkEmail(request))
      .then(() => getZodiac(request))
      .then((zodiac) => persistUser(request, zodiac))
      .then((document) => createToken(request, document))
      .then((document) => getLocationById(request, document))
      .then((result) => {
        response.status(200).send({
          success: true,
          document: {
            email: result[0].email,
            username: result[0].username,
            picture: result[0].picture,
          },
          preferences: result[0].preferences,
          token: result[1],
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
      if (validate.isEmpty(params.code) && params.checkCodeLater === false) {
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

const checkCode = (request) => {
  return new Promise((resolve, reject) => {
    try {
      let params = request.body;
      if (params.checkCodeLater === false) {
        db.collection("verificationCodes")
          .findOne({
            email: sanitizer.string(params.email),
            code: parseFloat(params.code),
          })
          .then((result) => {
            if (result) {
              return resolve();
            } else {
              return reject([
                request.__("checkTheForm"),
                { code: request.__("invalidCode") },
              ]);
            }
          });
      } else {
        return resolve();
      }
    } catch (error) {
      console.log(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const updateCodeChecked = (request) => {
  return new Promise((resolve, reject) => {
    try {
      let params = request.body;
      if (params.checkCodeLater === false) {
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
          .then((result) => {
            if (result && result.result.ok === 1) {
              return resolve();
            } else {
              return reject([request.__("unavailableService"), null]);
            }
          })
          .catch((error) => {
            console.log(error);
            return reject([request.__("unavailableService"), null]);
          });
      } else {
        return resolve();
      }
    } catch (error) {
      console.log(error);
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
            console.log(error);
            return reject(["Serviço indisponível", null]);
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

const checkAllParams = (request) => {
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
      if (validate.isEmpty(params.password)) {
        rejects["password"] = request.__("requiredField");
      }
      if (validate.isEmpty(params.passwordRetype)) {
        rejects["passwordRetype"] = request.__("requiredField");
      }
      if (params.password !== params.passwordRetype) {
        rejects["passwordRetype"] = request.__("passwordsAreNotTheSame");
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
      if (validate.isEmpty(params.gender)) {
        rejects["gender"] = request.__("requiredField");
      }
      if (validate.isEmpty(params.orientation)) {
        rejects["orientation"] = request.__("requiredField");
      }
      if (validate.isEmpty(params.maritalStatus)) {
        rejects["maritalStatus"] = request.__("requiredField");
      }
      if (validate.isEmpty(params.relationship)) {
        rejects["relationship"] = request.__("requiredField");
      } else {
        if (params.relationship === "5fa9eb3a201036a4efa3f271") {
          if (validate.isEmpty(params.sugar)) {
            rejects["sugar"] = request.__("requiredField");
          }
        }
      }
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

const checkUsername = (request) => {
  return new Promise((resolve, reject) => {
    try {
      let params = request.body;
      db.collection("users")
        .findOne({
          username: sanitizer.string(params.username),
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

const checkEmail = (request) => {
  return new Promise((resolve, reject) => {
    try {
      let params = request.body;
      db.collection("users")
        .findOne({
          email: sanitizer.string(params.email),
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

const persistUser = (request, zodiac) => {
  return new Promise((resolve, reject) => {
    try {
      let params = request.body;
      let document = {
        username: sanitizer.string(params.username),
        birthday: new Date(
          moment(params.birthday, "DD/MM/YYYY").format("YYYY-MM-DD")
        ),
        email: sanitizer.string(params.email),
        password: bcrypt.hashSync(params.password, bcrypt.genSaltSync(10)),
        _visibility: ObjectId("5fb190984d7be2e5ed27d7e2"),
        _zodiac: ObjectId(zodiac),
        relationship: {
          _gender: ObjectId(params.gender),
          _orientation: ObjectId(params.orientation),
          _maritalStatus: ObjectId(params.maritalStatus),
          _relationship: ObjectId(params.relationship),
          _sugar: ObjectId(params.sugar),
        },
        appearance: {
          height: parseInt(params.height),
          weight: parseInt(params.weight),
          _bodyType: ObjectId(params.bodyType),
          _hairColor: ObjectId(params.hairColor),
          _eyeColor: ObjectId(params.eyeColor),
        },
        preferences: {
          sound: true,
          visibility: true,
          reserved: false,
        },
        tuneSearch: {
          usersOnline: false,
          usersWithPhoto: false,
          age: [18, 100],
          distance: 200,
          height: [100, 250],
          weight: [40, 200],
        },
        location: {
          type: "Polygon",
          coordinates: [0, 0],
        },
        visits: 0,
        _plan: ObjectId("604932d1b1c9d996bcce4192"),
        created: new Date(),
      };
      db.collection("users").insertOne(document, (error) => {
        if (error) {
          console.error(error);
          return reject([request.__("unavailableService"), null]);
        } else {
          db.collection("users")
            .findOne(
              {
                _id: ObjectId(document._id),
              },
              {
                projection: {
                  _id: 1,
                  email: 1,
                  username: 1,
                  picture: 1,
                  preferences: 1,
                },
              }
            )
            .then((result) => {
              if (result) {
                return resolve(result);
              } else {
                return reject([request.__("unavailableService"), null]);
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

const createToken = (request, document) => {
  return new Promise((resolve, reject) => {
    try {
      let token = jwt.sign(
        {
          id: document._id,
          email: document.email,
          username: document.username,
          picture: document.picture,
        },
        config.jwt.secret,
        {}
      );
      if (token) {
        return resolve([document, token]);
      } else {
        return reject([request.__("unavailableService"), null]);
      }
    } catch (error) {
      console.error(error);
      reject([request.__("unavailableService"), null]);
    }
  });
};

const getLocationById = (request, document) => {
  return new Promise((resolve, reject) => {
    try {
      if (request.body.userIp) {
        axios
          .get(
            `http://api.ipstack.com/${request.body.userIp}?access_key=${config.ipstack.key}`
          )
          .then((response) => {
            if (response.data.latitude && response.data.longitude) {
              let data = {
                location: {
                  type: "Polygon",
                  coordinates: [
                    response.data.latitude,
                    response.data.longitude,
                  ],
                },
                networkInfo: {
                  ip: response.data.ip,
                  type: response.data.type,
                  continent_code: response.data.continent_code,
                  continent_name: response.data.continent_name,
                  country_code: response.data.country_code,
                  country_name: response.data.country_name,
                  region_code: response.data.region_code,
                  region_name: response.data.region_name,
                  city: response.data.city,
                  zip: response.data.zip,
                },
              };
              db.collection("users").updateOne(
                { _id: ObjectId(document._id) },
                { $set: data },
                { upsert: false },
                (error) => {
                  if (error) {
                    console.error(error);
                    return resolve(document);
                  } else {
                    return resolve(document);
                  }
                }
              );
            } else {
              return resolve(document);
            }
          })
          .catch(function (error) {
            console.error(error);
            return resolve(document);
          });
      } else {
        return resolve(document);
      }
    } catch (error) {
      console.error(error);
      reject([request.__("unavailableService"), null]);
    }
  });
};
