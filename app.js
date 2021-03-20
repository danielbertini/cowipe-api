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

// Setup utils

logger = require("./utils/logger");
validate = require("./utils/validate");
sanitizer = require("./utils/sanitizer");

// // Setup Bugsnag

// bugsnag = require("bugsnag");
// bugsnag.register(config.keys.bugsnag);

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
    app.use(cors());
    app.use(function (req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
      );
      next();
    });

    i18n.configure({
      locales: ["en-US", "es", "pt-BR"],
      queryParameter: "lang",
      directory: "./locales",
    });
    app.use(i18n.init);

    // Setup CORS whitelist

    const whitelist = ["http://localhost:3000", "https://agarrei.com"];
    corsOptions = {
      origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(null, true);
          // callback(null, false);
        }
      },
    };

    // Setup routes...

    const index = require("./routes/index");
    app.use("/", index);

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

    // Setup catch errors

    app.use((error, request, response, next) => {
      logger.fail(new Error(error.stack));
      response.status(500).send({
        success: false,
        description:
          "Serviço indisponível, já fomos notificados, tente novamente mais tarde. Código: " +
          error.status +
          ".",
      });
    });

    app.use((error, request, response, next) => {
      logger.fail(new Error(error.stack));
      response.status(error.status).send({
        success: false,
        description:
          "Serviço indisponível, já fomos notificados, tente novamente mais tarde. Código: " +
          error.status +
          ".",
      });
    });

    app.use(function (request, response, next) {
      response.status(404).send({
        success: false,
        description:
          "Serviço indisponível, já fomos notificados, tente novamente mais tarde. Código: 404.",
      });
    });

    // start app

    const server = http.createServer(app);
    io = socketIo(server, {
      cors: {
        origin: "*",
      },
    });

    io.use((socket, next) => {
      if (socket.handshake.query.token) {
        jwt.verify(
          socket.handshake.query.token,
          config.jwt.secret,
          function (error, decoded) {
            if (error) {
              console.error(`[ws] - ${new Date()} - ${error}`);
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
      logger.log("APP stopped");
      dbClient.close();
      process.exit();
    });
  })
  .catch((error) => {
    console.error(`[api] ${new Date()} - error ${error}`);
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
      if (error) console.error(`[ws] ${new Date()} - error ${error}`);
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
        console.error(error);
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
    console.error(error);
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
          console.error(error);
        }
      }
    );
  } catch (error) {
    console.error(error);
  }
}
