const fs = require("node:fs");
const collection = {
  info: {
    name: "EduCMS REST API",
    description:
      "Run Sign in first. Development credentials use the SEED_PASSWORD from .env. All writes target your selected baseUrl. Content updates require a current revision.",
    schema:
      "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:5000/api/v1" },
    { key: "email", value: "admin@educms.com" },
    { key: "password", value: "ChangeMe123!" },
    { key: "token", value: "" },
    { key: "postId", value: "1" },
    { key: "revision", value: "1" },
    { key: "versionId", value: "1" },
    { key: "categoryId", value: "1" },
    { key: "tagId", value: "1" },
    { key: "commentId", value: "1" },
    { key: "mediaId", value: "1" },
    { key: "userId", value: "2" },
  ],
  auth: {
    type: "bearer",
    bearer: [{ key: "token", value: "{{token}}", type: "string" }],
  },
  item: [],
};
const make = (name, method, route, body, extra = {}) => ({
  name,
  request: {
    method,
    header: body ? [{ key: "Content-Type", value: "application/json" }] : [],
    url: `{{baseUrl}}${route}`,
    ...(body
      ? {
          body: {
            mode: "raw",
            raw: JSON.stringify(body, null, 2),
            options: { raw: { language: "json" } },
          },
        }
      : {}),
    ...extra,
  },
});
const testScript = (lines) => [
  { listen: "test", script: { type: "text/javascript", exec: lines } },
];
const draft = {
  title: "A new learning resource",
  content: "<h2>Introduction</h2><p>Learn through practical examples.</p>",
  excerpt: "A practical introduction for curious students.",
  content_type: "article",
  status: "draft",
  category_id: 1,
  tag_ids: [1],
  meta_title: "A new learning resource",
  meta_description: "Learn through practical examples.",
  meta_keywords: "education,tutorial",
  allow_comments: true,
  is_featured: false,
};
const login = make(
  "Sign in",
  "POST",
  "/auth/login",
  { email: "{{email}}", password: "{{password}}" },
  { auth: { type: "noauth" } },
);
login.event = testScript([
  "pm.test('Login succeeds', () => pm.response.to.have.status(200));",
  "if (pm.response.code === 200) pm.collectionVariables.set('token', pm.response.json().data.token);",
]);
const create = make("Create draft", "POST", "/posts", draft);
create.event = testScript([
  "pm.test('Draft created', () => pm.response.to.have.status(201));",
  "if (pm.response.code === 201) { const p=pm.response.json().data; pm.collectionVariables.set('postId', p.post_id); pm.collectionVariables.set('revision', p.revision); }",
]);
const update = make("Update or publish content", "PUT", "/posts/{{postId}}", {
  ...draft,
  revision: "{{revision}}",
});
update.event = testScript([
  "if (pm.response.code === 200) pm.collectionVariables.set('revision', pm.response.json().data.revision);",
]);
collection.item = [
  {
    name: "Authentication",
    item: [
      login,
      make(
        "Register subscriber",
        "POST",
        "/auth/register",
        {
          username: "student",
          email: "student@example.edu",
          password: "ChooseYourPassword123!",
        },
        { auth: { type: "noauth" } },
      ),
      make("Current user", "GET", "/auth/me"),
      make("Sign out and revoke sessions", "POST", "/auth/logout"),
      make("Change password and revoke sessions", "PATCH", "/auth/password", {
        current_password: "{{password}}",
        password: "NewPassword123!",
      }),
    ],
  },
  {
    name: "Content",
    item: [
      make(
        "Search and filter",
        "GET",
        "/posts?q=React&status=published&content_type=article&page=1&limit=10&sort=newest",
      ),
      make("Read content", "GET", "/posts/{{postId}}"),
      make("Read by slug", "GET", "/posts/slug/getting-started-with-reactjs"),
      create,
      update,
      make("Version history", "GET", "/posts/{{postId}}/versions"),
      make(
        "Restore as draft",
        "POST",
        "/posts/{{postId}}/versions/{{versionId}}/restore",
        { revision: "{{revision}}" },
      ),
      make("Record a view", "POST", "/posts/{{postId}}/view"),
      make("Toggle a like", "POST", "/posts/{{postId}}/like"),
      make("Delete content permanently", "DELETE", "/posts/{{postId}}"),
    ],
  },
  {
    name: "Taxonomy",
    item: [
      make("List categories", "GET", "/categories"),
      make("Create category", "POST", "/categories", {
        name: "Learning strategies",
        description: "Resources for effective study.",
      }),
      make("Update category", "PUT", "/categories/{{categoryId}}", {
        name: "Learning strategies",
        description: "Resources for effective study.",
        parent_id: null,
        is_active: true,
        display_order: 1,
      }),
      make("Delete category", "DELETE", "/categories/{{categoryId}}"),
      make("List tags", "GET", "/tags"),
      make("Create tag", "POST", "/tags", { name: "Study tips" }),
      make("Update tag", "PUT", "/tags/{{tagId}}", {
        name: "Study strategies",
      }),
      make("Delete tag", "DELETE", "/tags/{{tagId}}"),
    ],
  },
  {
    name: "Comments",
    item: [
      make(
        "List pending comments",
        "GET",
        "/comments?status=pending&page=1&limit=10",
      ),
      make("Add comment", "POST", "/comments", {
        post_id: "{{postId}}",
        content: "Thank you for sharing this resource.",
      }),
      make("Edit comment", "PUT", "/comments/{{commentId}}", {
        content: "My updated question.",
      }),
      make("Moderate comment", "PATCH", "/comments/{{commentId}}/status", {
        status: "approved",
      }),
      make("Delete comment", "DELETE", "/comments/{{commentId}}"),
    ],
  },
  {
    name: "Media",
    item: [
      make("List media", "GET", "/media?page=1&limit=12"),
      {
        name: "Upload image or PDF",
        request: {
          method: "POST",
          url: "{{baseUrl}}/media",
          body: {
            mode: "formdata",
            formdata: [
              { key: "file", type: "file", src: "" },
              { key: "alt_text", type: "text", value: "Describe the image" },
              { key: "caption", type: "text", value: "A teaching resource" },
            ],
          },
        },
      },
      make("Edit media details", "PATCH", "/media/{{mediaId}}", {
        alt_text: "A helpful learning diagram",
        caption: "Learning in context",
      }),
      make("Delete media", "DELETE", "/media/{{mediaId}}"),
    ],
  },
  {
    name: "People",
    item: [
      make("List users", "GET", "/users?page=1&limit=10"),
      make("Read user", "GET", "/users/{{userId}}"),
      make("Create user", "POST", "/users", {
        username: "newauthor",
        email: "newauthor@example.edu",
        password: "ChooseYourPassword123!",
        role: "author",
        first_name: "New",
        last_name: "Author",
      }),
      make("Change user access", "PATCH", "/users/{{userId}}", {
        role: "author",
        is_active: true,
      }),
      make("Update own profile", "PATCH", "/users/me", {
        first_name: "Alex",
        last_name: "Morgan",
        bio: "Learning together.",
      }),
      make("Delete user", "DELETE", "/users/{{userId}}"),
    ],
  },
  {
    name: "Insights",
    item: [
      make("Health", "GET", "/health"),
      make("Dashboard analytics", "GET", "/analytics"),
      make("Workspace activity", "GET", "/analytics/activity?page=1&limit=20"),
    ],
  },
];
fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync(
  "docs/EduCMS.postman_collection.json",
  JSON.stringify(collection, null, 2) + "\n",
);
console.log(
  `Generated ${collection.item.reduce((n, group) => n + group.item.length, 0)} Postman requests.`,
);
