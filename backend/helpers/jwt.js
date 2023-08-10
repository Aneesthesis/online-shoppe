const { expressjwt: jwt } = require("express-jwt");

function authJwt() {
  const secret = process.env.JWT_SECRET;
  return jwt({ secret, algorithms: ["HS256"], isRevoked: isRevoked }).unless({
    path: [
      { url: /\/api\/v1\/products(.*)/, methods: ["GET", "OPTIONS"] },
      { url: /\/api\/v1\/categories(.*)/, methods: ["GET", "OPTIONS"] },
      { url: /\/public\/my-uploads(.*)/, methods: ["GET", "OPTIONS"] },
      "/api/v1/users/login",
      "/api/v1/users/register",
    ],
  });
}

async function isRevoked(req, token) {
  if (!token.payload.isAdmin) {
    return true;
  }
}

// async function isRevoked(req, payload, done) {
//   if (!payload.isAdmin) {
//     done(null, true); // Token is revoked
//   } else {
//     done(); // Token is valid
//   }
// }

module.exports = authJwt;
