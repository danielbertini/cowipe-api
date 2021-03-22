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
          db.collection("users")
            .findOne({
              _id: ObjectId(decode.id),
            })
            .then((result) => {
              if (result) {
                response.status(200).send({
                  success: true,
                  balance: result.balance,
                });
              } else {
                response.status(200).send({
                  success: false,
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
