-- University Information System (normalized to Third Normal Form)
-- Dialect: SQLite-compatible SQL.  Enable FK enforcement for this session.
PRAGMA foreign_keys = ON;

-- A student stores facts about one student only.  Email is a candidate key.
CREATE TABLE students (
    student_id   INTEGER PRIMARY KEY,
    full_name    TEXT NOT NULL,
    email        TEXT NOT NULL UNIQUE,
    age          INTEGER NOT NULL CHECK (age > 17)
);

-- An instructor stores facts about one instructor only.
CREATE TABLE instructors (
    instructor_id INTEGER PRIMARY KEY,
    full_name     TEXT NOT NULL,
    department    TEXT NOT NULL
);

-- Each course is taught by one instructor.  Instructor details are not
-- repeated here; instructor_id is a foreign key to instructors.
CREATE TABLE courses (
    course_id     INTEGER PRIMARY KEY,
    title         TEXT NOT NULL UNIQUE,
    credits       INTEGER NOT NULL CHECK (credits BETWEEN 1 AND 6),
    instructor_id INTEGER NOT NULL,
    FOREIGN KEY (instructor_id)
        REFERENCES instructors (instructor_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- The composite key permits a student to enroll in a given course once.
-- Grade may remain NULL until it has been assigned.
CREATE TABLE enrollments (
    student_id INTEGER NOT NULL,
    course_id  INTEGER NOT NULL,
    grade      TEXT CHECK (grade IN ('A', 'B', 'C', 'D', 'F') OR grade IS NULL),
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id)
        REFERENCES students (student_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    FOREIGN KEY (course_id)
        REFERENCES courses (course_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- Sample data: four students are included so the "not enrolled" query has a result.
INSERT INTO instructors (instructor_id, full_name, department) VALUES
    (1, 'Dr. Ada Lovelace', 'Computer Science'),
    (2, 'Dr. Grace Hopper', 'Computer Science'),
    (3, 'Dr. Katherine Johnson', 'Mathematics');

INSERT INTO students (student_id, full_name, email, age) VALUES
    (101, 'Alice Martin', 'alice.martin@university.edu', 19),
    (102, 'Brian Chen', 'brian.chen@university.edu', 20),
    (103, 'Carla Gomez', 'carla.gomez@university.edu', 18),
    (104, 'David Okafor', 'david.okafor@university.edu', 21);

INSERT INTO courses (course_id, title, credits, instructor_id) VALUES
    (201, 'Database Systems', 3, 1),
    (202, 'Operating Systems', 4, 2),
    (203, 'Discrete Mathematics', 3, 3);

INSERT INTO enrollments (student_id, course_id, grade) VALUES
    (101, 201, 'A'),
    (101, 202, 'B'),
    (102, 201, 'B'),
    (103, 203, NULL);

-- 1. All students enrolled in "Database Systems".
SELECT s.student_id, s.full_name, s.email, s.age
FROM students AS s
JOIN enrollments AS e ON e.student_id = s.student_id
JOIN courses AS c ON c.course_id = e.course_id
WHERE c.title = 'Database Systems';

-- 2. Each course and its instructor.
SELECT c.course_id, c.title, c.credits, i.full_name AS instructor_name
FROM courses AS c
JOIN instructors AS i ON i.instructor_id = c.instructor_id
ORDER BY c.course_id;

-- 3. Students without an enrollment.
SELECT s.student_id, s.full_name, s.email
FROM students AS s
WHERE NOT EXISTS (
    SELECT 1
    FROM enrollments AS e
    WHERE e.student_id = s.student_id
);

-- 4. Update one student's email.
UPDATE students
SET email = 'alice.martin1@university.edu'
WHERE student_id = 101;

-- 5. Delete a course by ID.  Related enrollment rows are removed by ON DELETE CASCADE.
DELETE FROM courses
WHERE course_id = 203;
