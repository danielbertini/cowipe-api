const { ObjectId } = require("mongodb");

var _profile = null;
var _room = null;
var _connection = null;
var _blocked = false;

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
          checkBlocked(request, decode.id)
            .then(() => getProfile(request, decode.id))
            .then(() => checkConnection(request, decode.id))
            .then(() => createActivity(request, decode.id))
            .then(() => incrementVisit(request))
            .then(() => {
              response.status(200).send({
                success: true,
                profile: _profile,
                room: _room,
                connection: _connection,
              });
            })
            .catch((result) => {
              response.status(200).send({
                success: false,
                blocked: _blocked,
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

const checkBlocked = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("blocked")
        .findOne({
          $or: [
            {
              _user: ObjectId(userId),
              _blocked: ObjectId(request.params.id),
            },
            {
              _user: ObjectId(request.params.id),
              _blocked: ObjectId(userId),
            },
          ],
        })
        .then((result) => {
          if (result && result._id) {
            _blocked = true;
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

const getProfile = (request) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("users")
        .aggregate([
          {
            $match: { _id: ObjectId(request.params.id) },
          },
          {
            $lookup: {
              from: "zodiacSigns",
              localField: "_zodiac",
              foreignField: "_id",
              as: "zodiac",
            },
          },
          {
            $lookup: {
              from: "genders",
              localField: "relationship._gender",
              foreignField: "_id",
              as: "relationshipGender",
            },
          },
          {
            $lookup: {
              from: "orientationTypes",
              localField: "relationship._orientation",
              foreignField: "_id",
              as: "relationshipOrientation",
            },
          },
          {
            $lookup: {
              from: "maritalStatus",
              localField: "relationship._maritalStatus",
              foreignField: "_id",
              as: "relationshipMaritalStatus",
            },
          },
          {
            $lookup: {
              from: "relationshipTypes",
              localField: "relationship._relationship",
              foreignField: "_id",
              as: "relationshipType",
            },
          },
          {
            $lookup: {
              from: "sugarTypes",
              localField: "relationship._sugar",
              foreignField: "_id",
              as: "relationshipSugarType",
            },
          },
          {
            $lookup: {
              from: "bodyTypes",
              localField: "appearance._bodyType",
              foreignField: "_id",
              as: "appearanceBodyTypes",
            },
          },
          {
            $lookup: {
              from: "hairColors",
              localField: "appearance._hairColor",
              foreignField: "_id",
              as: "appearanceHairColor",
            },
          },
          {
            $lookup: {
              from: "eyeColors",
              localField: "appearance._eyeColor",
              foreignField: "_id",
              as: "appearanceEyeColor",
            },
          },
          {
            $project: {
              _id: 1,
              username: 1,
              picture: 1,
              birthday: 1,
              online: 1,
              visits: 1,
              "zodiac.name": 1,
              "relationshipGender.name": 1,
              "relationshipOrientation.name": 1,
              "relationshipMaritalStatus.name": 1,
              "relationshipType._id": 1,
              "relationshipType.name": 1,
              "relationshipSugarType.name": 1,
              "appearance.height": 1,
              "appearance.weight": 1,
              "appearanceBodyTypes.name": 1,
              "appearanceHairColor.name": 1,
              "appearanceEyeColor.name": 1,
            },
          },
        ])
        .toArray()
        .then((result) => {
          if (result) {
            _profile = result[0];
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

const checkConnection = (request, id) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("connections")
        .findOne({
          _user: ObjectId(id),
          _targetUser: ObjectId(request.params.id),
        })
        .then((result) => {
          if (result && result._id) {
            if (result.connected) {
              _room = result._id;
              _connection = 4; // connected...
              return resolve();
            } else {
              _connection = 2; // waiting for approval...
              _room = null;
              return resolve();
            }
          } else {
            db.collection("connections")
              .findOne({
                _user: ObjectId(request.params.id),
                _targetUser: ObjectId(id),
              })
              .then((result) => {
                if (result && result._id) {
                  if (result.connected) {
                    _room = result._id;
                    _connection = 4; // connected...
                    return resolve();
                  } else {
                    _connection = 3; // ask to approve...
                    _room = null;
                    return resolve();
                  }
                } else {
                  _connection = 1; // nothing...
                  _room = null;
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

const createActivity = (request, id) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("activities")
        .findOne({
          _userFrom: ObjectId(id),
          _userTo: ObjectId(request.params.id),
          _activityType: ObjectId("6025b7401ee8df2c772d0da7"),
        })
        .then((result) => {
          if (result) {
            return resolve();
          } else {
            let document = {
              _userFrom: ObjectId(id),
              _userTo: ObjectId(request.params.id),
              _activityType: ObjectId("6025b7401ee8df2c772d0da7"),
              created: new Date(),
            };
            db.collection("activities").insertOne(document, (error) => {
              if (error) {
                console.error(error);
                return reject([request.__("unavailableService"), null]);
              } else {
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

const incrementVisit = (request) => {
  return new Promise((resolve, reject) => {
    try {
      let document = {
        visits: parseInt(_profile.visits + 1),
      };
      db.collection("users").updateOne(
        { _id: ObjectId(request.params.id) },
        { $set: document },
        { upsert: false },
        (error, result) => {
          if (error) {
            logger.fail(error);
            return reject([request.__("unavailableService"), null]);
          } else {
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
