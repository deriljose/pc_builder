document.addEventListener("DOMContentLoaded", () => {
    const budgetSlider = document.getElementById("budget");
    const budgetValue = document.getElementById("budgetValue");
    budgetValue.textContent = `₹${budgetSlider.value}`;

    // Store data in localStorage before redirecting
    const form = document.getElementById("pcBuilderForm");
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const data = {
            budget: formData.get("budget"),
            useCase: formData.get("useCase"),
            cpuBrand: formData.get("cpuBrand"),
            gpuBrand: formData.get("gpuBrand"),
        };
        localStorage.setItem("pcBuilderData", JSON.stringify(data));
        form.submit();
    });

    const urlParams = new URLSearchParams(window.location.search);
    let data = decodeURIComponent(urlParams.get("data"));

    // Replace ** with <strong> tags for bold text
    data = data.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    const recommendationsDiv = document.getElementById("recommendations");
    recommendationsDiv.innerHTML = `<pre>${data}</pre>`;
});
