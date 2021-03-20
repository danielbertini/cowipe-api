const formidable = require("formidable").IncomingForm;
const sharp = require("sharp");
const AWS = require("aws-sdk");
const fs = require("fs");

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
          parseForm(request, decode.id)
            .then((result) => persist(request, result[0], result[1], decode.id))
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

const parseForm = (request, userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const form = new formidable.IncomingForm();
      form.maxFileSize = 1 * 1024 * 1024; //1MB
      form.multipart = false;
      await form.parse(request, (error, field, file) => {
        if (error) {
          return reject([request.__("unavailableService"), null]);
        } else {
          fs.readFile(file.file.path, async (error, data) => {
            if (error) {
              console.error(error);
              return reject([request.__("unavailableService"), null]);
            } else {
              const spacesEndpoint = new AWS.Endpoint(
                "fra1.digitaloceanspaces.com"
              );
              const s3 = new AWS.S3({
                endpoint: spacesEndpoint,
                accessKeyId: config.spaces.key,
                secretAccessKey: config.spaces.secret,
              });
              await sharp(data)
                .resize({ width: 1000, height: 1000 })
                .jpeg({ quality: 75 })
                .toBuffer()
                .then((data) => {
                  let params = {
                    Bucket: "agarrei",
                    Key: `pictures/${userId}/${file.file.name}`,
                    Body: data,
                    ACL: "public-read",
                    ContentType: file.file.type,
                  };
                  s3.putObject(params, (error, data) => {
                    if (error) {
                      console.log(error);
                      return reject([request.__("unavailableService"), null]);
                    } else {
                    }
                  });
                });
              await sharp(data)
                .resize({ width: 250, height: 250 })
                .jpeg({ quality: 75 })
                .toBuffer()
                .then((data) => {
                  let params = {
                    Bucket: "agarrei",
                    Key: `pictures/${userId}/${file.file.name}-small`,
                    Body: data,
                    ACL: "public-read",
                    ContentType: file.file.type,
                  };
                  s3.putObject(params, (error, data) => {
                    if (error) {
                      console.log(error);
                      return reject([request.__("unavailableService"), null]);
                    } else {
                    }
                  });
                });
              return resolve([field.restricted, file.file.name]);
            }
          });
        }
      });
    } catch (error) {
      console.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const persist = (request, restricted, filename, userId) => {
  return new Promise((resolve, reject) => {
    try {
      let document = {
        _user: ObjectId(userId),
        restricted: restricted === "true" ? true : false,
        filename: filename,
        created: new Date(),
      };
      db.collection("pictures").insertOne(document, (error) => {
        if (error) {
          console.log(error);
          return reject([request.__("unavailableService"), null]);
        } else {
          return resolve();
        }
      });
    } catch (error) {
      console.log(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};
