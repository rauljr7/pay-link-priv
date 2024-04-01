function send_notification({type = "default", message = "", template = "", options = {x: false, persist: false, overlay: false}}) {
    // Pre-defined template messages and types
    const templates = {
        "try_again": {message: "Oops! Please try again.", type: "default"},
        "generic_error": {message: "An error occurred.", type: "alert"},
        "payment_error": {message: "There was an error with the payment.", type: "alert"},
        "success": {message: "Success!", type: "success"}
    };

    // Determine the message and type based on the template if provided
    if (template && templates[template]) {
        message = templates[template].message;
        type = templates[template].type;
    }

    // Map type to colors
    const typeToColor = {
        "warning": "orange",
        "warn": "orange",
        "alert": "#e87474",
        "success": "green",
        "info": "yellow",
        "default": "#feffef"
    };

    // Create the notification element
    const notification = document.createElement("div");
    notification.className = `modal-content notification-modal fade-in notification ${type}`;
    notification.style.backgroundColor = typeToColor[type] || "#feffef";
    notification.innerHTML = options.x ? `${message} <span class="close"><i class="fab fa-times-circle fa-lg"></i></span>` : message;

    // Apply styles for notification positioning
    notification.style.position = "fixed";
    notification.style.top = "10px";
    notification.style.right = "10px";
    notification.style.zIndex = 600; // Ensure it's on top
    notification.style.margin = "1rem";
    notification.style.padding = "1rem";
    notification.style.maxWidth = "300px";
    notification.style.border = "1px solid #888";

    // Add animation for "fly in" effect
    notification.style.animation = "flyIn .5s ease-out";
    document.body.appendChild(notification);

    // Close button functionality
    if (options.x) {
        const closeBtn = notification.querySelector('.close');
        closeBtn.addEventListener('click', function() {
            notification.remove();
            document.querySelector("#modal-overlay").style.display = "none";
        });
    }

    if (!options.persist) {
        setTimeout(() => {
            if (notification) {
                notification.remove();
                document.querySelector("#modal-overlay").style.display = "none";
            }
        }, 5000);
    }

    // Overlay
    if (options.overlay) {
        document.getElementById("modal-overlay").style.display = "block";
    }

    // Adjust margins for different screen sizes
    const adjustMargin = () => {
        const screenWidth = window.innerWidth;
        if (screenWidth > 768) { // Desktop
            notification.style.margin = "2rem";
        } else { // Mobile
            notification.style.margin = "1rem";
        }
    };

    window.addEventListener('resize', adjustMargin);
    adjustMargin();
}

document.onclick = function(event) {
    if (event.target.id === "modal-overlay") {
        event.target.style.display = "none";
    }
    if (event.target.classList.contains("modal")) {
        event.target.style.display = "none";
    }
    document.querySelectorAll(".notification-modal").forEach((element) => {
        element.remove();
    })
};
