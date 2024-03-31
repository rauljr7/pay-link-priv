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
    notification.className = `modal-content fade-in notification ${type}`;
    notification.style.backgroundColor = typeToColor[type] || "lightbeige";
    notification.innerHTML = options.x ? `${message} <span class="close">&times;</span>` : message;

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
            notification.style.display = 'none';
        });
    }

    // Auto-remove after 5 seconds if not persistent
    if (!options.persist) {
        setTimeout(() => {
            notification.remove();
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
    adjustMargin(); // Initial adjustment
}

document.onclick = function(event) {
    // Check if the clicked element has the "modal" class
    if (event.target.id = "modal-overlay") {
        event.target.style.display = "none"; // Hide the modal directly if clicked on the overlay
    } else {
        // Check if the click is inside a modal-content to avoid closing when clicking inside the modal
        let isClickInsideModalContent = event.target.closest(".modal-content");
        if (!isClickInsideModalContent) {
            // Find all modals
            let modals = document.querySelectorAll('.modal');
            modals.forEach(function(modal) {
                // Check if the event target is inside this modal but not inside modal-content
                if (modal.contains(event.target) && !modal.querySelector('.modal-content').contains(event.target)) {
                    modal.style.display = 'none'; // Hide the modal
                }
            });
        }
    }
};
