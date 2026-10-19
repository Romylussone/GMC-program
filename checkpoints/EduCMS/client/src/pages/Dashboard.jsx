import { Link } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  Add,
  ArrowForward,
  ArticleOutlined,
  VisibilityOutlined,
  ChatBubbleOutline,
  EditNoteOutlined,
  ArrowOutward,
  AutoStoriesOutlined,
  MoreHoriz,
} from "@mui/icons-material";
import {
  useAuth,
  useLoad,
  Loading,
  ErrorMessage,
  PageTitle,
  Status,
  Empty,
  date,
  number,
} from "../common";
const types = {
  article: "Article",
  course: "Course",
  announcement: "Announcement",
  resource: "Resource",
};
export function ViewsChart({ data = [] }) {
  const max = Math.max(4, ...data.map((d) => d.views));
  const points = data
    .map(
      (d, i) =>
        `${18 + i * (650 / Math.max(1, data.length - 1))},${155 - (d.views / max) * 130}`,
    )
    .join(" ");
  return (
    <div className="chart">
      <div className="chart-labels">
        {[
          max,
          Math.round(max * 0.75),
          Math.round(max * 0.5),
          Math.round(max * 0.25),
          0,
        ].map((n, i) => (
          <span key={i}>{number(n)}</span>
        ))}
      </div>
      <div className="chart-main">
        <svg
          viewBox="0 0 690 175"
          preserveAspectRatio="none"
          role="img"
          aria-label="Content views over the last 30 days"
        >
          <defs>
            <linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#258568" stopOpacity=".17" />
              <stop offset="100%" stopColor="#258568" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[25, 57.5, 90, 122.5, 155].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="690"
              y2={y}
              stroke="#e9eeec"
              strokeDasharray="4 5"
            />
          ))}
          {points && (
            <>
              <polygon
                points={`18,155 ${points} 668,155`}
                fill="url(#chart-fill)"
              />
              <polyline
                points={points}
                fill="none"
                stroke="#28836b"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
            </>
          )}
        </svg>
        <div className="chart-dates">
          {data
            .filter((_, i) => i % 7 === 0 || i === data.length - 1)
            .map((d) => (
              <span key={d.day}>
                {new Date(d.day).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}
export function StatCards({ data }) {
  return (
    <div className="stats-grid">
      {[
        [
          "Total content",
          data.total_posts,
          ArticleOutlined,
          `${data.published_posts} published`,
          "green",
        ],
        [
          "Content views",
          data.total_views,
          VisibilityOutlined,
          "All-time readership",
          "blue",
        ],
        [
          "Comments",
          data.total_comments,
          ChatBubbleOutline,
          `${data.pending_comments} awaiting review`,
          "orange",
        ],
        [
          "In draft",
          data.drafts,
          EditNoteOutlined,
          "Ideas taking shape",
          "purple",
        ],
      ].map(([label, value, Icon, note, color]) => (
        <div className="stat-card" key={label}>
          <div className="stat-top">
            <span>{label}</span>
            <span className={`stat-icon ${color}`}>
              <Icon sx={{ fontSize: 19 }} />
            </span>
          </div>
          <strong>{number(value)}</strong>
          <div className="stat-note">
            <span className={`tiny-dot ${color}`} />
            {note}
          </div>
        </div>
      ))}
    </div>
  );
}
export default function Dashboard() {
  const { user } = useAuth();
  const stats = useLoad("/analytics");
  const posts = useLoad("/posts?limit=5&sort=newest");
  const activity = useLoad("/analytics/activity?limit=4");
  if (stats.loading) return <Loading />;
  if (stats.error) return <ErrorMessage error={stats.error} />;
  const data = stats.data;
  return (
    <>
      <PageTitle
        eyebrow="A LITTLE CLARITY FOR YOUR DAY"
        title={`Welcome back, ${user.first_name || user.username} 👋`}
        description="Here’s what’s happening in your learning community."
        action={
          <Button
            component={Link}
            to="/admin/content/new"
            variant="contained"
            startIcon={<Add />}
          >
            Create content
          </Button>
        }
      />
      <section className="welcome-banner">
        <div>
          <span className="banner-tag">
            <span className="tiny-dot" /> YOUR IDEAS MAKE A DIFFERENCE
          </span>
          <h2>
            A place for knowledge.
            <br />A space for possibility.
          </h2>
          <p>
            Create, organize, and share content that helps your students go
            further.
          </p>
          <Button
            component={Link}
            to="/admin/content"
            color="inherit"
            size="small"
            endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
          >
            Manage your content
          </Button>
        </div>
        <div className="banner-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="art-book">
            <AutoStoriesOutlined sx={{ fontSize: 80 }} />
          </div>
          <div className="art-square">
            <ArticleOutlined />
          </div>
          <div className="art-star">✦</div>
          <div className="art-dot" />
        </div>
      </section>
      <div className="section-caption">
        <h3>At a glance</h3>
        <span>
          {data.scope === "own" ? "Your content" : "Institution overview"}{" "}
          <span className="tiny-dot green" /> Live data
        </span>
      </div>
      <StatCards data={data} />
      <div className="dashboard-middle">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Readership overview</h3>
              <p>How your educational content is being discovered</p>
            </div>
            <Chip
              label="Last 30 days"
              size="small"
              variant="outlined"
              sx={{ fontSize: 11, borderColor: "#e7ebee" }}
            />
          </div>
          <div className="chart-total">
            <strong>
              {number(data.daily_views.reduce((n, d) => n + d.views, 0))}
            </strong>
            <span>
              <span className="tiny-dot green" /> Content views
            </span>
          </div>
          <ViewsChart data={data.daily_views} />
        </section>
        <section className="panel categories-panel">
          <div className="panel-heading">
            <div>
              <h3>Content by category</h3>
              <p>A balanced learning library</p>
            </div>
            <FolderSymbol />
          </div>
          <div className="category-bars">
            {data.by_category.length ? (
              data.by_category.slice(0, 5).map((cat, i) => (
                <div className="category-bar" key={cat.name}>
                  <div>
                    <span>
                      <i
                        style={{
                          background: [
                            "#24765e",
                            "#68a28e",
                            "#a7c3b6",
                            "#d6b77c",
                            "#c6d1d9",
                          ][i],
                        }}
                      />
                      {cat.name}
                    </span>
                    <strong>{cat.count}</strong>
                  </div>
                  <div className="bar-track">
                    <div
                      style={{
                        width: `${(cat.count / Math.max(1, data.total_posts)) * 100}%`,
                        background: [
                          "#24765e",
                          "#68a28e",
                          "#a7c3b6",
                          "#d6b77c",
                          "#c6d1d9",
                        ][i],
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <Empty
                title="Your canvas is ready"
                description="Add content to see its categories."
              />
            )}
          </div>
        </section>
      </div>
      <section className="panel recent-panel">
        <div className="panel-heading">
          <div>
            <h3>
              Recent content{" "}
              <span className="count-pill">
                {posts.data?.pagination.total || 0}
              </span>
            </h3>
            <p>Your latest ideas, all in one place</p>
          </div>
          <Button
            component={Link}
            to="/admin/content"
            size="small"
            color="inherit"
            endIcon={<ArrowForward sx={{ fontSize: 15 }} />}
          >
            View all content
          </Button>
        </div>
        <ErrorMessage error={posts.error} />
        {posts.loading ? (
          <Loading />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>CONTENT TITLE</TableCell>
                  <TableCell>TYPE</TableCell>
                  <TableCell>STATUS</TableCell>
                  <TableCell>VIEWS</TableCell>
                  <TableCell>LAST UPDATED</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {posts.data?.items.map((post, i) => (
                  <TableRow key={post.post_id} hover>
                    <TableCell>
                      <Link
                        className="content-title"
                        to={`/admin/content/${post.post_id}`}
                      >
                        <span className={`content-icon tone-${i % 4}`}>
                          <ArticleOutlined sx={{ fontSize: 18 }} />
                        </span>
                        <span>
                          <strong>{post.title}</strong>
                          <small>{post.category_name || "Uncategorized"}</small>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>{types[post.content_type]}</TableCell>
                    <TableCell>
                      <Status value={post.status} />
                    </TableCell>
                    <TableCell>{number(post.view_count)}</TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>
                      {date(post.updated_at)}
                    </TableCell>
                    <TableCell>
                      <Button
                        component={Link}
                        to={`/admin/content/${post.post_id}`}
                        size="small"
                        aria-label={`Edit ${post.title}`}
                        sx={{ minWidth: 25, color: "#8d989f" }}
                      >
                        <MoreHoriz fontSize="small" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </section>
      <div className="dashboard-bottom">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Workspace activity</h3>
              <p>The small steps behind your big ideas</p>
            </div>
            <span className="activity-live">RECENT</span>
          </div>
          <div className="activity-list">
            <ErrorMessage error={activity.error} />
            {activity.data?.items.length ? (
              activity.data.items.map((item) => (
                <div className="activity-item" key={item.log_id}>
                  <Avatar
                    sx={{
                      width: 31,
                      height: 31,
                      fontSize: 10,
                      bgcolor: "#eff3ed",
                      color: "#607b56",
                    }}
                  >
                    {item.username?.slice(0, 2).toUpperCase() || "EC"}
                  </Avatar>
                  <div>
                    <p>
                      <strong>
                        {item.first_name || item.username || "A user"}
                      </strong>{" "}
                      {item.action} {item.entity_type}
                      <span>{item.description}</span>
                    </p>
                    <small>{date(item.created_at)}</small>
                  </div>
                </div>
              ))
            ) : (
              <Typography color="text.secondary" sx={{ pb: 2 }}>
                Your next action starts the story.
              </Typography>
            )}
          </div>
        </section>
        <section className="quick-start">
          <span className="eyebrow">KEEP THE MOMENTUM GOING</span>
          <h3>
            What will you
            <br />
            teach the world today?
          </h3>
          <p>
            A new tutorial. A useful resource.
            <br />A fresh perspective. Start here.
          </p>
          <Button
            component={Link}
            to="/admin/content/new"
            variant="contained"
            endIcon={<ArrowOutward sx={{ fontSize: 16 }} />}
          >
            Bring an idea to life
          </Button>
          <span className="quick-decoration" aria-hidden="true">
            ✳
          </span>
        </section>
      </div>
    </>
  );
}
function FolderSymbol() {
  return <span className="folder-symbol">▱</span>;
}
