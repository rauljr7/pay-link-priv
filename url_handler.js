(function() {
function parse_url() {
    const url_sections = window.location.pathname.split('/').filter(url_partial => url_partial.trim() !== '');
    const payment_link_object = {
        type: "one-time",
        label: "logo",
        amount: "1",
        currency: "USD",
        user: ""
    };
    url_sections.forEach(url_partial => {
        if (url_partial === "one-time" || url_partial === "sub") {
            payment_link_object.type = url_partial;
        } else if (["logo", "checkout", "pay", "buy", "donate", "donation"].includes(url_partial)) {
            payment_link_object.label = url_partial;
        } else if (url_partial.match(/^@.+/)) { // Starts with @
            payment_link_object.user = url_partial.substring(1); // Remove '@'
        } else if (url_partial.length === 3 && /^[A-Z]{3}$/.test(url_partial)) { // Currency code
            payment_link_object.currency = url_partial;
        } else if (/^\d*(\.\d+)?$/.test(url_partial)) { // Matches a number with optional leading digits and decimal part
            payment_link_object.amount = url_partial;
        }
    });        
    return payment_link_object;
}
function reverse_usd_amount_sanitize(amount_string) {
    let parts = amount_string.split(".");
    if (parts.length === 1) {
        return amount_string + ".00";
    } else {
        let leftOfDecimal = parts[0] === "" ? "0" : parts[0];
        let rightOfDecimal = parts[1].length === 1 ? parts[1] + "0" : parts[1];
        rightOfDecimal = rightOfDecimal.substring(0, 2);
        return leftOfDecimal + "." + rightOfDecimal;
    }
}


window.payment_link = parse_url();
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("amount").value = reverse_usd_amount_sanitize(window.payment_link.amount);
    if (payment_link.type === "sub") {
        document.querySelector("#sub i").setAttribute("class", "fas fa-money-bill-1 fa-lg settings-pay");
        document.querySelector("#sub span").setAttribute("class", "settings-pay");
        document.querySelector("#sub i").setAttribute("alt", "One-time Payment");
        document.querySelector("#sub span").innerHTML = "Pay";
    }
    if (payment_link.label === "donate") {
        document.querySelector("#donate i").setAttribute("class", "fas fa-dollar fa-lg settings-pay");
        document.querySelector("#donate i").setAttribute("alt", "Pay");
        document.querySelector("#donate span").setAttribute("class", "settings-pay");
        document.querySelector("#donate span").innerHTML = "Pay";
    }
});
})();

function build_payment_link_url() {
    const base_url = window.location.origin;
    let url_parts = [];

    url_parts.push("@" + payment_link.user);
    url_parts.push(payment_link.amount);
    if (payment_link.type !== "one-time") {
        payment_link.label = "";
        url_parts.push(payment_link.type);
    }
    if (payment_link.label !== "logo") {
        url_parts.push(payment_link.label);
    }
    let full_url = base_url + "/" + url_parts.join("/");
    console.log(full_url);
    return full_url;
}