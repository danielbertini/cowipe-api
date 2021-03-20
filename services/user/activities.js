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
          var match = {
            _userTo: ObjectId(decode.id),
          };
          if (request.body.activityType) {
            Object.assign(match, {
              _activityType: ObjectId(request.body.activityType),
            });
          }
          db.collection("activities")
            .aggregate([
              {
                $match: match,
              },
              {
                $lookup: {
                  from: "users",
                  localField: "_userFrom",
                  foreignField: "_id",
                  as: "user",
                },
              },
              {
                $lookup: {
                  from: "activityTypes",
                  localField: "_activityType",
                  foreignField: "_id",
                  as: "type",
                },
              },
              {
                $project: {
                  _id: 1,
                  created: 1,
                  "user._id": 1,
                  "user.birthday": 1,
                  "user.username": 1,
                  "user.picture": 1,
                  "user.online": 1,
                  "type._id": 1,
                  "type.name": 1,
                },
              },
            ])
            .sort({ created: -1 })
            .skip(request.body.skip ? parseInt(request.body.skip) : 0)
            .limit(request.body.limit ? parseInt(request.body.limit) : 30)
            .toArray()
            .then((result) => {
              response.status(200).send({
                success: true,
                result: result,
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
