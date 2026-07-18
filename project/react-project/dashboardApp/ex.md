
## 🧩 Exercise: “Mini Dashboard UI”

### 🎯 Objective

Practice:

* Creating **multiple components**
* Organizing layout
* Applying **more advanced CSS styling**
* Reusing components (without props)

---

## 📝 Instructions

Build a small **dashboard page** with 3 components:

### 🔹 1. `Header`

* Displays:

  * App title: **"My Dashboard"**
* Style:

  * Dark background
  * White text
  * Centered

---

### 🔹 2. `Sidebar`

* Displays a vertical menu:

  * Home
  * Profile
  * Settings
* Style:

  * Fixed width (e.g., 200px)
  * Full height
  * Light background

---

### 🔹 3. `Content`

* Displays **3 cards**
* Each card contains:

  * A title (e.g., "Card 1")
  * A short description

⚠️ Important:
👉 No props → just hardcode the 3 cards

---

## 📁 Suggested Structure

```id="k40q3l"
src/
 ├── App.js
 ├── components/
 │    ├── Header.js
 │    ├── Sidebar.js
 │    ├── Content.js
 │    ├── Card.js
 │    ├── Header.css
 │    ├── Sidebar.css
 │    ├── Content.css
 │    ├── Card.css
```

---

## 🧱 Layout Requirement

In `App.js`, organize the layout like this:

```id="aqnlr7"
[ Header ]
[ Sidebar | Content ]
```

👉 Use **flexbox** for layout

---

## 🎨 Styling Requirements

* Use `display: flex` for layout
* Add spacing between cards
* Cards should have:

  * border
  * padding
  * slight shadow
* Add hover effect on cards (scale or color change)

---

## 💡 Expected UI Idea

```id="8u5a0x"
-----------------------------
|       My Dashboard        |
-----------------------------
| Sidebar |   Card 1        |
|         |   Card 2        |
|         |   Card 3        |
-----------------------------
```

---

## 🚀 Bonus Challenges 

1. Make the sidebar items highlight on hover
2. Add icons (just text icons like 🏠 ⚙️ 👤)
3. Center cards using flexbox or grid
4. Add different background colors for each card

