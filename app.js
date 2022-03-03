let express = require("express");
let app = express();
const mongo = require("mongodb");
let mongoClient = mongo.MongoClient;
const dotenv = require("dotenv");
dotenv.config();
let port = process.env.PORT || 1234;

const bodyParser = require('body-parser');
const cors = require('cors');

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(cors());

// let mongoUrl = "mongodb://localhost:27017"; 
let mongoUrl = "mongodb+srv://test:test123@cluster0.cxejl.mongodb.net/zomato?retryWrites=true&w=majority";
let db;
app.get("/",(req,res)=>{
    res.send("<h1>Hello From Home Page</h1>");
})


//List of City
app.get("/location",(req,res)=>{
    db.collection("location").find().toArray((err,result)=>{
        if(err) throw err;
        res.send(result);
    })
})


// get a data for restro and restro wrt to city 
app.get("/restro",(req,res)=>{
    let stateId = Number(req.query.state_id);
    let mealID = Number(req.query.meal_id);
    let query = {};
    if(stateId && mealID)
    {
        query = {state_id : stateId, 'mealTypes.mealtype_id': mealID};
    }    
    else if(stateId)
    {
        query = {state_id : stateId}
    }
    else if(mealID)
    {
        query = {'mealTypes.mealtype_id': mealID}
    }
    db.collection("zomato").find(query).toArray((err,result)=>{
        if(err) throw err;
        res.send(result);
    })
})

//get a data for mealtype

app.get("/mealtype",(req,res)=>{
    db.collection("mealtype").find().toArray((err,result)=>{
        if(err) throw err;
        res.send(result);
    })
})


// restro details
app.get("/detail/:id",(req,res)=>{
    let restID = Number(req.params.id);
    db.collection("zomato").find({restaurant_id : restID}).toArray((err,result)=>{
        if(err) throw err;
        res.send(result);
    })
})

//menu wrt restro
app.get("/menu/:id",(req,res)=>{
    let restID = Number(req.params.id);
    db.collection("menu").find({restaurant_id : restID}).toArray((err,result)=>{
        if(err) throw err;
        res.send(result);
    })
})

//filter wrt cuisine and quicksearch
app.get("/filter/:mealId",(req,res)=>{
    let mealID = Number(req.params.mealId);
    let cuisineId = Number(req.query.cuisine);
    let lcost = Number(req.query.lcost);
    let hcost = Number(req.query.hcost);
    // let cost = Number(req.query.sort);
    let skip = 0;
    let limit = 5;
   

  
    let query={};
    let sort = {cost:1};

    if(cuisineId && lcost&hcost && mealID) 
    {
        query = {"cuisines.cuisine_id":cuisineId,
                 "mealTypes.mealtype_id": mealID, 
                 $and : [{cost : {$gt:lcost, $lt:hcost}}]
                };
    }
    else if (lcost&hcost)
    {
        query = {$and : [{cost : {$gt:lcost, $lt:hcost}}]};
    }
    else if(cuisineId)
    {
        query={"cuisines.cuisine_id":cuisineId};
    }
    if(req.query.sort)
    {
        sort={cost : req.query.sort}
    }
    if(req.query.limit && req.query.skip)
    {
        skip = Number(req.query.skip);
        limit = Number(req.query.limit);
    }
    db.collection('zomato').find(query).sort(sort).skip(skip).limit(limit).toArray((err,result)=>
    {
        if(err) throw err;
        res.send(result);
    })
})

//now we need to send the data
app.post("/placeOrder",(req,res)=>{
    // console.log(req.body);
    db.collection("order").insert(req.body,(err,result)=>{
        if(err) throw err;
        res.send("Order Added");
    })
    // res.send("OK");
})

//list of all orders
app.get("/order",(req,res)=>{
    let email = req.query.email;
    let query={};
    if(email)
    {
        query= {"email" : email}
    }
    db.collection('order').find(query).toArray((err,result)=>{
        if(err) throw err;
        res.send(result);
        })
})

//menu item on the user selection
app.post("/menuitem",(req,res)=>{
    // console.log(req.body);
    // res.send("ok");
    db.collection("menu").find({menu_id : {$in:req.body}}).toArray((err,result)=>
    {
        if(err) throw err;
        res.send(result);
    })
})

//update order
app.put("/updateorder/:id",(req,res)=>{
    let OId = mongo.ObjectId(req.params.id);
    let status = req.query.status ? req.query.status : "Pending";

    db.collection("order").updateOne({_id : OId},{$set:{"status" : status}}, (err,result)=>{
        if(err) throw err;
        res.send(`status updated to ${status}`);
    }

    )
})

//delete
app.delete("/deleteorder",(req,res)=>{
    db.collection("order").remove({},(err,result)=>{
        if(err) throw err;
        res.send(result);
    })
})


mongoClient.connect(mongoUrl,(err,connection)=>{
    if(err) console.log("Error While Connecting");
    db = connection.db("zomato");
    app.listen(port,()=>{
        console.log(`Server start at ${port}`);
    });
})

