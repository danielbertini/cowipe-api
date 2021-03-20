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
          db.collection("connections")
            .deleteOne({
              _id: ObjectId(request.body.id),
            })
            .then((result) => {
              if (result) {
                response.status(200).send({
                  success: true,
                });
              } else {
                response.status(200).send({
                  success: false,
                  message: result[0],
                  errors: result[1],
                });
              }
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
