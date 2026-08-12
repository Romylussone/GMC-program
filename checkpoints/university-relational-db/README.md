# University Information System

This project models a university information system using a normalized relational database schema. The complete table definitions, sample data, and required queries are in `university_information_system.sql`.

## Schema Design

The design is in Third Normal Form (3NF): each table represents one entity, non-key fields describe only that table's key, and relationships are stored through foreign keys rather than duplicated data.

### Students

| Column | Type | Rules | Description |
| --- | --- | --- | --- |
| `student_id` | INTEGER | Primary key | Unique student identifier |
| `full_name` | TEXT | NOT NULL | Student's name |
| `email` | TEXT | NOT NULL, UNIQUE | Student's email address |
| `age` | INTEGER | NOT NULL, CHECK (`age > 17`) | Student's age |

### Instructors

| Column | Type | Rules | Description |
| --- | --- | --- | --- |
| `instructor_id` | INTEGER | Primary key | Unique instructor identifier |
| `full_name` | TEXT | NOT NULL | Instructor's name |
| `department` | TEXT | NOT NULL | Instructor's department |

### Courses

| Column | Type | Rules | Description |
| --- | --- | --- | --- |
| `course_id` | INTEGER | Primary key | Unique course identifier |
| `title` | TEXT | NOT NULL, UNIQUE | Course title |
| `credits` | INTEGER | NOT NULL, CHECK (`credits BETWEEN 1 AND 6`) | Course credit value |
| `instructor_id` | INTEGER | NOT NULL, foreign key | Instructor assigned to the course |

`courses.instructor_id` references `instructors.instructor_id`. An instructor may teach many courses, while each course has one instructor.

### Enrollments

| Column | Type | Rules | Description |
| --- | --- | --- | --- |
| `student_id` | INTEGER | Primary key, foreign key | Enrolled student |
| `course_id` | INTEGER | Primary key, foreign key | Course taken by the student |
| `grade` | TEXT | CHECK (`A`, `B`, `C`, `D`, `F`, or NULL) | Final grade, when assigned |

The composite primary key (`student_id`, `course_id`) prevents duplicate enrollment in the same course. This table resolves the many-to-many relationship between students and courses:

```text
Students 1 ---< Enrollments >--- 1 Courses
Instructors 1 ---< Courses
```

Deleting a student or course also deletes its related enrollment records. An instructor cannot be deleted while assigned to a course.

## Running the Script

Run `university_information_system.sql` with a SQLite-compatible SQL client. The script enables foreign-key enforcement, creates the schema, inserts sample data, and executes the requested queries.
