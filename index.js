  const express = require('express')
  const app = express()
  const jwt = require('jsonwebtoken')
  require('dotenv').config
  const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
  const cors = require('cors')
  const port = process.env.PORT || 5000;
const stripe = require("stripe")('sk_test_51OEuuJKc6cWjkGN6wac43QFhEVjHVFMsyAYKltjlSA46ShnBVWz9Z3bsrxuZ9B6KWblR3cxO0aeeWRhO4ZES0X2E00sG3FUQ29');

app.use(express.static("public"));
app.use(express.json());


// middale ware
app.use(cors())
app.use(express.json())


const uri = "mongodb+srv://bistroboss:oE8AnojheG4mcZ9c@cluster0.bkdyuro.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Get the database and collection on which to run the operation
    const userCollectoin = client.db("bistroDB").collection("users");
    const menuCollectoin = client.db("bistroDB").collection("menu");
    const reviweCollectoin = client.db("bistroDB").collection("reviwe");
    const cartsCollectoin = client.db("bistroDB").collection("carts");
    const paymentCollectoin = client.db("bistroDB").collection("payments");


    // jwt api 
    app.post('/jwt', async (req, res) => {
      const user = req.body
      const token = jwt.sign(user, "d547bc644dfb8fa06eb6a24690665052c47aaaf0986f667542dc78208cedfe1334cabd2200107ad7923846a499535a4bdfcd6b1d1cb4dace3e17a22147f6b899", { expiresIn: "365h" })
      res.send({ token })
    })

    //  middale wares 
    const verifyToken = (req, res, next) => {
      // console.log('inside veryfied token ', req.headers.authorizatoin);
      // next()
      if (!req.headers.authorizatoin) {
        return res.status(401).send({ massage: "forbidden access" })
      }
      const token = req.headers.authorizatoin.split(' ')[1]
      jwt.verify(token, "d547bc644dfb8fa06eb6a24690665052c47aaaf0986f667542dc78208cedfe1334cabd2200107ad7923846a499535a4bdfcd6b1d1cb4dace3e17a22147f6b899", (err, decoded) => {
        // console.log("verify", decoded);
        if (err) {
          return res.status(401).send({ massage: "forbiden accsess" })
        }
        req.decoded = decoded
        next()
      })
    }

    // use veryfy admin after verifyToken
    const verifyAdmin = async (req, res, next) => {
      console.log("request decoded", req.decoded);
      const email = req.decoded.email
      const query = { email: email }
      const user = await userCollectoin.findOne(query)
      const isAdmin = user?.role === 'admin'
      if (!isAdmin) {
        return res.status(403).send({ massage: 'forbiden accsess ' })
      }
      next()
    }

    /* admin role check admin or normal user  */
    app.get('/users/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'unauthorized access' })
      }
      const query = { email: email };
      const user = await userCollectoin.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin });
    })

    // users api
    // user  data get for admin show all user
    app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
     const result = await userCollectoin.find().toArray()
      res.send(result)
    })
    // user data post in mongoDB data base
    app.post('/users', async (req, res) => {
      const user = req.body
      // insert email if user donent exists :
      // you can do this many ways (1.email unique , 2: upsert 3.simple checking)
      const query = { email: user.email }
      const exsitingUser = await userCollectoin.findOne(query)
      if (exsitingUser) {
        return res.send({ massage: 'user already exists', insertedId: null })
      }
      const result = await userCollectoin.insertOne(user)
      res.send(result)
    })
    // check admin 
    app.patch('/users/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await userCollectoin.updateOne(filter, updatedDoc)
      res.send(result)
    })

    app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await userCollectoin.deleteOne(query)
      res.send(result)
    })

    // menu data post get delete and update

    app.post('/menu', verifyToken, verifyAdmin, async (req, res) => {
      const { _id, ...item } = req.body
      const result = await menuCollectoin.insertOne(item)
      res.send(result)
    })

    app.get('/menu', async (req, res) => {
      const result = await menuCollectoin.find().toArray()
      res.send(result)
    })
    // update work
    /* get data for spesific id data */
    app.get('/menu/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await menuCollectoin.findOne(query)
      // console.log('fecth data ', result);
      res.send(result)
    })
    app.patch('/menu/:id', async (req, res) => {
      const item = req.body
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          name: item.name,
          category: item.category,
          recipe: item.recipe,
          price: item.price,
          image: item.image,
        }
      }
      const result = await menuCollectoin.updateOne(filter, updatedDoc)
      res.send(result)
    })


    app.delete('/menu/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await menuCollectoin.deleteOne(query)
      res.send(result)
    })


    app.get('/reviws', async (req, res) => {
      const result = await reviweCollectoin.find().toArray()
      res.send(result)
    })



    // carts collectoin data get 
    app.get('/carts', async (req, res) => {
      const email = req.query.email
      const query = { email: email }
      const result = await cartsCollectoin.find(query).toArray()
      res.send(result)
    })
    // carts collectoin 
    app.post('/carts', async (req, res) => {
      const cartItem = req.body
      const result = await cartsCollectoin.insertOne(cartItem)
      res.send(result)
    })
    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await cartsCollectoin.deleteOne(query)
      res.send(result)
    })

    // payment method post 
    app.post('/create-payment-intent', async (req, res) => {
      const { price } = req.body
      const amount = parseInt(price * 100)
      console.log(amount, 'amount inside ');
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ['card']
      })
      res.send({
        clientSecret: paymentIntent.client_secret,

      })
    })
    // payment history data get in client side  
    app.get('/payments/:email', verifyToken, async (req, res) => {
      const query = { email: req.params.email }
      if (req.params.email !== req.decoded.email) {
        return res.status(403).send({ massage: 'forbidden accsess' })
      }
      const result = await paymentCollectoin.find(query).toArray()
      res.send(result)
    })

    app.post('/payments', async (req, res) => {
      const payment = req.body
      const paymentResult = await paymentCollectoin.insertOne(payment)
      console.log('payment info', payment);
      const query = {
        _id: {
          $in: payment.CartIds.map(id => new ObjectId(id))
        }
      }
      const deleteResult = await cartsCollectoin.deleteMany(query)
      res.send({ paymentResult, deleteResult })
    })










    /* state analyticks */
    app.get('/admin-state', verifyToken, verifyAdmin, async (req, res) => {
      const users = await userCollectoin.estimatedDocumentCount()
      const manue = await menuCollectoin.estimatedDocumentCount()
      const payment = await paymentCollectoin.estimatedDocumentCount()

      // this is not best way
      // const paymensts = await paymentCollectoin.find().toArray()
      // const revenue = paymensts.reduce((totalPrice, payment) => totalPrice + payment.price, 0)


      /* this is best way */
      const result = await paymentCollectoin.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: '$price'
            }
          }
        }
      ]).toArray()
      const revenue = result.length > 0 ? result[0].totalRevenue : 0

      res.send({
        users,
        manue,
        payment,
        revenue
      })
    })





    /* order  stats using aggregate pipeline  */
    app.get('/order-stats', async (req, res) => {
      const result = await paymentCollectoin.aggregate([

        {
          $addFields: {
            manuIds: {
              $map: {
                input: "$manuIds",
                as: "itemId",
                in: { $toObjectId: "$$itemId" },
              },
            },
          },
        },
        {
          $lookup: {
            from: 'menu',
            localField: 'manuIds',
            foreignField: "_id",
            as: "manuIteam"
          }
        },
        {
          $unwind: "$manuIds"
        },
        {
          $unwind: "$manuIteam"
        },
        {
          $group: {
            _id: '$manuIteam.category',
            quantity: {
              $sum: 1
            },
            revenue: { $sum: "$manuIteam.price" }
          }
        }
      ]).toArray()
      res.send(result)
    })






    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('boss is sitting')
})

app.listen(port, () => {
  console.log(`bistro boss is sitting on port ${port}`);
})