-- 添加思维导图数据字段到 note_contents 表
-- 执行此 SQL 来应用数据库迁移

ALTER TABLE note_contents ADD COLUMN mindmap_data JSON;

-- 如果需要回滚，执行以下 SQL：
-- ALTER TABLE note_contents DROP COLUMN mindmap_data;
