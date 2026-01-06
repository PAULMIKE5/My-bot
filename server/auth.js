import jwt from "jsonwebtoken";

export function signUserJwt(payload, secret) {
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export function signAdminJwt(payload, secret) {
  return jwt.sign(payload, secret, { expiresIn: "12h" });
}

export function requireUser(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).send("Missing token");
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (e) {
    return res.status(401).send("Invalid token");
  }
}

export function requireAdmin(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).send("Missing token");
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    if (req.admin?.type !== "admin") return res.status(403).send("Forbidden");
    return next();
  } catch (e) {
    return res.status(401).send("Invalid token");
  }
}
