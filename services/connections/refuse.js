var _connection = null;

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
          updateConnection(request, decode.id)
            .then(() => getConnectionStatus(request, decode.id))
            .then(() => {
              response.status(200).send({
                success: true,
                connection: _connection,
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

const updateConnection = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("connections")
        .deleteMany({
          _user: ObjectId(request.body.id),
          _targetUser: ObjectId(userId),
        })
        .then((result) => {
          if (result) {
            return resolve();
          } else {
            console.error(error);
            return reject([request.__("unavailableService"), null]);
          }
        });
    } catch (error) {
      console.log(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const getConnectionStatus = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("connections")
        .findOne({
          _user: ObjectId(request.body.id),
          _targetUser: ObjectId(userId),
        })
        .then((result) => {
          if (result && result._id) {
            if (result.connected) {
              _connection = 4; // connected...
              return resolve();
            } else {
              _connection = 2; // waiting for approval...
              return resolve();
            }
          } else {
            db.collection("connections")
              .findOne({
                _user: ObjectId(request.body.id),
                _targetUser: ObjectId(userId),
              })
              .then((result) => {
                if (result && result._id) {
                  if (result.connected) {
                    _connection = 4; // connected...
                    return resolve();
                  } else {
                    _connection = 3; // ask to approve...
                    return resolve();
                  }
                } else {
                  _connection = 1; // nothing...
                  return resolve();
                }
              });
          }
        });
    } catch (error) {
      console.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};
