(express = require("express")),
  (axios = require("axios")),
  (bodyParser = require("body-parser")),
  (cors = require("cors")),
  (jwt = require("jsonwebtoken")),
  (i18n = require("i18n")),
  (url = require("url")),
  (socketIo = require("socket.io")),
  (http = require("http")),
  (https = require("https")),
  (app = express()),
  (bugsnag = require("bugsnag")),
  (firebaseAdmin = require('firebase-admin')),
  (MongoClient = require("mongodb").MongoClient);

// Setup config

switch (process.env.NODE_ENV) {
  case "production":
    config = require("./config/production.json");
    break;
  default:
    config = require("./config/development.json");
    break;
}

// Setup Firebase

const serviceAccount = require('./services/firebase/cowipe-e932b-firebase-adminsdk-3ejxn-b9e8d3f7ec.json');

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
});

messaging = firebaseAdmin.messaging();

// Setup utils

log = require("./utils/log");
validate = require("./utils/validate");
sanitizer = require("./utils/sanitizer");

// Setup Bugsnag

bugsnag.register(config.bugsnag.api_key);

// Setup and connect to database before start APP

ObjectId = require("mongodb").ObjectId;
Decimal128 = require("mongodb").Decimal128;
var dbClient;

MongoClient.connect(config.database.mongo.url, {
  useNewUrlParser: true,
  poolSize: 10,
  useUnifiedTopology: true,
})
  .then((client) => {
    db = client.db(config.database.mongo.database);
    dbClient = client;

    // Config APP

    app.use(bodyParser.json({ limit: "20mb", extended: true }));
    app.use(bodyParser.urlencoded({ limit: "20mb", extended: true }));

    // Setup CORS whitelist

    const whitelist = config.cors.whitelist;

    corsOptions = {
      credentials: true,
      optionsSuccessStatus: 200,
      origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
          return callback(null, true);
        } else {
          return callback(null, true);
          // var msg =
          //   "The CORS policy for this site does not allow access from the specified Origin.";
          // return callback(new Error(msg), false);
        }
      },
    };

    app.use(cors(corsOptions));

    // Setup i18n

    i18n.configure({
      locales: ["en-US", "es", "pt-BR"],
      queryParameter: "lang",
      directory: "./locales",
    });
    app.use(i18n.init);

    // Setup routes

    const index = require("./routes/index");
    app.use("/", index);

    const aboutRoutes = require("./routes/about");
    app.use("/about", aboutRoutes);

    const authRoutes = require("./routes/auth");
    app.use("/auth", authRoutes);

    const coinsRoutes = require("./routes/coins");
    app.use("/coins", coinsRoutes);

    const commonsRoutes = require("./routes/commons");
    app.use("/commons", commonsRoutes);

    const picturesRoutes = require("./routes/pictures");
    app.use("/pictures", picturesRoutes);

    const userRoutes = require("./routes/user");
    app.use("/user", userRoutes);

    const connectionsRoutes = require("./routes/connections");
    app.use("/connections", connectionsRoutes);

    const paymentsRoutes = require("./routes/payments");
    app.use("/payments", paymentsRoutes);

    const webhookRoutes = require("./routes/webhook");
    app.use("/webhook", webhookRoutes);

    const giftsRoutes = require("./routes/gifts");
    app.use("/gifts", giftsRoutes);

    // Setup catch errors

    app.use(function (request, response, next) {
      response.status(404).send({
        success: false,
      });
    });

    // start app

    const server = http.createServer(app);
    io = socketIo(server, {
      cors: {
        origin: function (origin, callback) {
          if (whitelist.indexOf(origin) !== -1) {
            return callback(null, true);
          } else {
            var msg =
              "The CORS policy for this site does not allow access from the specified Origin.";
            return callback(new Error(msg), false);
          }
        },
      },
    });

    io.use((socket, next) => {
      if (socket.handshake.query.token) {
        jwt.verify(
          socket.handshake.query.token,
          config.jwt.secret,
          function (error, decoded) {
            if (error) {
              log.error(error);
              next(new Error(error));
            } else {
              socket.decoded = decoded;
              updateUserStatus(socket.decoded.id, socket.id, true);
              next();
            }
          }
        );
      } else {
        console.log(`[ws] ${new Date()} - authentication failed`);
        next();
      }
    }).on("connection", function (socket) {
      socket.on("rooms_join", (room) => {
        socket.join(room);
      });
      socket.on("rooms_leave", (room) => {
        socket.leave(room);
      });
      socket.on("rooms_message", (data) => {
        socket.join(data.roomId);
        persistMessage(data.roomId, data._from, data._to, data.message);
      });
      socket.on("rooms_message_readed", (data) => {
        markMessageAsReaded(data);
      });
      socket.on("disconnect", () => {
        updateUserStatus(socket.decoded.id, socket.id, false);
      });
    });

    server.listen(config.api.port, () => {
      console.log(`[api] ${new Date()} - listen on port ${config.api.port}`);
    });

    // on app stop

    process.on("SIGINT", () => {
      dbClient.close();
      process.exit();
    });
  })
  .catch((error) => {
    log.error(error);
  });

function updateUserStatus(userId, socketId, status) {
  const query = {
    _id: ObjectId(userId),
  };
  const update = {
    $set: {
      socketId: socketId,
      online: status,
    },
  };

  db.collection("users")
    .updateOne(query, update)
    .then((result, error) => {
      if (error) {
        log.error(error);
      };
    });
}

function persistMessage(roomId, _from, _to, message) {
  try {
    let document = {
      _connection: ObjectId(roomId),
      _from: ObjectId(_from),
      _to: ObjectId(_to),
      read: false,
      message: sanitizer.string(message),
      created: new Date(),
    };
    db.collection("messages").insertOne(document, (error, result) => {
      if (error) {
        log.error(error);
      } else {
        if (result.ops[0]) {
          io.to(roomId).emit("rooms_message", {
            _id: result.ops[0]._id,
            _from: result.ops[0]._from,
            _to: result.ops[0]._to,
            room: result.ops[0]._connection,
            message: result.ops[0].message,
            created: result.ops[0].created,
          });
          db.collection("users")
            .findOne({
              _id: result.ops[0]._to,
            })
            .then((user) => {
              if (user.firebaseToken) {
                sendNotification(user, result.ops[0].message)
              }
              if (user && user._id && user.online && user.socketId) {
                io.to(user.socketId).emit("message", {
                  _id: result.ops[0]._id,
                  _from: result.ops[0]._from,
                  _to: result.ops[0]._to,
                  room: result.ops[0]._connection,
                  message: result.ops[0].message,
                  created: result.ops[0].created,
                });
              }
            });
        }
      }
    });
  } catch (error) {
    log.error(error);
  }
}

function sendNotification (user, message) {
  try {
    var tokens = [];
    var data = { title: 'Cowipe', body: message };
    if (user.firebaseToken) {
      tokens.push(user.firebaseToken);
      messaging
      .sendMulticast({ tokens, data })
      .then(response => {
        const successes = response.responses.filter(r => r.success === true).length;
        const failures = response.responses.filter(r => r.success === false).length;
      })
      .catch(error => {
        log.error(error);
      });  
    }
  } catch (error) {
    log.error(error);
  }  
}

function markMessageAsReaded(id) {
  try {
    let document = {
      read: true,
    };
    db.collection("messages").updateOne(
      { _id: ObjectId(id) },
      { $set: document },
      { upsert: false },
      (error, result) => {
        if (error) {
          log.error(error);
        }
      }
    );
  } catch (error) {
    log.error(error);
  }
}
