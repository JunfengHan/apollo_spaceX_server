const { ApolloServer } = require('apollo-server');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const { createStore } = require('./utils');
const isEmail = require('isemail');

const LaunchAPI = require('./datasources/launch');
const UserAPI = require('./datasources/user');

const store = createStore();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources: () => ({
    launchAPI: new LaunchAPI(),
    userAPI: new UserAPI({ store })
  }),
  /*
   * 客户端向我们的服务器发送的每一个 GraphQL 操作都会调用一次上面定义的上下文函数。
   * 这个函数的返回值会成为上下文参数，作为该操作的一部分传递给每个运行的解析器。
   */

  context: async ({ req }) => {
    // simple auth check on every request
    // 获取传入请求中包含的 Authorization标头（如果有）的值
    const auth = req.headers && req.headers.authorization || '';
    // 解码 Authorization标头 的值
    const email = Buffer.from(auth, 'base64').toString('ascii');
    // 判断解码后的值类似于电子邮件地址
    if (!isEmail.validate(email)) return { user: null };
    // find a user by their email
    const users = await store.users.findOrCreate({ where: { email } });
    const user = users && users[0] || null;
    return { user: { ...user.dataValues } };
  },
});

server.listen().then(() => {
  console.log(`
    Server is running!
    Listening on port 4000
    Explore at https://studio.apollographql.com/dev
  `);
});