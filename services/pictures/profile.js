const formidable = require("formidable").IncomingForm;
const sharp = require("sharp");
const AWS = require("aws-sdk");
const fs = require("fs");

var _filename = "";

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
            .then(() => removeOldPicture(request, decode.id))
            .then(() => persistNewPicture(request, decode.id))
            .then(() => getUser(request, decode.id))
            .then((result) => {
              response.status(200).send({
                success: true,
                document: {
                  username: result.username,
                  picture: result.picture,
                },
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
      console.log("parseForm");
      const form = new formidable.IncomingForm();
      form.maxFileSize = 5 * 1024 * 1024; //5MB
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
              _filename = file.file.name;
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
                    Key: `pictures/profiles/${_filename}`,
                    Body: data,
                    ACL: "public-read",
                    ContentType: file.file.type,
                  };
                  s3.putObject(params, function (error, data) {
                    if (error) {
                      console.log(error);
                      return reject([request.__("unavailableService"), null]);
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
                    Key: `pictures/profiles/${_filename}-small`,
                    Body: data,
                    ACL: "public-read",
                    ContentType: file.file.type,
                  };
                  s3.putObject(params, function (error, data) {
                    if (error) {
                      console.log(error);
                      return reject([request.__("unavailableService"), null]);
                    }
                  });
                });
              return resolve();
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

const removeOldPicture = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      console.log("removeOldPictures");
      db.collection("users")
        .findOne({ _id: ObjectId(userId) }, { projection: { picture: 1 } })
        .then((result) => {
          if (result && result.picture) {
            const spacesEndpoint = new AWS.Endpoint(
              "fra1.digitaloceanspaces.com"
            );
            const s3 = new AWS.S3({
              endpoint: spacesEndpoint,
              accessKeyId: config.spaces.key,
              secretAccessKey: config.spaces.secret,
            });
            let params = {
              Bucket: "agarrei",
              Key: `pictures/profiles/${result.picture}`,
            };
            let paramsSmall = {
              Bucket: "agarrei",
              Key: `pictures/profiles/${result.picture}-small`,
            };
            s3.deleteObject(params, function (error, data) {
              if (error) {
                console.error(error);
                return reject([request.__("unavailableService"), null]);
              } else {
                s3.deleteObject(paramsSmall, function (error, data) {
                  if (error) {
                    console.error(error);
                    return reject([request.__("unavailableService"), null]);
                  } else {
                    return resolve();
                  }
                });
              }
            });
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

const persistNewPicture = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      console.log("persistNewPicture");
      let document = {
        picture: _filename,
      };
      db.collection("users").updateOne(
        { _id: ObjectId(userId) },
        { $set: document },
        { upsert: false },
        (error) => {
          if (error) {
            console.log(error);
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

const getUser = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      console.log("getUser");
      db.collection("users")
        .findOne(
          {
            _id: ObjectId(userId),
          },
          {
            projection: {
              _id: 1,
              username: 1,
              picture: 1,
            },
          }
        )
        .then((result) => {
          if (result) {
            resolve(result);
          } else {
            reject([request.__("unavailableService"), null]);
          }
        });
    } catch (error) {
      console.log(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};
