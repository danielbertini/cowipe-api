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
          db.collection("userGifts")
            .aggregate([
              {
                $match: {
                  _from: ObjectId(decode.id),
                },
              },
              {
                $lookup: {
                  from: "users",
                  localField: "_to",
                  foreignField: "_id",
                  as: "user",
                },
              },
              {
                $lookup: {
                  from: "gifts",
                  localField: "_gift",
                  foreignField: "_id",
                  as: "gift",
                },
              },
              {
                $project: {
                  _id: 1,
                  created: 1,
                  "user._id": 1,
                  "user.username": 1,
                  "user.picture": 1,
                  "user.online": 1,
                  "gift._id": 1,
                  "gift.name": 1,
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
