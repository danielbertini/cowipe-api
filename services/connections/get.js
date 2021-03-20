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
          getConnections(request, decode.id)
            .then((result) => {
              response.status(200).send({
                success: true,
                connections: result,
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

const getConnections = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("connections")
        .aggregate([
          {
            $match: {
              connected: true,
              $or: [
                {
                  _user: ObjectId(userId),
                },
                {
                  _targetUser: ObjectId(userId),
                },
              ],
            },
          },
          {
            $lookup: {
              from: "messages",
              let: {
                cId: "$_id",
              },
              pipeline: [
                {
                  $sort: {
                    created: -1,
                  },
                },
                {
                  $match: {
                    $expr: {
                      $eq: ["$$cId", "$_connection"],
                    },
                  },
                },
                {
                  $limit: 1,
                },
              ],
              as: "messages",
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
            $lookup: {
              from: "messages",
              let: {
                cId: "$_id",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$$cId", "$_connection"] },
                        { $eq: ["$_to", ObjectId(userId)] },
                        { $eq: ["$read", false] },
                      ],
                    },
                  },
                },
              ],
              as: "unreads",
            },
          },
          {
            $sort: {
              "messages.created": -1,
            },
          },
          {
            $project: {
              _id: 1,
              user: 1,
              targetUser: 1,
              messages: 1,
              counter: { $size: "$unreads" },
            },
          },
        ])
        .toArray()
        .then((result) => {
          if (result) {
            return resolve(result);
          } else {
            console.log(error);
            return reject([request.__("unavailableService"), null]);
          }
        });
    } catch (error) {
      console.log(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

exports.unreads = (request, response) => {
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
          db.collection("messages")
            .find({
              _to: ObjectId(decode.id),
              read: false,
            })
            .count()
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
