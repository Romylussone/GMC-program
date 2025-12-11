// EXERCISE 1 — Student Management System

// Initial Data Structure
var students = [];

// Helper: compute average of a grades array using a for loop
function averageOf(grades) {
    if (!grades || grades.length === 0) return 0;
    var sum = 0;
    for (var i = 0; i < grades.length; i++) {
        sum += grades[i];
    }
    return sum / grades.length;
}

// 1. addStudent(name, age)
function addStudent(name, age) {

    for (var i = 0; i < students.length; i++) {
        if (students[i].name === name) {
            console.log("Student with this name already exists.");
            return false;
        }
    }

    students.push({
        name: String(name),
        age: Number(age),
        grades: []
    });
    return true;
}

// 2. addGrade(studentName, grade) — must use for loop (no .find)
function addGrade(studentName, grade) {
    var g = Number(grade);
    if (!isFinite(g)) return false;

    for (var i = 0; i < students.length; i++) {
        if (students[i].name === studentName) {
            students[i].grades.push(g);
            return true;
        }
    }
    return false; // student not found
}

// 3. getAverageGrade(studentName)
function getAverageGrade(studentName) {
    for (var i = 0; i < students.length; i++) {
        if (students[i].name === studentName) {
            return averageOf(students[i].grades);
        }
    }
    return null; // student not found
}

// 4. getTopStudent()
function getTopStudent() {
    if (students.length === 0) return null;

    var bestStudent = null;
    var bestAvg = -Infinity;

    for (var i = 0; i < students.length; i++) {
        var s = students[i];
        var avg = averageOf(s.grades);
        if (avg > bestAvg) {
            bestAvg = avg;
            bestStudent = s;
        }
    }

    return bestStudent;
}

// 5. removeStudent(studentName) — use for + splice
function removeStudent(studentName) {
    for (var i = 0; i < students.length; i++) {
        if (students[i].name === studentName) {
            students.splice(i, 1);
            return true;
        }
    }
    return false; // not found
}

// 6. printStudents()
function printStudents() {
    for (var i = 0; i < students.length; i++) {
        var s = students[i];
        var gradesStr = s.grades.join(", ");
        var avg = averageOf(s.grades).toFixed(2);
        console.log(
            "Name: " + s.name +
            " | Age: " + s.age +
            " | Grades: " + gradesStr +
            " | Average: " + avg
        );
    }
}