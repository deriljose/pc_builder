document.addEventListener("DOMContentLoaded", () => {
    const storedData = localStorage.getItem("pcBuilderData");
    if (storedData) {
        const data = storedData;
        const cpuMatch = data.match(/\*\*CPU\*\*:\s*(.*?)\s*-/);
        const gpuMatch = data.match(/\*\*GPU\*\*:\s*(.*?)\s*-/);

        if (cpuMatch && gpuMatch) {
            const cpu = cpuMatch[1];
            const gpu = gpuMatch[1];

            // Send CPU and GPU to the server for bottleneck calculation
            fetch("/calculate-bottleneck", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ cpu, gpu }),
            })
                .then((response) => response.json())
                .then((result) => {
                    const bottleneckPercentage = result.bottleneckPercentage;

                    const bottleneckResultDiv =
                        document.getElementById("bottleneckResult");
                    bottleneckResultDiv.innerHTML = `
                        <p><strong>CPU:</strong> ${cpu}</p>
                        <p><strong>GPU:</strong> ${gpu}</p>
                        <p><strong>Bottleneck Percentage:</strong> ${bottleneckPercentage}%</p>
                    `;
                })
                .catch((error) => {
                    console.error("Error calculating bottleneck:", error);
                    document.getElementById("bottleneckResult").innerHTML =
                        "<p>Error calculating bottleneck. Please try again later.</p>";
                });
        } else {
            document.getElementById("bottleneckResult").innerHTML =
                "<p>Invalid data format. Please generate a PC part list first.</p>";
        }
    } else {
        document.getElementById("bottleneckResult").innerHTML =
            "<p>No data available. Please generate a PC part list first.</p>";
    }
});
