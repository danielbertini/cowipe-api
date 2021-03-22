exports.do = (request, response) => {
  try {
    var event = request.body;
    var data;
    switch (event.type) {
      case "payment_intent.succeeded":
        persistIntent(event.data.object);
        break;
      case "payment_intent.created":
        persistIntent(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    response.json({ received: true });
  } catch (error) {
    console.error(error);
    response.json({ received: false });
  }
};

const persistIntent = (data) => {
  return new Promise((resolve, reject) => {
    try {
      console.log(data);
      return resolve();
      // let document = {
      //   username: sanitizer.string(params.username),
      //   _zodiac: ObjectId(zodiac),
      //   birthday: new Date(
      //     moment(params.birthday, "DD/MM/YYYY").format("YYYY-MM-DD")
      //   ),
      // };
      // db.collection("intents").updateOne(
      //   { _id: ObjectId(id) },
      //   { $set: document },
      //   { upsert: false },
      //   (error, result) => {
      //     if (error) {
      //       logger.fail(error);
      //       return reject([request.__("unavailableService"), null]);
      //     } else {
      //       return resolve();
      //     }
      //   }
      // );
    } catch (error) {
      console.error(error);
      reject([request.__("unavailableService"), null]);
    }
  });
};
