const postMark = require("postmark");
const postMarkClient = new postMark.ServerClient(config.postmark.api_key);

var _profile;
var _item1 = false;
var _item2 = false;
var _item3 = false;
var _item4 = false;
var _item5 = false;
var _alreadyWin = false;

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
          getProfile(request, decode.id)
            .then(() => getPictures(request, decode.id))
            .then(() => getConnections(request, decode.id))
            .then(() => getGifts(request, decode.id))
            .then(() => getMessages(request, decode.id))
            .then(() => parseBonus(request, decode.id))
            .then(() => {
              response.status(200).send({
                success: true,
                result: {
                  item1: _item1,
                  item2: _item2,
                  item3: _item3,
                  item4: _item4,
                  item5: _item5,
                  alreadyWin: _alreadyWin,
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
    log.error(error);
    response.status(500).send({
      success: false,
      message: request.__("unavailableService"),
    });
  }
};

const getProfile = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("users")
        .findOne({
          _id: ObjectId(userId),
        })
        .then((result) => {
          if (result && result._id) {
            _profile = result;
            result.picture ? (_item1 = true) : (_item1 = false);
            result.tipsBonus ? (_alreadyWin = true) : (_alreadyWin = false);
            return resolve();
          } else {
            return reject([request.__("connection.blockedUser"), null]);
          }
        });
    } catch (error) {
      log.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const getPictures = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("pictures")
        .find({
          _user: ObjectId(userId),
        })
        .count()
        .then((result) => {
          result >= 5 ? (_item2 = true) : (_item2 = false);
          return resolve();
        });
    } catch (error) {
      log.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const getConnections = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("connections")
        .find({
          $or: [
            {
              _user: ObjectId(userId),
            },
            {
              _targetUser: ObjectId(userId),
            },
          ],
        })
        .count()
        .then((result) => {
          result > 0 ? (_item3 = true) : (_item3 = false);
          return resolve();
        });
    } catch (error) {
      log.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const getGifts = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("userGifts")
        .find({
          _from: ObjectId(userId),
        })
        .count()
        .then((result) => {
          result > 0 ? (_item4 = true) : (_item4 = false);
          return resolve();
        });
    } catch (error) {
      log.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const getMessages = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("messages")
        .find({
          _from: ObjectId(userId),
        })
        .count()
        .then((result) => {
          result > 0 ? (_item5 = true) : (_item5 = false);
          return resolve();
        });
    } catch (error) {
      log.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const parseBonus = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      if (_item1 && _item2 && _item3 && _item4 && _item5 && !_alreadyWin) {
        let document = {
          balance: _profile.balance + 50,
          tipsBonus: true,
        };
        db.collection("users").updateOne(
          { _id: ObjectId(userId) },
          { $set: document },
          { upsert: false },
          (error, result) => {
            if (error) {
              log.error(error);
              return reject([request.__("unavailableService"), null]);
            } else {
              sendEmail(request);
              _alreadyWin = true;
              return resolve();
            }
          }
        );
      } else {
        return resolve();
      }
    } catch (error) {
      log.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const sendEmail = (request) => {
  try {
    postMarkClient.sendEmail({
      From: config.app.email,
      To: _profile.email,
      Subject: request.__("email.tipsBonus.subject", {
        name: _profile.username,
      }),
      HtmlBody: request.__("email.tipsBonus.html", {
        name: _profile.username,
      }),
      TextBody: request.__("email.tipsBonus.text", {
        name: _profile.username,
      }),
      MessageStream: "outbound",
    });
    return;
  } catch (error) {
    log.error(error);
  }
};
