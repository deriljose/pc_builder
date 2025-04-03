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
