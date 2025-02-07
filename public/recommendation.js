document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const data = decodeURIComponent(urlParams.get("data"));

    const recommendationsDiv = document.getElementById("recommendations");
    recommendationsDiv.innerHTML = `<pre>${data}</pre>`;
});
