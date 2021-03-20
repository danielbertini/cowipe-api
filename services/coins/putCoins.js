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
          let document = {
            _user: ObjectId(decode.id),
            _coin: ObjectId(request.body.coinId),
            created: new Date(),
          };
          db.collection("balanceIn").insertOne(document, (error) => {
            if (error) {
              console.log(error);
              response.status(200).send({
                success: false,
              });
            } else {
              response.status(200).send({
                success: true,
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
