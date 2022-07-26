const express = require("express");
const admin = require("firebase-admin");
const bcrypt = require("bcrypt");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

//firebase admin setup
let serviceAccount = require("./ecom-website-17dd9-firebase-adminsdk-30jn7-244d5ad833.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

let db = admin.firestore();

//aws config

const aws = require("aws-sdk");
const dotenv = require("dotenv");

dotenv.config();

const region = "ap-south-1";
const bucketName = "shopping-web";
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

aws.config.update({
  region,
  accessKeyId,
  secretAccessKey,
});

//init s3
const s3 = new aws.S3();

//generate image upload link

async function generateUrl(file) {
  let date = new Date();
  let id = parseInt(Math.random() * 1000000000);
  console.log('1')
  var fileStream = fs.createReadStream(file.path);
  console.log('2')
  const imageName = `${id}${date.getTime()}.jpg`;
  const params = {
    Bucket:bucketName,
    ACL: 'public-read',
    Key: imageName,
    Body: fileStream,
    ContentType: 'application/octet-stream'
  };
  console.log('3')

  try {
    console.log('4')
    // var uploadedFile = await aws.S3(bucketName).upload(params).promise();
    const uploadFile=await s3.getSignedUrlPromise('putObject',params)
    console.log('5')
    return uploadFile;
  } catch (error) {
    throw error;
  }
}

let staticPath = path.join(__dirname, "public");

const app = express();

app.use(express.static(staticPath));
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(staticPath, "signup.html"));
});
app.post("/signup", (req, res) => {
  let { name, email, password, number, tac, notification } = req.body;

  if (name.length < 3) {
    return res.json({ alert: "name must be 3 letters long" });
  } else if (!email.length) {
    return res.json({ alert: "enter yout email" });
  } else if (password.length < 8) {
    return res.json({ alert: "password must be 8 letters long" });
  } else if (!number.length) {
    return res.json({ alert: "enter yout phone number" });
  } else if (!Number(number) || number.length < 10) {
    return res.json({ alert: "Invalid number, please enter valid one" });
  } else if (!tac) {
    return res.json({ alert: "you must agree to our terms and conditions" });
  }

  db.collection("user")
    .doc(email)
    .get()
    .then((user) => {
      if (user.exists) {
        return res.json({ alert: "email alreadys exists" });
      } else {
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(password, salt, (err, hash) => {
            req.body.password = hash;
            db.collection("users")
              .doc(email)
              .set(req.body)
              .then((data) => {
                res.json({
                  name: req.body.name,
                  email: req.body.email,
                  seller: req.body.seller,
                });
              });
          });
        });
      }
    });
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(staticPath, "login.html"));
});

app.post("/login", (req, res) => {
  let { email, password } = req.body;

  if (!email.length || !password.length) {
    return res.json({ alert: "fill all the inputs" });
  }
  db.collection("users")
    .doc(email)
    .get()
    .then((user) => {
      if (!user.exists) {
        return res.json({ alert: "log in email does not exists" });
      } else {
        bcrypt.compare(password, user.data().password, (err, result) => {
          if (result) {
            let data = user.data();
            return res.json({
              name: data.name,
              email: data.email,
              seller: data.seller,
            });
          } else {
            return res.json({ alert: "password is incorrect" });
          }
        });
      }
    });
});

app.get("/seller", (req, res) => {
  res.sendFile(path.join(staticPath, "seller.html"));
});
app.post("/seller", (req, res) => {
  let { name, about, address, number, tac, legit, email } = req.body;
  if (
    !name.length ||
    !address.length ||
    !about.length ||
    number.length < 10 ||
    !Number(number)
  ) {
    return res.json({ alert: "some information(s) is/are invalid" });
  } else if (!tac || !legit) {
    return res.json({ alert: "you must agree to our terms and conditions" });
  } else {
    //update users seller status here
    db.collection("sellers")
      .doc(email)
      .set(req.body)
      .then((data) => {
        db.collection("users")
          .doc(email)
          .update({
            seller: true,
          })
          .then((data) => {
            res.json(true);
          });
      });
  }
});
app.get("/add-product", (req, res) => {
  res.sendFile(path.join(staticPath, "add-product.html"));
});

app.get("/add-product/:id", (req, res) => {
  res.sendFile(path.join(staticPath, "add-product.html"));
});
//add product
app.post("/add-product", (req, res) => {
  let {
    name,
    shortDes,
    des,
    sizes,
    actualPrice,
    discount,
    sellPrice,
    stock,
    tags,
    tac,
    email,
    draft,
    id,
  } = req.body;

  //validate
  if (!draft) {
    if (!name.length) {
      return res.json({ alert: "enter product name" });
    } else if (shortDes.length > 100 || shortDes.length < 10) {
      return res.json({
        alert: "short description must be between 10 to 100 letters long",
      });
    } else if (!des.length) {
      return res.json({ alert: "enter detail description about the product" });
    } else if (!sizes.length) {
      return res.json({ alert: "select atleast one product" });
    } else if (!actualPrice.length || !discount.length || !sellPrice.length) {
      return res.json({ alert: "you must add pricings" });
    } else if (stock < 20) {
      return res.json({ alert: "you should have atleast 20 items in stock" });
    } else if (!tags.length) {
      return res.json({ alert: "enter detail description about the product" });
    } else if (!tac) {
      return res.json({ alert: "you must agree to our terms and conditions" });
    }
  }
  //add product
  let docName =
    id == undefined
      ? `${name.toLowerCase()}-${Math.floor(Math.random() * 5000)}`
      : id;
  db.collection("products")
    .doc(docName)
    .set(req.body)
    .then((data) => {
      console.log(data)
      res.json({ product: name });
    })
    .catch((err) => {
      return res.json({ alert: "some error occured. Try again" });
    });
});

//get products
app.post("/get-products", (req, res) => {
  let { email, id, tags } = req.body;
  if (id) {
    docRef = db.collection("products").doc(id);
  } else if (tags) {
    docRef = db.collection("products").where("tags", "array-contains", tags);
  } else {
    docRef = db.collection("products").where("email", "==", email);
  }
  docRef.get().then((products) => {
    if (products.empty) {
      return res.json("no products");
    }
    let productArr = [];
    if (id) {
      return res.json(products.data());
    } else {
      products.forEach((item) => {
        let data = item.data();
        data.id = item.id;
        productArr.push(data);
      });
      res.json(productArr);
    }
  });
});

app.post("/delete-product", (req, res) => {
  let { id } = req.body;

  db.collection("products")
    .doc(id)
    .delete()
    .then((data) => {
      res.json("sucess");
    })
    .catch((err) => {
      res.json("err");
    });
});

//product page
app.get("/products/:id", (req, res) => {
  res.sendFile(path.join(staticPath, "product.html"));
});

app.get("/search/:key", (req, res) => {
  res.sendFile(path.join(staticPath, "search.html"));
});

app.get("/cart", (req, res) => {
  res.sendFile(path.join(staticPath, "cart.html"));
});
app.get("/checkout", (req, res) => {
  res.sendFile(path.join(staticPath, "checkout.html"));
});
app.post("/order", (req, res) => {
  const { order, email, add } = req.body;

  let docName = email + Math.floor(Math.random() * 123455643454);
  db.collection("order")
    .doc(docName)
    .set(req.body)
    .then((data) => {
      res.json("Your order has been placed");
    });
});

//get the upload link
app.get("/s3url", (req, res) => {
  generateUrl().then((url) => res.json(url));
});

var upload = multer({ dest: "uploads/" });

app.post("/image-upload", upload.single("file"), async (req, res) => {
  try {
    var url = await generateUrl(req.file);
    res.json(url);
  } catch (err) {
    res.status(400).json({ response: "failure" });
  }
});

app.get("/404", (req, res) => {
  res.sendFile(path.join(staticPath, "404.html"));
});

app.use((req, res) => {
  res.redirect("/404");
});

app.listen(3000, () => {
  console.log("listening on port 3000.........");
});