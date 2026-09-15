-- TeachConnect Seed Data
-- Taxonomy and Initial Reference Data

-- 1. Insert Core Subjects
INSERT INTO public.subjects (name, category) VALUES
('Mathematics', 'STEM'),
('Physics', 'STEM'),
('Chemistry', 'STEM'),
('Biology', 'STEM'),
('Computer Science', 'STEM'),
('English Language', 'Languages'),
('English Literature', 'Languages'),
('Urdu', 'Languages'),
('Sindhi', 'Languages'),
('Arabic', 'Languages'),
('Islamiat', 'Humanities'),
('Pakistan Studies', 'Humanities'),
('General Science', 'STEM'),
('Social Studies', 'Humanities'),
('Commerce', 'Business'),
('Accounting', 'Business'),
('Economics', 'Business'),
('Art & Design', 'Arts')
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Classes (Grade Levels)
INSERT INTO public.classes (name, level_order) VALUES
('Primary (Class 1-5)', 1),
('Middle (Class 6-8)', 2),
('Secondary (Class 9-10 / Matric)', 3),
('Higher Secondary (Class 11-12 / Inter)', 4),
('O-Level', 5),
('A-Level', 6)
ON CONFLICT (name) DO NOTHING;

-- 3. Insert Teaching Skills
INSERT INTO public.skills (name) VALUES
('Classroom Management'),
('Lesson Planning'),
('Student Assessment'),
('Board Exam Preparation'),
('Activity-Based Learning'),
('Online Teaching Tools'),
('Concept Building'),
('Differentiated Instruction'),
('Curriculum Design'),
('Lab Supervision')
ON CONFLICT (name) DO NOTHING;
