import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { z, ZodError } from "zod";
import { config } from "./config.js";
import { User, Property, Lead, Appointment } from "./models.js";
import {
  registerInput,
  loginInput,
  propertyInput,
  filtersInput,
  preferencesInput,
  messageInput,
  appointmentInput,
} from "./validation.js";
import { scoreProperty } from "./recommendations.js";

type Account = mongoose.HydratedDocument<
  mongoose.InferSchemaType<typeof User.schema>
>;
declare global {
  namespace Express {
    interface Request {
      account?: Account;
    }
  }
}
class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const fail = (status: number, message: string): never => {
  throw new HttpError(status, message);
};
const id = (value: unknown): string =>
  typeof value === "string" && mongoose.isValidObjectId(value)
    ? value
    : fail(400, "Identifiant invalide.");
const safeUser = (user: Account) => ({
  _id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  preferences: user.preferences,
  favorites: user.favorites,
});
const cookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 86400000,
};
const session = (res: Response, user: Account) =>
  res.cookie(
    "artparts_session",
    jwt.sign({ sub: user.id }, config.JWT_SECRET, {
      expiresIn: "7d",
      algorithm: "HS256",
    }),
    cookieOptions,
  );
async function auth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies.artparts_session;
    if (!token)
      return next(new HttpError(401, "Connectez-vous pour continuer."));
    const payload = jwt.verify(token, config.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    if (typeof payload === "string" || !payload.sub)
      return next(new HttpError(401, "Session invalide."));
    const user = await User.findById(payload.sub);
    if (!user) return next(new HttpError(401, "Session expirée."));
    req.account = user;
    next();
  } catch {
    next(new HttpError(401, "Session expirée."));
  }
}
function professional(req: Request, _res: Response, next: NextFunction) {
  next(
    req.account?.role === "seeker"
      ? new HttpError(403, "Espace réservé aux professionnels.")
      : undefined,
  );
}
const literal = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
async function ownedProperty(req: Request) {
  const property = await Property.findOne({
    _id: id(req.params.id),
    owner: req.account!._id,
  });
  return property || fail(404, "Annonce introuvable.");
}
async function accessibleLead(req: Request) {
  const lead = await Lead.findOne({
    _id: id(req.params.id),
    $or: [{ owner: req.account!._id }, { seeker: req.account!._id }],
  });
  return lead || fail(404, "Conversation introuvable.");
}
export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(
    helmet(),
    cors({ origin: config.WEB_ORIGIN, credentials: true }),
    express.json({ limit: "100kb" }),
    cookieParser(),
  );
  app.use(
    "/api",
    rateLimit({
      windowMs: 60000,
      limit: 300,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { message: "Trop de requêtes, réessayez dans une minute." },
    }),
  );
  app.use((req, _res, next) => {
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.headers.origin &&
      req.headers.origin !== config.WEB_ORIGIN
    )
      return next(new HttpError(403, "Origine non autorisée."));
    next();
  });
  app.get("/api/health", (_req, res) =>
    res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({
      status: mongoose.connection.readyState === 1 ? "ok" : "unavailable",
      database: "MongoDB",
    }),
  );
  const authLimit = rateLimit({
    windowMs: 15 * 60000,
    limit: 30,
    message: { message: "Trop de tentatives. Réessayez dans 15 minutes." },
  });
  app.post("/api/auth/register", authLimit, async (req, res) => {
    const input = registerInput.parse(req.body);
    const user = await User.create({
      ...input,
      password: await bcrypt.hash(input.password, 12),
    });
    session(res, user);
    res.status(201).json(safeUser(user));
  });
  app.post("/api/auth/login", authLimit, async (req, res) => {
    const input = loginInput.parse(req.body);
    const user = await User.findOne({ email: input.email }).select("+password");
    const valid = await bcrypt.compare(
      input.password,
      user?.password ||
        "$2b$12$XHQdtzeYtApIRGNQr1ERQObiOh/.z5Dk1J1eLAi6A7P2Fa5bXGyXm",
    );
    if (!user || !valid) fail(401, "Email ou mot de passe incorrect.");
    session(res, user!);
    res.json(safeUser(user!));
  });
  app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie("artparts_session", {
      ...cookieOptions,
      maxAge: undefined,
    });
    res.status(204).end();
  });
  app.get("/api/auth/me", auth, (req, res) => res.json(safeUser(req.account!)));
  app.patch("/api/me/preferences", auth, async (req, res) => {
    req.account!.set("preferences", preferencesInput.parse(req.body));
    await req.account!.save();
    res.json(safeUser(req.account!));
  });
  app.get("/api/properties", async (req, res) => {
    const f = filtersInput.parse(req.query);
    const filter: Record<string, unknown> = { status: "published" };
    for (const key of ["city", "district", "transaction", "type"] as const)
      if (f[key]) filter[key] = new RegExp(`^${literal(f[key]!)}$`, "i");
    if (f.q)
      filter.$or = ["title", "city", "district"].map((key) => ({
        [key]: new RegExp(literal(f.q!), "i"),
      }));
    if (f.minPrice !== undefined || f.maxPrice !== undefined)
      filter.price = {
        ...(f.minPrice !== undefined ? { $gte: f.minPrice } : {}),
        ...(f.maxPrice !== undefined ? { $lte: f.maxPrice } : {}),
      };
    if (f.bedrooms !== undefined) filter.bedrooms = { $gte: f.bedrooms };
    if (f.tour) filter.panorama = { $nin: ["", null] };
    const sort: Record<string, 1 | -1> =
      f.sort === "price-asc"
        ? { price: 1 }
        : f.sort === "price-desc"
          ? { price: -1 }
          : { createdAt: -1 };
    const [items, total] = await Promise.all([
      Property.find(filter)
        .sort(sort)
        .skip((f.page - 1) * f.limit)
        .limit(f.limit)
        .populate("owner", "name phone role"),
      Property.countDocuments(filter),
    ]);
    res.json({ items, total, page: f.page, pages: Math.ceil(total / f.limit) });
  });
  app.get("/api/properties/:id", async (req, res) => {
    const property = await Property.findOne({
      _id: id(req.params.id),
      status: "published",
    }).populate("owner", "name phone role");
    res.json(property || fail(404, "Ce bien est indisponible."));
  });
  app.post("/api/properties", auth, professional, async (req, res) =>
    res.status(201).json(
      await Property.create({
        ...propertyInput.parse(req.body),
        owner: req.account!._id,
      }),
    ),
  );
  app.patch("/api/properties/:id", auth, professional, async (req, res) => {
    const property = await ownedProperty(req);
    property.set(propertyInput.partial().parse(req.body));
    await property.save();
    res.json(property);
  });
  app.delete("/api/properties/:id", auth, professional, async (req, res) => {
    const property = await ownedProperty(req);
    property.status = "archived";
    await property.save();
    res.status(204).end();
  });
  app.get("/api/me/properties", auth, professional, async (req, res) =>
    res.json(
      await Property.find({ owner: req.account!._id }).sort({ createdAt: -1 }),
    ),
  );
  app.get("/api/me/favorites", auth, async (req, res) =>
    res.json(
      await Property.find({
        _id: { $in: req.account!.favorites },
        status: "published",
      }).populate("owner", "name phone role"),
    ),
  );
  app.put("/api/me/favorites/:id", auth, async (req, res) => {
    const propertyId = id(req.params.id);
    if (!(await Property.exists({ _id: propertyId, status: "published" })))
      fail(404, "Bien introuvable.");
    await User.updateOne(
      { _id: req.account!._id },
      { $addToSet: { favorites: propertyId } },
    );
    res.status(204).end();
  });
  app.delete("/api/me/favorites/:id", auth, async (req, res) => {
    await User.updateOne(
      { _id: req.account!._id },
      { $pull: { favorites: id(req.params.id) } },
    );
    res.status(204).end();
  });
  app.get("/api/me/recommendations", auth, async (req, res) => {
    const prefs = req.account!.preferences!;
    const properties = await Property.find({
      status: "published",
      transaction: prefs.transaction,
    }).lean();
    res.json(
      properties
        .map((p) => ({ ...p, ...scoreProperty(p, prefs) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 12),
    );
  });
  app.post("/api/properties/:id/leads", auth, async (req, res) => {
    const { message } = messageInput.parse(req.body);
    const property = await Property.findOne({
      _id: id(req.params.id),
      status: "published",
    });
    if (!property) fail(404, "Bien introuvable.");
    if (property!.owner.equals(req.account!._id))
      fail(400, "Vous êtes propriétaire de ce bien.");
    const lead = await Lead.findOneAndUpdate(
      { property: property!._id, seeker: req.account!._id },
      {
        $setOnInsert: { owner: property!.owner },
        $push: { messages: { sender: req.account!._id, body: message } },
      },
      { upsert: true, returnDocument: "after", runValidators: true },
    );
    const { notes: _notes, ...publicLead } = lead!.toObject();
    res.status(201).json(publicLead);
  });
  app.get("/api/me/leads", auth, async (req, res) => {
    const leads = await Lead.find({
      $or: [{ owner: req.account!._id }, { seeker: req.account!._id }],
    })
      .populate("property", "title price transaction")
      .populate("seeker", "name email phone")
      .populate("owner", "name phone")
      .sort({ updatedAt: -1 });
    res.json(
      leads.map((lead) => {
        const data = lead.toObject();
        if (String(data.owner._id) !== req.account!.id) data.notes = "";
        return data;
      }),
    );
  });
  app.patch("/api/leads/:id", auth, professional, async (req, res) => {
    const input = z
      .object({
        stage: z
          .enum(["new", "contacted", "qualified", "won", "lost"])
          .optional(),
        notes: z.string().max(4000).optional(),
      })
      .strict()
      .parse(req.body);
    const lead = await Lead.findOneAndUpdate(
      { _id: id(req.params.id), owner: req.account!._id },
      { $set: input },
      { returnDocument: "after", runValidators: true },
    );
    res.json(lead || fail(404, "Prospect introuvable."));
  });
  app.post("/api/leads/:id/messages", auth, async (req, res) => {
    const { message } = messageInput.parse(req.body);
    const lead = await accessibleLead(req);
    await Lead.updateOne(
      { _id: lead._id },
      { $push: { messages: { sender: req.account!._id, body: message } } },
    );
    res.status(201).json({ message: "Message envoyé." });
  });
  app.post("/api/appointments", auth, async (req, res) => {
    const input = appointmentInput.parse(req.body);
    const startsAt = new Date(input.startsAt);
    if (
      startsAt.getTime() <= Date.now() ||
      startsAt.getTime() > Date.now() + 90 * 86400000 ||
      startsAt.getUTCMinutes() !== 0 ||
      startsAt.getUTCSeconds() !== 0 ||
      startsAt.getUTCMilliseconds() !== 0 ||
      startsAt.getUTCHours() < 8 ||
      startsAt.getUTCHours() > 18
    )
      fail(
        400,
        "Choisissez une heure pleine entre 8 h et 18 h (GMT), dans les 90 prochains jours.",
      );
    const property = await Property.findOne({
      _id: input.propertyId,
      status: "published",
    });
    if (!property) fail(404, "Bien introuvable.");
    if (property!.owner.equals(req.account!._id))
      fail(400, "Vous êtes propriétaire de ce bien.");
    res.status(201).json(
      await Appointment.create({
        property: property!._id,
        owner: property!.owner,
        seeker: req.account!._id,
        startsAt,
        message: input.message,
      }),
    );
  });
  app.get("/api/me/appointments", auth, async (req, res) =>
    res.json(
      await Appointment.find({
        $or: [{ owner: req.account!._id }, { seeker: req.account!._id }],
      })
        .populate("property", "title city district images")
        .populate("seeker", "name phone email")
        .populate("owner", "name phone")
        .sort({ startsAt: 1 }),
    ),
  );
  app.patch("/api/appointments/:id", auth, async (req, res) => {
    const { status } = z
      .object({ status: z.enum(["confirmed", "cancelled", "completed"]) })
      .strict()
      .parse(req.body);
    const appointment = await Appointment.findOne({
      _id: id(req.params.id),
      $or: [{ owner: req.account!._id }, { seeker: req.account!._id }],
    });
    if (!appointment) fail(404, "Rendez-vous introuvable.");
    if (!appointment!.owner.equals(req.account!._id) && status !== "cancelled")
      fail(403, "Seul le professionnel peut confirmer une visite.");
    if (["cancelled", "completed"].includes(appointment!.status!))
      fail(409, "Ce rendez-vous est déjà clôturé.");
    if (
      status === "completed" &&
      (appointment!.status !== "confirmed" ||
        appointment!.startsAt.getTime() > Date.now())
    )
      fail(400, "La visite doit être confirmée et passée.");
    const updated = await Appointment.findOneAndUpdate(
      { _id: appointment!._id, status: appointment!.status },
      { $set: { status } },
      { returnDocument: "after" },
    );
    res.json(
      updated || fail(409, "Le rendez-vous a été modifié. Actualisez la page."),
    );
  });
  app.get("/api/me/stats", auth, professional, async (req, res) => {
    const owner = req.account!._id;
    const [properties, leads, visits, won] = await Promise.all([
      Property.countDocuments({ owner, status: "published" }),
      Lead.countDocuments({ owner }),
      Appointment.countDocuments({
        owner,
        status: { $in: ["pending", "confirmed"] },
        startsAt: { $gte: new Date() },
      }),
      Lead.countDocuments({ owner, stage: "won" }),
    ]);
    res.json({
      properties,
      leads,
      visits,
      conversion: leads ? Math.round((won / leads) * 100) : 0,
    });
  });
  app.use((_req, _res, next) => next(new HttpError(404, "Route introuvable.")));
  app.use(
    (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      if (error instanceof ZodError)
        return res.status(400).json({
          message: "Vérifiez les champs du formulaire.",
          errors: error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        });
      if (error instanceof HttpError)
        return res.status(error.status).json({ message: error.message });
      if (error instanceof mongoose.Error.ValidationError)
        return res.status(400).json({ message: "Données invalides." });
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === 11000
      )
        return res
          .status(409)
          .json({ message: "Cet email ou ce créneau est déjà utilisé." });
      if (error instanceof SyntaxError)
        return res.status(400).json({ message: "JSON invalide." });
      console.error(error);
      res.status(500).json({ message: "Erreur interne. Veuillez réessayer." });
    },
  );
  return app;
}
