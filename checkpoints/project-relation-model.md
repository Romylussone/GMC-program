1- Relational Schema (Database Tables)
GYMNASIUM(
GymID PK,
Name,
Address,
TelephoneNumber
)

MEMBER(
MemberID PK,
LastName,
FirstName,
Address,
DateOfBirth,
Gender,
GymID FK → GYMNASIUM(GymID)
)

SESSION(
SessionID PK,
SportType,
Schedule,
MaxCapacity
)

COACH(
CoachID PK,
LastName,
FirstName,
Age,
Specialty
)

ENROLLMENT(
MemberID PK, FK → MEMBER(MemberID),
SessionID PK, FK → SESSION(SessionID)
)

SESSION_COACH(
SessionID PK, FK → SESSION(SessionID),
CoachID PK, FK → COACH(CoachID)
)

2- Proper ER Diagram
This version respects entities, primary keys, relationships, and cardinalities.
erDiagram
GYMNASIUM {
int GymID PK
string Name
string Address
string TelephoneNumber
}

    MEMBER {
        int MemberID PK
        string LastName
        string FirstName
        string Address
        date DateOfBirth
        string Gender
        int GymID FK
    }

    SESSION {
        int SessionID PK
        string SportType
        datetime Schedule
        int MaxCapacity
    }

    COACH {
        int CoachID PK
        string LastName
        string FirstName
        int Age
        string Specialty
    }

    ENROLLMENT {
        int MemberID PK, FK
        int SessionID PK, FK
    }

    SESSION_COACH {
        int SessionID PK, FK
        int CoachID PK, FK
    }

    GYMNASIUM ||--o{ MEMBER : registers
    MEMBER ||--o{ ENROLLMENT : enrolls
    SESSION ||--o{ ENROLLMENT : contains
    SESSION ||--o{ SESSION_COACH : led_by
    COACH ||--o{ SESSION_COACH : leads
