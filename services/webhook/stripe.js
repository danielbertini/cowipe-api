exports.do = (request, response) => {
  try {
    var event = request.body;
    switch (event.type) {
      case "payment_intent.created":
        persistIntent(event.data.object);
        break;
      case "payment_intent.succeeded":
        updateIntent(event.data.object);
        break;
      case "charge.succeeded":
        charge(event.data.object);
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
      _userId: ObjectId(data.metadata.userId),
      _coinId: ObjectId(data.metadata.coinId),
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
      { intentId: data.id },
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

const charge = (data) => {
  try {
    db.collection("coins")
      .findOne({
        _id: ObjectId(data.metadata.coinId),
      })
      .then((coin) => {
        if (coin && coin._id) {
          if (parseFloat(coin.price) === parseFloat(data.amount)) {
            db.collection("users")
              .findOne({
                _id: ObjectId(data.metadata.userId),
              })
              .then((user) => {
                if (user && user._id) {
                  let document = {
                    balance: parseFloat(user.balance + coin.quantity),
                  };
                  db.collection("users").updateOne(
                    { _id: ObjectId(user._id) },
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
                } else {
                  console.error(error);
                  return;
                }
              });
          } else {
            console.error(error);
            return;
          }
        } else {
          console.error(error);
          return;
        }
      });
  } catch (error) {
    console.error(error);
    return;
  }
};
