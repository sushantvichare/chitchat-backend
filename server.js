//import
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";


//app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
  appId: "1185075",
  key: "86a92e3324d0040be2d5",
  secret: "0fb2d34721c5773b028b",
  cluster: "ap2",
  useTLS: true,
});

//middleware
app.use(express.json());
app.use(cors());


//omitted because of cors lib
//app.use((req, res, next)=>{
//    res.setHeader("Access-Control-Allow-Origin","*");
//   res.setHeader("Access-Control-Allow-Headers","*");
//    next();
// });

//DB config
const connection_url =
  "mongodb+srv://admin:Pu833dU7RcdCKvGW@cluster0.czyfv.mongodb.net/chitchatdb?retryWrites=true&w=majority";

mongoose.connect(connection_url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.once("open", () => {
  console.log("DB connected");

  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();

  changeStream.on('change', (change) => {
    console.log('change: ',change);

    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received,
      });
    } else {
      console.log("Error triggering Pusher");
    }
  });
});

//api route
app.get('/', (req, res) => res.status(200).send("hello world"));

app.get('/messages/sync', (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post('/messages/new', (req, res) => {
  const dbMessage = req.body;

  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

//listen
app.listen(port, () => console.log("Listening on localhost:$(port)"));
