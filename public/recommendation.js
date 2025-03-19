document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    let data = decodeURIComponent(urlParams.get("data"));

    // Retrieve data from localStorage if URL parameter is null
    if (!data || data === "null") {
        const storedData = localStorage.getItem("pcBuilderData");
        if (storedData) {
            data = storedData;
        }
    }

    // Replace ** with <strong> tags for bold text
    data = data.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    const recommendationsDiv = document.getElementById("recommendations");
    recommendationsDiv.innerHTML = `<pre>${data}</pre>`;
});
