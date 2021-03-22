exports.do = (request, response) => {
  try {
    var event = request.body;
    switch (event.type) {
      case "payment_intent.succeeded":
        updateIntent(event.data.object);
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
  try {
    let document = {
      intentId: data.id,
      userId: ObjectId(data.metadata.userId),
      coinId: ObjectId(data.metadata.coinId),
      status: data.status,
    };
    db.collection("intents").insertOne(document, (error) => {
      if (error) {
        console.log(error);
        return;
      } else {
        return;
      }
    });
  } catch (error) {
    console.error(error);
    return;
  }
};

const updateIntent = (data) => {
  try {
    let document = {
      status: data.status,
    };
    db.collection("intents").updateOne(
      { intentId: id },
      { $set: document },
      { upsert: false },
      (error) => {
        if (error) {
          console.error(error);
          return;
        } else {
          return;
        }
      }
    );
  } catch (error) {
    console.error(error);
    return;
  }
};
