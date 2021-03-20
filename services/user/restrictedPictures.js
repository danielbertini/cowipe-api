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
          checkConnection(request, decode.id)
            .then(() => getPictures(request))
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

const checkConnection = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("connections")
        .findOne({
          $or: [
            {
              _user: ObjectId(userId),
              _targetUser: ObjectId(request.body.id),
            },
            {
              _user: ObjectId(request.body.id),
              _targetUser: ObjectId(userId),
            },
          ],
        })
        .then((result) => {
          if (result && result._id) {
            if (result.connected) {
              return resolve();
            } else {
              return reject([request.__("unavailableService"), null]);
            }
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

const getPictures = (request) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("pictures")
        .find({
          _user: ObjectId(request.params.id),
          restricted: true,
        })
        .sort({ created: -1 })
        .skip(request.params.skip ? parseInt(request.params.skip) : 0)
        .limit(request.params.limit ? parseInt(request.params.limit) : 30)
        .toArray()
        .then((result) => {
          return resolve(result);
        });
    } catch (error) {
      console.log(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};
