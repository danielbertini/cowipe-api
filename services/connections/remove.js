var _connectionId = null;

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
          getConnection(request, decode.id)
            .then(() => removeMessages(request))
            .then(() => removeConnection(request))
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

const getConnection = (request, userId) => {
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
            _connectionId = result._id;
            return resolve();
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

const removeMessages = (request) => {
  return new Promise((resolve, reject) => {
    try {
      if (_connectionId) {
        db.collection("messages")
          .deleteMany({
            _connection: ObjectId(_connectionId),
          })
          .then((result) => {
            if (result) {
              return resolve();
            } else {
              return reject([request.__("unavailableService"), null]);
            }
          });
      } else {
        return reject([request.__("unavailableService"), null]);
      }
    } catch (error) {
      console.log(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const removeConnection = (request) => {
  return new Promise((resolve, reject) => {
    try {
      if (_connectionId) {
        db.collection("connections")
          .deleteMany({
            _id: ObjectId(_connectionId),
          })
          .then((result) => {
            if (result) {
              return resolve();
            } else {
              return reject([request.__("unavailableService"), null]);
            }
          });
      } else {
        return reject([request.__("unavailableService"), null]);
      }
    } catch (error) {
      console.log(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};
