const postMark = require("postmark");
const postMarkClient = new postMark.ServerClient(config.postmark.api_key);

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
          checkBlockedUsers(request, decode.id)
            .then(() => checkReservedOption(request))
            .then(() => checkConnection(request, decode.id))
            .then(() => createConnection(request, decode.id))
            .then(() => createActivity(request, decode.id))
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

const checkBlockedUsers = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("blocked")
        .findOne({
          $or: [
            {
              _user: ObjectId(userId),
              _blocked: ObjectId(request.body.id),
            },
            {
              _user: ObjectId(request.body.id),
              _blocked: ObjectId(userId),
            },
          ],
        })
        .then((result) => {
          if (result && result._id) {
            return reject([request.__("connection.blockedUser"), null]);
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

const checkReservedOption = (request) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("users")
        .findOne({
          _id: ObjectId(request.body.id),
        })
        .then((result) => {
          if (result) {
            if (result.preferences && result.preferences.reserved) {
              return reject([request.__("connection.reserved"), null]);
            } else {
              return resolve();
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
              return reject([request.__("connection.connected"), null]);
            } else {
              return reject([request.__("connection.pendding"), null]);
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

const createConnection = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      let document = {
        _user: ObjectId(userId),
        _targetUser: ObjectId(request.body.id),
        connected: false,
        created: new Date(),
      };
      db.collection("connections").insertOne(document, (error) => {
        if (error) {
          console.log(error);
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

const createActivity = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      let document = {
        _userFrom: ObjectId(userId),
        _userTo: ObjectId(request.body.id),
        _activityType: ObjectId("602abccb6bbe06fa92010b7d"),
        created: new Date(),
      };
      db.collection("activities").insertOne(document, (error) => {
        if (error) {
          console.error(error);
          return reject([request.__("unavailableService"), null]);
        } else {
          sendEmail(request, userId, request.body.id);
          socketEmit(request.body.id, "activity", "602abccb6bbe06fa92010b7d");
          return resolve();
        }
      });
    } catch (error) {
      console.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const getConnectionStatus = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("connections")
        .findOne({
          _user: ObjectId(userId),
          _targetUser: ObjectId(request.body.id),
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

const socketEmit = (userId, chanel, message) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("users")
        .findOne({
          _id: ObjectId(userId),
        })
        .then((result) => {
          if (result && result._id) {
            if (result.online && result.socketId) {
              io.to(result.socketId).emit(chanel, message);
            }
          }
          return;
        });
    } catch (error) {
      console.error(error);
    }
  });
};

const sendEmail = async (request, from, to) => {
  try {
    const userFrom = await db
      .collection("users")
      .findOne({
        _id: ObjectId(from),
      })
      .then((result) => {
        return result;
      });
    const userTo = await db
      .collection("users")
      .findOne({
        _id: ObjectId(to),
      })
      .then((result) => {
        return result;
      });
    if (userTo && userFrom) {
      postMarkClient.sendEmail({
        From: config.app.email,
        To: userTo.email,
        Subject: request.__("email.connectionRequest.subject", {
          from: userFrom.username,
          to: userTo.username,
          company: config.app.name,
        }),
        HtmlBody: request.__("email.connectionRequest.html", {
          from: userFrom.username,
          to: userTo.username,
          company: config.app.name,
        }),
        TextBody: request.__("email.connectionRequest.text", {
          from: userFrom.username,
          to: userTo.username,
          company: config.app.name,
        }),
        MessageStream: "outbound",
      });
    }
    return;
  } catch (error) {
    console.error(error);
    return;
  }
};
