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
          db.collection("pictures")
            .find({
              _user: ObjectId(decode.id),
            })
            .sort({ created: -1 })
            .skip(request.params.skip ? parseInt(request.params.skip) : 0)
            .limit(request.params.limit ? parseInt(request.params.limit) : 30)
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

exports.restrictedsCount = (request, response) => {
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
          db.collection("pictures")
            .find({
              _user: ObjectId(request.body.id),
              restricted: true,
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
