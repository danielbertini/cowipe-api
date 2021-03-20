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
            .then(() => checkifAlreadyBlocked(request, decode.id))
            .then(() => removeMessages(request))
            .then(() => removeConnection(request))
            .then(() => blockProfile(request, decode.id))
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
          if (result) {
            _connectionId = result._id;
            return resolve();
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

const checkifAlreadyBlocked = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("blocked")
        .findOne({
          _user: ObjectId(userId),
          _blocked: ObjectId(request.body.id),
        })
        .then((result) => {
          if (result) {
            return reject([request.__("blocked"), null]);
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
              console.error("removeMessages");
              return reject([request.__("unavailableService"), null]);
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
              console.error("removeConnection");
              return reject([request.__("unavailableService"), null]);
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

const blockProfile = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      let document = {
        _user: ObjectId(userId),
        _blocked: ObjectId(request.body.id),
        created: new Date(),
      };
      db.collection("blocked").insertOne(document, (error) => {
        if (error) {
          return reject([request.__("unavailableService"), null]);
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
