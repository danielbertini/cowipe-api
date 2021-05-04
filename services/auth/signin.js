const bcrypt = require("bcrypt");

exports.do = (request, response) => {
  try {
    checkParams(request)
      .then(() => checkAccess(request))
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
      if (Object.entries(rejects).length === 0) {
        resolve();
      } else {
        reject([request.__("checkTheForm"), rejects]);
      }
    } catch (error) {
      log.error(error);
      reject([request.__("unavailableService"), null]);
    }
  });
};

const checkAccess = (request) => {
  return new Promise((resolve, reject) => {
    try {
      let params = request.body;
      db.collection("users")
        .findOne(
          {
            email: sanitizer.string(params.email),
          },
          {
            projection: {
              _id: 1,
              username: 1,
              password: 1,
              picture: 1,
              preferences: 1,
            },
          }
        )
        .then((result) => {
          if (result) {
            bcrypt.compare(
              params.password,
              result.password,
              function (error, res) {
                if (error || !res) {
                  reject([request.__("invalidAccess"), null]);
                } else {
                  if (res) {
                    db.collection("users")
                      .findOne(
                        {
                          _id: ObjectId(result._id),
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
                          resolve(result);
                        } else {
                          reject([request.__("unavailableService"), null]);
                        }
                      });
                  } else {
                    reject([request.__("invalidAccess"), null]);
                  }
                }
              }
            );
          } else {
            reject([request.__("invalidAccess"), null]);
          }
        });
    } catch (error) {
      log.error(error);
      reject([request.__("unavailableService"), null]);
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
      log.error(error);
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
                { _id: ObjectId(document[0]._id) },
                { $set: data },
                { upsert: false },
                (error) => {
                  if (error) {
                    log.error(error);
                    reject([request.__("unavailableService"), null]);
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
            log.error(error);
            return resolve(document);
          });
      } else {
        return resolve(document);
      }
    } catch (error) {
      log.error(error);
      reject([request.__("unavailableService"), null]);
    }
  });
};
