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
        } else if (["logo", "checkout", "pay", "buy", "donate", "sub"].includes(url_partial)) {
            payment_link_object.label = url_partial;
        } else if (url_partial.match(/^@.+/)) { // Starts with @
            payment_link_object.user = url_partial.substring(1); // Remove '@'
        } else if (url_partial.length === 3 && /^[A-Z]{3}$/.test(url_partial)) { // Currency code
            payment_link_object.currency = url_partial;
        } else if (/^\d+(\.\d+)?$/.test(url_partial)) { // Matches a number with optional decimal part
            payment_link_object.amount = url_partial;
        }
    });        
    return payment_link_object;
}
function usd_amount_sanitize(amount_string) {
    if (amount_string.endsWith(".00")) {
    return amount_string.slice(0, -3);
    }
    return amount_string;
}
function reverse_usd_amount_sanitize(amount_string) {
    if (!amount_string.includes(".")) {
        return amount_string + ".00";
    }
    return amount_string;
}

window.payment_link = parse_url();
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("amount").value = reverse_usd_amount_sanitize(window.payment_link.amount);
});

})();