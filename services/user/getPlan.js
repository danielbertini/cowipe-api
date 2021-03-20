exports.do = (request, response) => {
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
          getUserPlan(request, decode.id)
            .then((user) => getPlan(request, user))
            .then((result) => {
              response.status(200).send({
                success: true,
                result: result,
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

const getUserPlan = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("users")
        .findOne({
          _id: ObjectId(userId),
        })
        .then((result) => {
          if (result && result._id) {
            return resolve(result);
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

const getPlan = (request, user) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("plans")
        .findOne({
          _id: ObjectId(user._plan),
        })
        .then((result) => {
          if (result && result._id) {
            return resolve(result);
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
