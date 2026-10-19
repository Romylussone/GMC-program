const router = require("express").Router();
const db = require("../config/database");
const cache = require("../services/cacheService");
const { authorize, canManage } = require("../middleware/auth");
const { pagination } = require("../middleware/validation");
const { paginate, success } = require("../utils/helpers");
router.use(authorize("admin", "editor", "author"));
router.get("/", async (req, res) => {
  const mine = !canManage(req.user);
  const params = mine ? [req.user.user_id] : [];
  const where = mine ? "WHERE author_id=$1" : "";
  const stats = (
    await db.query(
      `SELECT COUNT(*)::INTEGER AS total_posts,COUNT(*) FILTER(WHERE status='published')::INTEGER AS published_posts,COUNT(*) FILTER(WHERE status='draft')::INTEGER AS drafts,COUNT(*) FILTER(WHERE status='archived')::INTEGER AS archived,COALESCE(SUM(view_count),0)::INTEGER AS total_views,COALESCE(SUM(like_count),0)::INTEGER AS total_likes FROM posts ${where}`,
      params,
    )
  ).rows[0];
  const comments = (
    await db.query(
      `SELECT COUNT(*)::INTEGER AS total_comments,COUNT(*) FILTER(WHERE c.status='pending')::INTEGER AS pending_comments FROM comments c JOIN posts p ON p.post_id=c.post_id ${mine ? "WHERE p.author_id=$1" : ""}`,
      params,
    )
  ).rows[0];
  const topPosts = (
    await db.query(
      `SELECT post_id,title,status,content_type,view_count,like_count FROM posts ${where} ORDER BY view_count DESC,post_id DESC LIMIT 5`,
      params,
    )
  ).rows;
  const views = (
    await db.query(
      `SELECT d.day::date AS day,COUNT(v.view_id)::INTEGER AS views FROM generate_series(CURRENT_DATE-29,CURRENT_DATE,'1 day') d(day) LEFT JOIN (post_views v JOIN posts p ON p.post_id=v.post_id ${mine ? "AND p.author_id=$1" : ""}) ON v.created_at>=d.day AND v.created_at<d.day+INTERVAL '1 day' GROUP BY d.day ORDER BY d.day`,
      params,
    )
  ).rows;
  const byCategory = (
    await db.query(
      `SELECT COALESCE(c.name,'Uncategorized') AS name,COUNT(*)::INTEGER AS count FROM posts p LEFT JOIN categories c ON c.category_id=p.category_id ${mine ? "WHERE p.author_id=$1" : ""} GROUP BY c.name ORDER BY count DESC`,
      params,
    )
  ).rows;
  let totalUsers = null;
  if (req.user.role === "admin") {
    totalUsers = await cache.get("user-count");
    if (totalUsers === null) {
      totalUsers = Number(
        (await db.query("SELECT COUNT(*) FROM users")).rows[0].count,
      );
      await cache.set("user-count", totalUsers, 30);
    }
  }
  success(res, {
    ...stats,
    ...comments,
    total_users: totalUsers,
    top_posts: topPosts,
    daily_views: views,
    by_category: byCategory,
    scope: mine ? "own" : "institution",
  });
});
router.get("/activity", ...pagination, async (req, res) => {
  const { page, limit, offset } = paginate(req.query);
  const mine = !canManage(req.user);
  const params = mine ? [req.user.user_id] : [];
  const where = mine ? "WHERE a.user_id=$1" : "";
  const total = Number(
    (await db.query(`SELECT COUNT(*) FROM activity_log a ${where}`, params))
      .rows[0].count,
  );
  const items = (
    await db.query(
      `SELECT a.log_id,a.action,a.entity_type,a.entity_id,a.description,a.created_at,u.username,u.first_name,u.last_name FROM activity_log a LEFT JOIN users u ON u.user_id=a.user_id ${where} ORDER BY a.created_at DESC,a.log_id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    )
  ).rows;
  success(res, {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});
module.exports = router;
