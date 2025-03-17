document.addEventListener("DOMContentLoaded", function () {
    const formTitle = document.getElementById("form-title");
    const authForm = document.getElementById("auth-form");
    const toggleLink = document.getElementById("toggle-link");
    const submitBtn = authForm.querySelector(".cta-btn");

    let isLogin = true;

    toggleLink.addEventListener("click", function () {
        isLogin = !isLogin;

        if (isLogin) {
            formTitle.textContent = "Login";
            submitBtn.textContent = "Login";
            toggleLink.innerHTML = "Sign Up";
        } else {
            formTitle.textContent = "Sign Up";
            submitBtn.textContent = "Sign Up";
            toggleLink.innerHTML = "Login";
        }
    });
});

function handleCredentialResponse(response) {
    const data = jwt_decode(response.credential);
    console.log("ID: " + data.sub);
    console.log("Full Name: " + data.name);
    console.log("Given Name: " + data.given_name);
    console.log("Family Name: " + data.family_name);
    console.log("Image URL: " + data.picture);
    console.log("Email: " + data.email);

    // Store user data in localStorage
    localStorage.setItem("userData", JSON.stringify(data));

    // Redirect to index.html after successful login
    window.location.href = "index.html";
}
