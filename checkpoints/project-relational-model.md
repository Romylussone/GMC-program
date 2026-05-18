## Relational Diagram (Final Tables)

    Hotel(
        Hotel_Id PK,
        Hotel_name,
        Type_Id FK
    )

    Type(
        Type_Id PK,
        Type_Name
    )

    Room(
        Room_Id PK,
        Floor,
        Hotel_Id FK,
        Category_Id FK
    )

    Category(
        Category_Id PK,
        Category_Name,
        Price,
        Beds_numbers
    )

    Employee(
        Employee_Id PK,
        Employee_Name,
        Employee_Speciality,
        Hotel_Id FK,
        Leader_Id FK
    )
