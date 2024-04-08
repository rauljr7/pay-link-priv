function generateQRCode() {
    let base_url = window.location.origin;
    window.payment_link.amount = usd_amount_sanitize(document.getElementById("amount").value);
    let payment_link_url_string = window.payment_link;
    let user_url_string, amount_url_string, label_url_string, type_url_string, currency_url_string;
    if (payment_link_url_string.label === "logo") {
        label_url_string = "";
    } else {
        label_url_string = "/" + payment_link_url_string.label;
    }
    if (payment_link_url_string.type === "one-time") {
        type_url_string = "";
    } else {
        type_url_string = "/" + payment_link_url_string.type;
    }
    if (payment_link_url_string.currency === "USD") {
        currency_url_string = "";
    } else {
        currency_url_string = "/" + payment_link_url_string.currency;
    }
    user_url_string = "/@" + payment_link_url_string.user;
    amount_url_string = "/" + payment_link_url_string.amount;
    let payment_url_string = base_url + user_url_string + amount_url_string + label_url_string + type_url_string + currency_url_string;
    console.log(payment_url_string);

    // Ensure QR code is cleared before making a new one
    let qrContainer = document.getElementById("qr");
    qrContainer.innerHTML = ""; // Clear previous QR code
    let qrcode = new QRCode(qrContainer, {
        text: payment_url_string,
        width: 200,
        height: 200,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });
    document.getElementById("qr-title-2").innerHTML += `<h4 class="qr-title" style="color:black">$` + payment_link.amount + ` USD to @` + payment_link.user + `</h4>`;
}

function usd_amount_sanitize(amount_string) {
    if (amount_string.endsWith(".00")) {
      return amount_string.slice(0, -3);
    }
    return amount_string;
}

// Show the modal with QR code
function showModal() {
    generateQRCode(); // Generate QR code with the current payment_link
    document.getElementById("qr-modal").style.display = "block"; // Show the modal
}

// Example trigger for the modal
document.getElementById("gen-qr").onclick = function() {
    showModal();
}
