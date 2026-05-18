var form = document.querySelector("#registerForm");
var submitBtn = form.querySelector("button[type='submit']");

// Validation functions
function validateUsername(username) {
    return username.trim().length >= 3 && !username.includes(" ");
}

function validateEmail(email) {
    return email.includes("@") && email.includes(".");
}

function validatePassword(password) {
    var hasNumber = /\d/.test(password);
    return password.length >= 6 && hasNumber;
}

function getPasswordStrength(password) {
    if (password.length < 6) return "Weak";
    if (password.length >= 6 && password.length < 10) return "Medium";
    return "Strong";
}

function showError(input, message) {
    var errorElement = input.nextElementSibling;
    errorElement.textContent = message;
    input.classList.add("error-border");
    input.classList.remove("success-border");
}

function clearError(input) {
    var errorElement = input.nextElementSibling;
    errorElement.textContent = "";
    input.classList.remove("error-border");
    input.classList.add("success-border");
}

function isFormValid() {
    var isUsernameValid = validateUsername(form.username.value);
    var isEmailValid = validateEmail(form.email.value);
    var isPasswordValid = validatePassword(form.password.value);
    return isUsernameValid && isEmailValid && isPasswordValid;
}

function updateSubmitButton() {
    if (isFormValid()) {
        submitBtn.disabled = false;
    } else {
        submitBtn.disabled = true;
    }
}

// Username validation
form.username.addEventListener("input", function(event) {
    var username = event.target.value;
    
    if (username.trim().length < 3) {
        showError(event.target, "Username must be at least 3 characters");
    } else if (username.includes(" ")) {
        showError(event.target, "Username cannot contain spaces");
    } else {
        clearError(event.target);
    }
    
    updateSubmitButton();
});

// Email validation
form.email.addEventListener("input", function(event) {
    var email = event.target.value;
    
    if (!email.includes("@") || !email.includes(".")) {
        showError(event.target, "Email must contain @ and .");
    } else {
        clearError(event.target);
    }
    
    updateSubmitButton();
});

// Password validation
form.password.addEventListener("input", function(event) {
    var password = event.target.value;
    var errorElement = event.target.nextElementSibling;
    var strengthElement = document.querySelector(".password-strength");
    
    if (password.length < 6) {
        showError(event.target, "Password must be at least 6 characters");
    } else if (!/\d/.test(password)) {
        showError(event.target, "Password must contain at least one number");
    } else {
        clearError(event.target);
    }
    
    // Show password strength if strength element exists
    if (strengthElement) {
        strengthElement.textContent = "Strength: " + getPasswordStrength(password);
    }
    
    updateSubmitButton();
});

// Form submit
form.addEventListener("submit", function(event) {
    event.preventDefault();
    
    if (isFormValid()) {
        alert("Registration successful");
    }
});
