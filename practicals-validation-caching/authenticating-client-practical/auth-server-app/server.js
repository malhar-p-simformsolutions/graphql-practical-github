const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const expressJwt = require('express-jwt'); //auth
const jwt = require('jsonwebtoken'); //auth
const db = require('./db');

var port = process.env.PORT || 9000
const jwtSecret = Buffer.from('88-FnukMN8ZleUmZV9K8z8DLiHdUUE', 'base64');
const app = express();

const fs = require('fs')
const typeDefs = fs.readFileSync('./schema.graphql',{encoding:'utf-8'})
const resolvers = require('./resolvers')
const {makeExecutableSchema} = require('graphql-tools')

const schema = makeExecutableSchema({typeDefs, resolvers})

app.use(cors(), bodyParser.json(), expressJwt({
   secret: jwtSecret,
   credentialsRequired: false,
   algorithms: ['RS256']
}));

const  {graphiqlExpress,graphqlExpress} = require('apollo-server-express');
const { applySchemaTransforms } = require('graphql-tools/dist/transforms/transforms');

app.use('/graphql', graphqlExpress((req) => ({
   schema,
   context: {user: req.user && db.students.get(req.user.sub)}
})));
app.use('/graphiql',graphiqlExpress({endpointURL:'/graphql'}))

//authenticate students
app.post('/login', (req, res) => {
   const email = req.body.email;
   const password = req.body.password;

   const user = db.students.list().find((user) =>  user.email === email);
   if (!(user && user.password === password)) {
      res.sendStatus(401);
      return;
   }
   const token = jwt.sign({sub: user.id}, jwtSecret);
   res.send({token});
});

app.listen(port, () => console.info(`Server started on port ${port}`));