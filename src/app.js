const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests
}));

const authRoutes = require('./routes/authRoutes');

app.use('/auth', authRoutes);

mongoose.connect(process.env.MONGO_URI, {
    //create cluster--->connect--->copy connection string
    //click cluster--->in left click database access---->database user section-->edit--->change password

    //useNewUrlParser: true,  //mongoose uses parser to parse the mongodb string, this will ensure mongoose will use modern parser
    //useUnifiedTopology: true, //topology engine manage connection between app and database, this will ensure, mongoose use updated topology engine
}).then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
