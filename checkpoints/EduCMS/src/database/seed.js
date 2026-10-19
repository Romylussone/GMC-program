const bcrypt = require("bcryptjs");
const db = require("../config/database");
const { generateSlug, calculateReadingTime } = require("../utils/helpers");
async function seed() {
  if (process.env.NODE_ENV === "production")
    throw new Error("Development seed is disabled in production.");
  const password = process.env.SEED_PASSWORD;
  if (!password || password.length < 10)
    throw new Error("Set SEED_PASSWORD to at least 10 characters.");
  const hash = await bcrypt.hash(password, 12);
  await db.transaction(async (client) => {
    for (const [role, first, last] of [
      ["admin", "Alex", "Morgan"],
      ["editor", "Sarah", "Chen"],
      ["author", "James", "Wilson"],
      ["subscriber", "Taylor", "Reed"],
    ]) {
      await client.query(
        "INSERT INTO users(username,email,password_hash,first_name,last_name,role,email_verified) VALUES($1,$2,$3,$4,$5,$1,true) ON CONFLICT DO NOTHING",
        [role, `${role}@educms.com`, hash, first, last],
      );
    }
    const categories = [
      "Computer Science",
      "Programming",
      "Web Development",
      "Data Science",
      "Artificial Intelligence",
    ];
    for (let i = 0; i < categories.length; i++)
      await client.query(
        "INSERT INTO categories(name,slug,description,display_order) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING",
        [
          categories[i],
          generateSlug(categories[i]),
          `Explore ${categories[i].toLowerCase()} with curated educational resources.`,
          i + 1,
        ],
      );
    for (const tag of [
      "JavaScript",
      "Python",
      "React",
      "Node.js",
      "Machine Learning",
      "Tutorial",
      "Beginner",
      "Advanced",
    ])
      await client.query(
        "INSERT INTO tags(name,slug) VALUES($1,$2) ON CONFLICT DO NOTHING",
        [tag, generateSlug(tag)],
      );
    const author = (
      await client.query("SELECT user_id FROM users WHERE username='author'")
    ).rows[0].user_id;
    const samples = [
      [
        "Getting Started with React.js",
        "Web Development",
        "article",
        "published",
        "Build your first component and discover a new way to create interactive interfaces.",
      ],
      [
        "Python for Data Science",
        "Data Science",
        "course",
        "published",
        "A practical learning path from Python fundamentals to your first data analysis.",
      ],
      [
        "Welcome to the new semester",
        "Computer Science",
        "announcement",
        "published",
        "Everything you need to know for a confident start to the new academic year.",
      ],
      [
        "The student developer toolkit",
        "Programming",
        "resource",
        "published",
        "Essential tools, references, and study resources for your programming journey.",
      ],
      [
        "Understanding neural networks",
        "Artificial Intelligence",
        "article",
        "draft",
        "A visual introduction to the building blocks of modern machine learning.",
      ],
      [
        "Modern JavaScript essentials",
        "Programming",
        "course",
        "draft",
        "Explore the language features that make everyday development simpler.",
      ],
    ];
    for (const [title, category, type, status, excerpt] of samples) {
      const content = `<h2>${title}</h2><p>${excerpt}</p><h3>What you will learn</h3><p>Start with the fundamentals, work through practical examples, and put your knowledge into practice. This resource is designed to support self-paced learning and classroom discussion.</p><h3>Try it yourself</h3><p>Create a small project, record what you discover, and share your questions with your classmates. Your next step is to turn these ideas into something you can use.</p>`;
      const cat = (
        await client.query("SELECT category_id FROM categories WHERE name=$1", [
          category,
        ])
      ).rows[0].category_id;
      const result = await client.query(
        "INSERT INTO posts(title,slug,content,excerpt,author_id,category_id,content_type,status,published_at,is_featured,reading_time,meta_title,meta_description) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$11,$9,$10,$1,$4) ON CONFLICT DO NOTHING RETURNING *",
        [
          title,
          generateSlug(title),
          content,
          excerpt,
          author,
          cat,
          type,
          status,
          type === "article",
          calculateReadingTime(content),
          status === "published" ? new Date() : null,
        ],
      );
      if (result.rowCount) {
        const post = result.rows[0];
        await client.query(
          "INSERT INTO post_versions(post_id,revision,snapshot,created_by) VALUES($1,1,$2,$3)",
          [post.post_id, JSON.stringify({ ...post, tag_ids: [] }), author],
        );
      }
    }
  });
  console.log(
    "Development seed ready. Accounts: admin/editor/author/subscriber@educms.com. Password: your SEED_PASSWORD.",
  );
}
if (require.main === module)
  seed()
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    })
    .finally(() => db.pool.end());
module.exports = seed;
