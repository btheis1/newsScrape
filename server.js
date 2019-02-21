var express = require("express");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");


var db = require("./models");

var PORT = 3000;

var app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// app.use(express.static("public"));

var exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
});

app.get("/", function(req, res) {
    res.render("index");
})
//ROUTES
app.get("/scrape", function(req, res) {
    console.log("scrape hit")
    axios.get("https://www.nytimes.com/section/world").then(function(response) {
        var $ = cheerio.load(response.data);

        $("#stream-panel li").each(function(i, element) {
            var result = {};
            
            result.headline = $(this)
                .find("h2")
                .text();
            result.summary = $(this)
                .find("p")
                .text();
            result.URL = $(this)
                .find("a")
                .attr("href");
            console.log(result);
            db.Article.create(result)
                .then(function(dbArticle) {
                    console.log(dbArticle);
                })
                .catch(function(err) {
                    console.log(err);
                });
        });
        
        res.send("Scrape Complete");
    });
});

app.get("/articles", function(req, res) {
    db.Article.find({})
        .then(function(dbArticle) {
            res.json(dbArticle)
        })
        .catch(function(err) {
            res.json(err);
        });
});

app.get("/articles/:id", function(req, res) {
    db.Article.findOne({ _id: req.params.id })
        .populate("note")
        .then(function(dbArticle) {
            res.json(dbArticle);
        })
        .catch(function(err) {
            res.json(err);
        });
});

app.post("/articles/:id", function(req, res) {
    db.Note.create(req.body)
        .then(function(dbNote) {
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id}, { new: true})
        })
        .then(function(dbArticle) {
            res.json(dbArticle);
        }) 
        .catch(function(err) {
            res.json(err);
        });
});