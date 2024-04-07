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
    const type_to_color = {
        "warning": "orange",
        "warn": "orange",
        "alert": "#e87474",
        "success": "green",
        "info": "#c6c906",
        "default": "#a5a5a5"
    };

    // Create the notification element
    const notification = document.createElement("div");
    notification.className = `modal-content notification-modal fade-in notification ${type}`;
    notification.style.backgroundColor = type_to_color[type] || "#a5a5a5";
    notification.innerHTML = options.x ? `${message} <span class="close"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><title>c-remove</title><g fill="#F7F7F7"><path d="M8,0C3.6,0,0,3.6,0,8s3.6,8,8,8,8-3.6,8-8S12.4,0,8,0Zm3.182,9.768c.195,.195,.195,.512,0,.707l-.707,.707c-.195,.195-.512,.195-.707,0l-1.768-1.768-1.768,1.768c-.195,.195-.512,.195-.707,0l-.707-.707c-.195-.195-.195-.512,0-.707l1.768-1.768-1.768-1.768c-.195-.195-.195-.512,0-.707l.707-.707c.195-.195,.512-.195,.707,0l1.768,1.768,1.768-1.768c.195-.195,.512-.195,.707,0l.707,.707c.195,.195,.195,.512,0,.707l-1.768,1.768,1.768,1.768Z" fill="#F7F7F7"></path></g></svg></span>` : message;

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
    console.log(event.target);
    if (event.target.id === "modal-overlay") {
        event.target.style.display = "none";
    } else
    if (event.target.classList.contains("settings-donate")) {
        payment_link.type = "one-time";
        payment_link.label = "donate";
        window.location.href = build_payment_link_url();
    } else
    if (event.target.classList.contains("settings-subscribe")) {
        payment_link.label = "sub";
        window.location.href = build_payment_link_url();
    } else
    if (event.target.classList.contains("settings-pay")) {
        payment_link.type = "one-time";
        payment_link.label = "pay";
        window.location.href = build_payment_link_url();
    }
    if (event.target.classList.contains("modal")) {
        event.target.style.display = "none";
    }
};
document.addEventListener("DOMContentLoaded", function () {
    const recurring_label_element = document.querySelector("#recurring_label_div label.ms-label");
    if (payment_link.type === "sub") {
        if (recurring_label_element.classList.contains("hide")) {
            recurring_label_element.classList.remove("hide");
        }
    } else {
        if (!recurring_label_element.classList.contains("hide")) {
            recurring_label_element.classList.add("hide");
        }
    }    
});