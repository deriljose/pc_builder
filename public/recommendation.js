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

    // Split the data into individual lists based on "Total Estimated Cost:"
    const lists = data.split("**Total Estimated Cost:**");

    lists.forEach((list, index) => {
        if (list.trim()) {
            const card = document.createElement("div");
            card.className = "card";

            // Add title for each PC build
            const cardTitle = document.createElement("h2");
            cardTitle.textContent = `PC Build ${index + 1}`;
            card.appendChild(cardTitle);

            // Add the list content
            const listContent = document.createElement("pre");
            listContent.innerHTML =
                list.trim() + "<strong>Total Estimated Cost:</strong>";
            card.appendChild(listContent);

            // Append the created card to the recommendationsDiv
            recommendationsDiv.appendChild(card);
        }
    });
});
