const express = require('express')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')
const port = process.env.PORT || 5000;


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

    // users api
    // user  data get for admin show all user
    app.get('/users', async (req, res) => {
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

    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set:{
          role:'admin'
         }
      }
      const result = await userCollectoin.updateOne(filter, updatedDoc)
      res.send(result)
    })

  app.delete('/users/:id', async (req, res) => {
    const id = req.params.id
    const query = { _id: new ObjectId(id) }
    const result = await userCollectoin.deleteOne(query)
    res.send(result)
  })


  app.get('/menu', async (req, res) => {
    const result = await menuCollectoin.find().toArray()
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