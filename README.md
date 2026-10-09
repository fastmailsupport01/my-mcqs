# My MCQs

Free PPSC test-preparation site — **PPSC-only** MCQs, past papers, exam simulator,
and community MCQ uploads (reviewed before going live).

- Live: https://my-mcqs.onrender.com
- Data: Supabase project `mcqs-tayyari` (shared) — PPSC-tagged + shared MCQs
- Uploads: `mcq_submissions` table (`status`: pending → approved → published)

## Approving uploaded MCQs (David — Supabase SQL Editor)

```sql
-- 1. Review pending submissions
select id, subject_slug, question, correct_option, submitter_name, created_at
from mcq_submissions where status = 'pending' order by created_at;

-- 2. Approve good ones (set your ids)
update mcq_submissions set status = 'approved' where id in (...);
-- or reject: update mcq_submissions set status = 'rejected' where id in (...);

-- 3. Publish approved (dedup: skips questions already in mcqs)
insert into mcqs (question, option_a, option_b, option_c, option_d,
                  correct_option, explanation, subject_slug, exam_body)
select s.question, s.option_a, s.option_b, s.option_c, s.option_d,
       s.correct_option, s.explanation, s.subject_slug, 'ppsc'
from mcq_submissions s
where s.status = 'approved'
  and not exists (
    select 1 from mcqs m
    where m.question = s.question
      and m.option_a = s.option_a and m.option_b = s.option_b
      and m.option_c = s.option_c and m.option_d = s.option_d
  );

update mcq_submissions set status = 'published' where status = 'approved';
```
