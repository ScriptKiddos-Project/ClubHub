-- Phase 5: Materialized Views for Analytics
-- Run this migration manually after the standard Prisma migrations

-- ─── Club Analytics Materialized View ───────────────────────────────────────
CREATE MATERIALIZED VIEW IF NOT EXISTS club_analytics_mv AS
SELECT
  c.id                                            AS club_id,
  c.name                                          AS club_name,
  c.member_count,
  COUNT(DISTINCT e.id)                            AS total_events,
  COUNT(DISTINCT er.id)                           AS total_registrations,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'Present') AS total_attended,
  CASE
    WHEN COUNT(DISTINCT er.id) = 0 THEN 0
    ELSE ROUND(
      COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'Present')::NUMERIC
      / COUNT(DISTINCT er.id) * 100, 2
    )
  END                                             AS engagement_rate,
  AVG(f.rating)                                   AS avg_feedback_score
FROM clubs c
LEFT JOIN events e       ON e.club_id = c.id
LEFT JOIN event_registrations er ON er.event_id = e.id
LEFT JOIN attendances a  ON a.event_id = e.id AND a.user_id = er.user_id
LEFT JOIN feedbacks f    ON f.event_id = e.id
GROUP BY c.id, c.name, c.member_count;

CREATE UNIQUE INDEX IF NOT EXISTS club_analytics_mv_idx ON club_analytics_mv (club_id);

-- ─── Campus Trends Materialized View ────────────────────────────────────────
CREATE MATERIALIZED VIEW IF NOT EXISTS campus_trends_mv AS
SELECT
  -- Most popular club this month
  (
    SELECT c.id FROM clubs c
    JOIN user_clubs uc ON uc.club_id = c.id
    WHERE uc.created_at >= date_trunc('month', NOW())
    GROUP BY c.id
    ORDER BY COUNT(*) DESC
    LIMIT 1
  ) AS popular_club_id,

  -- Total active users this month
  (
    SELECT COUNT(DISTINCT user_id)
    FROM attendances
    WHERE created_at >= date_trunc('month', NOW())
  ) AS monthly_active_users,

  NOW() AS refreshed_at;

CREATE UNIQUE INDEX IF NOT EXISTS campus_trends_mv_idx ON campus_trends_mv ((refreshed_at IS NOT NULL));