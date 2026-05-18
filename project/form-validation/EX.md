## ✅ Requirements

### 1️⃣ Real-Time Validation

Validate **while typing** (`input` event):

#### Username

* Minimum **3 characters**
* No spaces allowed

#### Email

* Must contain `@` and `.`

#### Password

* Minimum **6 characters**
* Must contain **at least one number**

---

### 2️⃣ Error Handling (DOM Only)

* Show error message inside the `<small class="error">`
* Error text color: **red**
* If valid:

  * Clear error message
  * Add green border to input
* If invalid:

  * Add red border

---

### 3️⃣ Form Submit

* On submit:

  * Prevent default behavior
  * If **any field is invalid** → do nothing
  * If all fields are valid:

    * Show alert: `"Registration successful"`

---

### 4️⃣ DOM Rules (Important)

You must use:

* `querySelector`
* `addEventListener`
* `nextElementSibling`
* `classList`
* `event.target`
* `preventDefault()`

---

### 5️⃣ Bonus (Optional +2)

* Disable submit button until form is valid
* Show password strength:

  * Weak / Medium / Strong (DOM text)

---

## 🧪 What This Tests

✔ DOM traversal
✔ Events (`input`, `submit`)
✔ Form handling
✔ Real-time UI updates
✔ Clean validation logic

---
