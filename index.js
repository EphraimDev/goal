const express = require('express');
const app = express();
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const routeUrls = require('./routes/routes');
const cors = require('cors');
const errorHandler = require('./middleware/error')

dotenv.config();

app.use(express.json());

app.use(cors());

app.get("/", (req, res) => res.send("decimal god is live"))

app.use('/app', routeUrls);

app.use("*", (req, res) => res.send("Route does not exist"))

app.use(errorHandler)

if(process.env.NODE_ENV === 'production'){
    app.use(express.static('client/build'))
    app.get ('*', (res) =>{
        res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'))
    })
}

const server = app.listen(4000, () => console.log("server is running"));

mongoose.connect(process.env.aces, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
}, () => console.log("DB Connected"));