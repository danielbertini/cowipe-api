const { ObjectId } = require("bson");

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
          if (request.body.filter === 1 || request.body.filter === 2) {
            getUserProfile(request, decode.id)
              .then((preferences) =>
                searchUsers(request, preferences, decode.id)
              )
              .then((result) => {
                response.status(200).send({
                  success: true,
                  result: result,
                });
              })
              .catch((result) => {
                response.status(200).send({
                  success: false,
                });
              });
          } else if (request.body.filter === 3) {
            connections(request, response, decode.id);
          } else if (request.body.filter === 4) {
            waiting(request, response, decode.id);
          } else if (request.body.filter === 5) {
            blockeds(request, response, decode.id);
          } else {
            response.status(200).send({
              success: false,
            });
          }
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

const getUserProfile = (request, userId) => {
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

const searchUsers = (request, profile, userId) => {
  return new Promise((resolve, reject) => {
    try {
      var match = {};
      var matchAfter = {};
      Object.assign(match, {
        _id: { $ne: ObjectId(userId) },
        "preferences.visibility": true,
      });
      // Male && Heterosexual
      if (
        profile.relationship._gender == "5fa977d6201036a4efa3f250" &&
        profile.relationship._orientation == "5fa9f43c201036a4efa3f277"
      ) {
        Object.assign(match, {
          "relationship._gender": ObjectId("5fa977f7201036a4efa3f251"),
          "relationship._orientation": ObjectId("5fa9f43c201036a4efa3f277"),
        });
      }
      // Male && Homosexual
      if (
        profile.relationship._gender == "5fa977d6201036a4efa3f250" &&
        profile.relationship._orientation == "5fa9f46e201036a4efa3f279"
      ) {
        Object.assign(match, {
          "relationship._gender": ObjectId("5fa977d6201036a4efa3f250"),
          "relationship._orientation": ObjectId("5fa9f46e201036a4efa3f279"),
        });
      }
      // Male && Bisexual
      if (
        profile.relationship._gender == "5fa977d6201036a4efa3f250" &&
        profile.relationship._orientation == "5fa9f44d201036a4efa3f278"
      ) {
        Object.assign(match, {
          "relationship._gender": ObjectId("5fa977d6201036a4efa3f250"),
          "relationship._orientation": ObjectId("5fa9f44d201036a4efa3f278"),
        });
      }
      // Female && Heterosexual
      if (
        profile.relationship._gender == "5fa977f7201036a4efa3f251" &&
        profile.relationship._orientation == "5fa9f43c201036a4efa3f277"
      ) {
        Object.assign(match, {
          "relationship._gender": ObjectId("5fa977d6201036a4efa3f250"),
          "relationship._orientation": ObjectId("5fa9f43c201036a4efa3f277"),
        });
      }
      // Female && Homosexual
      if (
        profile.relationship._gender == "5fa977f7201036a4efa3f251" &&
        profile.relationship._orientation == "5fa9f46e201036a4efa3f279"
      ) {
        Object.assign(match, {
          "relationship._gender": ObjectId("5fa977f7201036a4efa3f251"),
          "relationship._orientation": ObjectId("5fa9f46e201036a4efa3f279"),
        });
      }
      // Female && Bisexual
      if (
        profile.relationship._gender == "5fa977f7201036a4efa3f251" &&
        profile.relationship._orientation == "5fa9f44d201036a4efa3f278"
      ) {
        Object.assign(match, {
          "relationship._gender": ObjectId("5fa977f7201036a4efa3f251"),
          "relationship._orientation": ObjectId("5fa9f44d201036a4efa3f278"),
        });
      }
      // TuneSearch
      if (profile.tuneSearch) {
        if (profile.tuneSearch.usersOnline) {
          Object.assign(matchAfter, {
            online: Boolean(profile.tuneSearch.usersOnline),
          });
        }
        if (profile.tuneSearch.usersWithPhoto) {
          Object.assign(matchAfter, {
            picture: { $exists: true, $ne: "" },
          });
        }
        if (profile.tuneSearch.maritalStatus) {
          Object.assign(match, {
            "relationship._maritalStatus": ObjectId(
              profile.tuneSearch.maritalStatus
            ),
          });
        }
        if (profile.tuneSearch.relationShip) {
          if (profile.tuneSearch.relationShip === "5fa9eb3a201036a4efa3f271") {
            Object.assign(match, {
              "relationship._relationship": ObjectId(
                profile.tuneSearch.relationShip
              ),
              "relationship._sugar": ObjectId(profile.tuneSearch.sugarType),
            });
          } else {
            Object.assign(match, {
              "relationship._relationship": ObjectId(
                profile.tuneSearch.relationShip
              ),
            });
          }
        }
        if (profile.tuneSearch.bodyType) {
          Object.assign(match, {
            "appearance._bodyType": ObjectId(profile.tuneSearch.bodyType),
          });
        }
        if (profile.tuneSearch.hairColor) {
          Object.assign(match, {
            "appearance._hairColor": ObjectId(profile.tuneSearch.hairColor),
          });
        }
        if (profile.tuneSearch.eyeColor) {
          Object.assign(match, {
            "appearance._eyeColor": ObjectId(profile.tuneSearch.eyeColor),
          });
        }
        if (profile.tuneSearch.height) {
          Object.assign(match, {
            "appearance.height": {
              $gte: profile.tuneSearch.height[0],
              $lte: profile.tuneSearch.height[1],
            },
          });
        }
        if (profile.tuneSearch.weight) {
          Object.assign(match, {
            "appearance.weight": {
              $gte: profile.tuneSearch.weight[0],
              $lte: profile.tuneSearch.weight[1],
            },
          });
        }
        if (profile.tuneSearch.age) {
          Object.assign(matchAfter, {
            age: {
              $gte: profile.tuneSearch.age[0],
              $lte: profile.tuneSearch.age[1],
            },
          });
        }
        if (profile.tuneSearch.distance) {
          Object.assign(matchAfter, {
            distance: {
              $lte: profile.tuneSearch.distance * 1000,
            },
          });
        }
      }
      // Sort
      var sort = {};
      if (profile.location.coordinates[0] && profile.location.coordinates[1]) {
        Object.assign(sort, {
          distance: 1,
        });
      }
      if (request.body.filter === 1) {
        Object.assign(sort, {
          visits: -1,
        });
      }
      if (request.body.filter === 2) {
        Object.assign(sort, {
          created: -1,
        });
      }
      var query = [
        {
          $match: match,
        },
        {
          $sort: sort,
        },
        {
          $skip: request.body.skip ? parseInt(request.body.skip) : 0,
        },
        {
          $limit: request.body.limit ? parseInt(request.body.limit) : 30,
        },
        {
          $project: {
            _id: 1,
            username: 1,
            picture: 1,
            birthday: 1,
            online: 1,
            distance: 1,
            age: {
              $round: {
                $divide: [
                  {
                    $subtract: [
                      new Date(),
                      { $ifNull: ["$birthday", new Date()] },
                    ],
                  },
                  1000 * 86400 * 365,
                ],
              },
            },
          },
        },
        {
          $match: matchAfter,
        },
      ];
      if (profile.location.coordinates[0] && profile.location.coordinates[1]) {
        query.unshift({
          $geoNear: {
            includeLocs: "location",
            distanceField: "distance",
            near: {
              type: "Point",
              coordinates: [
                profile.location.coordinates[0],
                profile.location.coordinates[1],
              ],
            },
            maxDistance: 99999999999,
            spherical: true,
          },
        });
      }
      db.collection("users")
        .aggregate(query)
        .toArray()
        .then((result) => {
          return resolve(result);
        });
    } catch (error) {
      return reject();
    }
  });
};

const connections = (request, response, userId) => {
  try {
    db.collection("connections")
      .aggregate([
        {
          $match: {
            $or: [
              {
                _user: ObjectId(userId),
              },
              {
                _targetUser: ObjectId(userId),
              },
            ],
            connected: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_user",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_targetUser",
            foreignField: "_id",
            as: "targetUser",
          },
        },
        {
          $skip: request.body.skip ? parseInt(request.body.skip) : 0,
        },
        {
          $limit: request.body.limit ? parseInt(request.body.limit) : 30,
        },
        {
          $project: {
            _id: 1,
            "user._id": 1,
            "user.username": 1,
            "user.picture": 1,
            "user.birthday": 1,
            "user.online": 1,
            "targetUser._id": 1,
            "targetUser.username": 1,
            "targetUser.picture": 1,
            "targetUser.birthday": 1,
            "targetUser.online": 1,
          },
        },
      ])
      .toArray()
      .then((result) => {
        response.status(200).send({
          success: true,
          result: result,
        });
      });
  } catch (error) {
    response.status(200).send({
      success: false,
    });
  }
};

const waiting = (request, response, userId) => {
  try {
    db.collection("connections")
      .aggregate([
        {
          $match: {
            $or: [
              {
                _user: ObjectId(userId),
              },
              {
                _targetUser: ObjectId(userId),
              },
            ],
            connected: false,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_user",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_targetUser",
            foreignField: "_id",
            as: "targetUser",
          },
        },
        {
          $skip: request.body.skip ? parseInt(request.body.skip) : 0,
        },
        {
          $limit: request.body.limit ? parseInt(request.body.limit) : 30,
        },
        {
          $project: {
            _id: 1,
            "user._id": 1,
            "user.username": 1,
            "user.picture": 1,
            "user.birthday": 1,
            "user.online": 1,
            "targetUser._id": 1,
            "targetUser.username": 1,
            "targetUser.picture": 1,
            "targetUser.birthday": 1,
            "targetUser.online": 1,
          },
        },
      ])
      .toArray()
      .then((result) => {
        response.status(200).send({
          success: true,
          result: result,
        });
      });
  } catch (error) {
    response.status(200).send({
      success: false,
    });
  }
};

const blockeds = (request, response, userId) => {
  try {
    db.collection("blocked")
      .aggregate([
        {
          $match: {
            _user: ObjectId(userId),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_blocked",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $skip: request.body.skip ? parseInt(request.body.skip) : 0,
        },
        {
          $limit: request.body.limit ? parseInt(request.body.limit) : 30,
        },
        {
          $project: {
            _id: 1,
            "user._id": 1,
            "user.username": 1,
            "user.picture": 1,
            "user.birthday": 1,
            "user.online": 1,
          },
        },
      ])
      .toArray()
      .then((result) => {
        response.status(200).send({
          success: true,
          result: result,
        });
      });
  } catch (error) {
    response.status(200).send({
      success: false,
    });
  }
};
