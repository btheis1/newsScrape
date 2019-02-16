var express = require("express");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");

var db = require("./models");

var PORT = 3000;

var app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

var exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
});

//ROUTES
app.get("/scrape", function(req, res) {
    axios.get("https://www.bbc.com/news").then(function(response) {
        var $ = cheerio.load(response.data);

        $("story-body h1").each(function(i, element) {
            var result = {};

            result.headline = $(this)
                .children("a")
                .text();
            result.summary = $(this)
                .children("a")
                .text();
            result.URL = $(this)
                .children("a")
                .attr("href");
            
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

})