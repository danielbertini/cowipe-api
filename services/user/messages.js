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
          markMessagesAsReaded(request, decode.id)
            .then(() => getMessages(request, decode.id))
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

const markMessagesAsReaded = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      let document = {
        read: true,
      };
      db.collection("messages").updateMany(
        { _connection: ObjectId(request.body.room), _to: ObjectId(userId) },
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
      console.log(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const getMessages = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("messages")
        .find(
          {
            _connection: ObjectId(request.body.room),
          },
          {
            projection: {
              _id: 0,
              _from: 1,
              _to: 1,
              read: 1,
              message: 1,
              created: 1,
            },
          }
        )
        .sort({ created: -1 })
        .skip(request.params.skip ? parseInt(request.params.skip) : 0)
        .limit(request.params.limit ? parseInt(request.params.limit) : 30)
        .toArray()
        .then((result) => {
          return resolve(result);
        });
    } catch (error) {
      console.log(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};
