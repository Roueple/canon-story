-- Add full-text search indexes for better performance
CREATE INDEX idx_novels_title_gin ON "Novel" USING gin(to_tsvector('english', title));
CREATE INDEX idx_novels_description_gin ON "Novel" USING gin(to_tsvector('english', description));
CREATE INDEX idx_novels_author_gin ON "Novel" USING gin(to_tsvector('english', author));

CREATE INDEX idx_chapters_title_gin ON "Chapter" USING gin(to_tsvector('english', title));
CREATE INDEX idx_chapters_content_gin ON "Chapter" USING gin(to_tsvector('english', content));

-- Add composite indexes for common queries
CREATE INDEX idx_novels_published_deleted ON "Novel" ("isPublished", "isDeleted");
CREATE INDEX idx_chapters_novel_published ON "Chapter" ("novelId", "isPublished", "isDeleted");

-- Add indexes for trending calculations
CREATE INDEX idx_chapter_views_date ON "ChapterView" ("viewedAt");
CREATE INDEX idx_comments_novel_date ON "Comment" ("novelId", "createdAt");
CREATE INDEX idx_ratings_novel_date ON "Rating" ("novelId", "createdAt");