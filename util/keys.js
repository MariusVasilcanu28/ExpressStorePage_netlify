exports.MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@vmd-dev.6sx6j.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;
exports.CSRF_CSRF_SECRET = `${process.env.CSRF_SECRET}`;
exports.STRIPE_PK = `${process.env.STRIPE_KEY}`;
exports.PORT = process.env.PORT || 3000;


