CREATE TABLE users (
 user_id SERIAL PRIMARY KEY, username VARCHAR(50) UNIQUE NOT NULL, email VARCHAR(100) UNIQUE NOT NULL,
 password_hash VARCHAR(255) NOT NULL, first_name VARCHAR(50), last_name VARCHAR(50),
 role VARCHAR(20) NOT NULL DEFAULT 'subscriber' CHECK(role IN ('admin','editor','author','subscriber')),
 bio TEXT, avatar VARCHAR(255), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 last_login TIMESTAMPTZ, is_active BOOLEAN NOT NULL DEFAULT true, email_verified BOOLEAN NOT NULL DEFAULT false,
 token_version INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE categories (
 category_id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, slug VARCHAR(100) UNIQUE NOT NULL, description TEXT,
 parent_id INTEGER REFERENCES categories(category_id) ON DELETE SET NULL,
 display_order INTEGER NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE posts (
 post_id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, slug VARCHAR(255) UNIQUE NOT NULL, content TEXT NOT NULL, excerpt TEXT,
 author_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL, category_id INTEGER REFERENCES categories(category_id) ON DELETE SET NULL,
 content_type VARCHAR(20) NOT NULL DEFAULT 'article' CHECK(content_type IN ('article','course','announcement','resource')),
 status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
 featured_image VARCHAR(255), view_count INTEGER NOT NULL DEFAULT 0, like_count INTEGER NOT NULL DEFAULT 0,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), published_at TIMESTAMPTZ,
 meta_title VARCHAR(255), meta_description TEXT, meta_keywords TEXT,
 is_featured BOOLEAN NOT NULL DEFAULT false, allow_comments BOOLEAN NOT NULL DEFAULT true, reading_time INTEGER,
 revision INTEGER NOT NULL DEFAULT 1,
 CONSTRAINT valid_published_date CHECK(status <> 'published' OR published_at IS NOT NULL)
);
CREATE TABLE tags (
 tag_id SERIAL PRIMARY KEY, name VARCHAR(50) UNIQUE NOT NULL, slug VARCHAR(50) UNIQUE NOT NULL, description TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE post_tags (
 post_id INTEGER REFERENCES posts(post_id) ON DELETE CASCADE, tag_id INTEGER REFERENCES tags(tag_id) ON DELETE CASCADE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY(post_id,tag_id)
);
CREATE TABLE comments (
 comment_id SERIAL PRIMARY KEY, post_id INTEGER NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
 user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL, parent_id INTEGER REFERENCES comments(comment_id) ON DELETE CASCADE,
 content TEXT NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','spam','trash')),
 ip_address VARCHAR(45), user_agent TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE media (
 media_id SERIAL PRIMARY KEY, filename VARCHAR(255) NOT NULL, original_name VARCHAR(255) NOT NULL, file_path VARCHAR(500) NOT NULL,
 file_type VARCHAR(50), file_size INTEGER, mime_type VARCHAR(100), uploaded_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
 alt_text VARCHAR(255), caption TEXT, width INTEGER, height INTEGER, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE activity_log (
 log_id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL, action VARCHAR(100) NOT NULL,
 entity_type VARCHAR(50), entity_id INTEGER, description TEXT, ip_address VARCHAR(45), user_agent TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE post_versions (
 version_id SERIAL PRIMARY KEY, post_id INTEGER NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
 revision INTEGER NOT NULL, snapshot JSONB NOT NULL, created_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(post_id,revision)
);
CREATE TABLE post_views (
 view_id BIGSERIAL PRIMARY KEY, post_id INTEGER NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE post_likes (
 post_id INTEGER REFERENCES posts(post_id) ON DELETE CASCADE, user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
 PRIMARY KEY(post_id,user_id)
);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_category ON posts(category_id);
CREATE INDEX idx_posts_status_published ON posts(status,published_at DESC);
CREATE INDEX idx_posts_type ON posts(content_type);
CREATE INDEX idx_posts_search ON posts USING GIN(to_tsvector('english',title || ' ' || COALESCE(excerpt,'') || ' ' || content));
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_comments_post_status ON comments(post_id,status);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_post_tags_tag ON post_tags(tag_id);
CREATE INDEX idx_media_uploaded ON media(uploaded_by);
CREATE INDEX idx_activity_created ON activity_log(created_at DESC);
CREATE INDEX idx_activity_entity ON activity_log(entity_type,entity_id);
CREATE INDEX idx_post_views_created ON post_views(created_at,post_id);
CREATE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE VIEW post_statistics AS
SELECT p.post_id,p.title,p.status,p.view_count,p.like_count,
 (SELECT COUNT(*) FROM comments c WHERE c.post_id=p.post_id AND c.status='approved') AS comment_count,
 (SELECT COUNT(*) FROM post_tags pt WHERE pt.post_id=p.post_id) AS tag_count,u.username AS author
FROM posts p LEFT JOIN users u ON u.user_id=p.author_id;
CREATE VIEW user_statistics AS
SELECT u.user_id,u.username,u.role,
 (SELECT COUNT(*) FROM posts p WHERE p.author_id=u.user_id) AS total_posts,
 (SELECT COUNT(*) FROM posts p WHERE p.author_id=u.user_id AND p.status='published') AS published_posts,
 (SELECT COUNT(*) FROM comments c WHERE c.user_id=u.user_id) AS total_comments,
 COALESCE((SELECT SUM(p.view_count) FROM posts p WHERE p.author_id=u.user_id),0) AS total_views
FROM users u;
CREATE FUNCTION get_category_post_count(cat_id INTEGER) RETURNS INTEGER AS $$
 SELECT COUNT(*)::INTEGER FROM posts WHERE category_id=cat_id AND status='published';
$$ LANGUAGE sql STABLE;
CREATE FUNCTION calculate_reading_time(content TEXT) RETURNS INTEGER AS $$
 SELECT GREATEST(1,CEIL(array_length(regexp_split_to_array(regexp_replace(content,'<[^>]+>','','g'),'\s+'),1)::NUMERIC / 200)::INTEGER);
$$ LANGUAGE sql IMMUTABLE;
