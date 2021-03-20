const AWS = require("aws-sdk");

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
          getPicturesToRemove(request, decode.id)
            .then((result) => removeFromCDN(result))
            .then(() => removeFromDatabase(decode.id))
            .then(() => {
              response.status(200).send({
                success: true,
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

const getPicturesToRemove = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("pictures")
        .find({
          _user: ObjectId(userId),
          selected: true,
        })
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

const removeFromCDN = (result) => {
  return new Promise(async (resolve, reject) => {
    try {
      const spacesEndpoint = new AWS.Endpoint("fra1.digitaloceanspaces.com");
      const s3 = new AWS.S3({
        endpoint: spacesEndpoint,
        accessKeyId: config.spaces.key,
        secretAccessKey: config.spaces.secret,
      });
      await result.map((el) => {
        let params = {
          Bucket: "agarrei",
          Key: `pictures/${el._user}/${el.filename}`,
        };
        let paramsSmall = {
          Bucket: "agarrei",
          Key: `pictures/${el._user}/${el.filename}-small`,
        };
        s3.deleteObject(params, function (error, data) {
          if (error) {
            console.error(error);
            return reject([request.__("unavailableService"), null]);
          } else {
          }
        });
        s3.deleteObject(paramsSmall, function (error, data) {
          if (error) {
            console.error(error);
            return reject([request.__("unavailableService"), null]);
          } else {
          }
        });
      });
      return resolve();
    } catch (error) {
      console.log(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const removeFromDatabase = (userId) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("pictures")
        .deleteMany({
          _user: ObjectId(userId),
          selected: true,
        })
        .then((result) => {
          if (result) {
            return resolve(result);
          } else {
            console.error(error);
            return reject([request.__("unavailableService"), null]);
          }
        });
    } catch (error) {
      console.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};
