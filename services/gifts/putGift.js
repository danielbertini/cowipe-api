var _gift = null;
var _balance = null;
var _newBalance = null;
var _usersConnection = null;

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
          getGift(request)
            .then(() => getBalance(request, decode.id))
            .then(() => checkBalance(request))
            .then(() => debtCoin(request, decode.id))
            .then(() => putGift(request, decode.id))
            .then(() => getUsersConnection(request, decode.id))
            .then(() => notifyUser(request))
            .then(() => {
              response.status(200).send({
                success: true,
                newBalance: _newBalance,
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

const getGift = (request) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("gifts")
        .findOne({
          _id: ObjectId(request.body.giftId),
        })
        .then((result) => {
          if (result) {
            _gift = result;
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

const getBalance = (request, id) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("users")
        .findOne({
          _id: ObjectId(id),
        })
        .then((result) => {
          if (result) {
            _balance = result.balance;
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

const checkBalance = (request) => {
  return new Promise((resolve, reject) => {
    try {
      if (_balance < _gift.amount) {
        return reject([request.__("youDontHaveEnoughCoins"), null]);
      } else {
        return resolve();
      }
    } catch (error) {
      console.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const getUsersConnection = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("connections")
        .findOne({
          connected: true,
          $or: [
            {
              _user: ObjectId(userId),
              _targetUser: ObjectId(request.body.userId),
            },
            {
              _user: ObjectId(request.body.userId),
              _targetUser: ObjectId(userId),
            },
          ],
        })
        .then((result) => {
          if (result) {
            _usersConnection = result.connected;
            return resolve();
          } else {
            _usersConnection = false;
            return resolve();
          }
        });
    } catch (error) {
      console.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const debtCoin = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      let document = {
        balance: parseInt(_balance - _gift.amount),
      };
      db.collection("users").updateOne(
        { _id: ObjectId(userId) },
        { $set: document },
        { upsert: false },
        (error) => {
          if (error) {
            logger.fail(error);
            return reject([request.__("unavailableService"), null]);
          } else {
            _newBalance = document.balance;
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

const putGift = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      let document = {
        _gift: ObjectId(request.body.giftId),
        _from: ObjectId(userId),
        _to: ObjectId(request.body.userId),
        read: false,
        created: new Date(),
      };
      db.collection("userGifts").insertOne(document, (error) => {
        if (error) {
          console.error(error);
          return reject([request.__("unavailableService"), null]);
        } else {
          return resolve();
        }
      });
    } catch (error) {
      console.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const notifyUser = (request) => {
  return new Promise((resolve, reject) => {
    try {
      // TODO: Send chat message with gift if users hava a connection?
      if (_usersConnection) {
      }
      db.collection("users")
        .findOne({
          _id: ObjectId(request.body.userId),
        })
        .then((result) => {
          if (result && result.online && result.socketId) {
            io.to(result.socketId).emit("newGift", "");
          }
          return resolve();
        });
    } catch (error) {
      console.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};
